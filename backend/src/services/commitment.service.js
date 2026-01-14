import { Commitment } from "../models/Commitment.model.js";
import { Client } from "../models/Client.model.js";
import { SecureLink } from "../models/SecureLink.model.js";
import { User } from "../models/User.model.js";
import { ChangeRequest } from "../models/ChangeRequest.model.js";
import { COMMITMENT_STATUS, LINK_PURPOSE } from "../constants/status.js";
import { AppError } from "../utils/errors.js";
import { appendEvent } from "./audit.service.js";
import { generateRawToken, createTokenHash, tokenExpiresAt } from "./token.service.js";
import { env } from "../config/env.js";
import mongoose from "mongoose";
import { sendApprovalEmail, sendAcceptanceEmail } from "./mail.service.js";


async function createCommitmentCore({
  orgId,
  userId,
  assignedToUserId,
  rootCommitmentId,
  previousCommitmentId,
  changeRequestId,
  version,
  status,
  data,
  session,
}) {
  const clientQuery = Client.findOne({ _id: data.clientId, orgId }).select("_id name email companyName");
  const client = session ? await clientQuery.session(session) : await clientQuery;

  if (!client) {
    const err = new Error("Client not found");
    err.statusCode = 404;
    throw err;
  }

  const doc = {
    orgId,
    clientId: client._id,
    clientSnapshot: {
      name: client.name,
      email: client.email,
      companyName: client.companyName,
    },

    title: data.title,

    // ✅ support both during transition
    scopeTitle: data.scopeTitle || undefined,
    scopeDescription: data.scopeDescription || data.scopeText,

    attachments: normalizeAttachments(data.attachments),
    paymentTerms: normalizePaymentTerms(data.paymentTerms),
    milestones: normalizeMilestones(data.milestones),
    approvalRules: normalizeApprovalRules(data.approvalRules),
    deliverables: normalizeDeliverables(data.deliverables),

    amount: data.amount,
    currency: data.currency || "INR",

    status: status || COMMITMENT_STATUS.DRAFT,
    version: version || 1,
    createdByUserId: userId,
    assignedToUserId: assignedToUserId || undefined,
    rootCommitmentId: rootCommitmentId || undefined,
    previousCommitmentId: previousCommitmentId || undefined,
    changeRequestId: changeRequestId || undefined,
  };

  const created = await Commitment.create([doc], session ? { session } : undefined);
  const c = created[0];

  if (!doc.rootCommitmentId) {
    await Commitment.updateOne(
      { _id: c._id, orgId },
      { $set: { rootCommitmentId: c._id } },
      session ? { session } : undefined
    );
  }

  // history event
  await appendEvent(
    {
      orgId,
      commitmentId: c._id,
      commitmentVersion: c.version,
      actorType: "USER",
      actorUserId: userId,
      type: "COMMITMENT_CREATED",
      message: c.title,
    },
    session ? { session } : undefined
  );

  // return populated
  const findQ = Commitment.findOne({ _id: c._id, orgId }).populate({
    path: "clientId",
    select: "_id name email phone companyName status isActive createdAt updatedAt",
  });

  findQ.populate(ASSIGNEE_POPULATE);
  return session ? await findQ.session(session).lean() : await findQ.lean();
}

async function ensureAssignee({ orgId, assignedToUserId }) {
  if (!assignedToUserId) return undefined;
  const user = await User.findOne({ _id: assignedToUserId, orgId, isActive: true }).lean();
  if (!user) throw new AppError("Assignee not found", 404, "NOT_FOUND");
  return user._id;
}

export async function createCommitment({ orgId, userId, assignedToUserId, data }) {
  // ✅ Try transaction. If Mongo doesn't support it (standalone), fallback safely.
  let session = null;

  try {
    session = await mongoose.startSession();
    session.startTransaction();

    const assignee = await ensureAssignee({ orgId, assignedToUserId });
    const result = await createCommitmentCore({
      orgId,
      userId,
      assignedToUserId: assignee,
      data,
      session,
    });

    await session.commitTransaction();
    return result;
  } catch (err) {
    // Fallback for standalone mongo (local dev)
    const msg = String(err?.message || "");
    const isTxError =
      msg.includes("Transaction numbers are only allowed") ||
      msg.includes("replica set") ||
      msg.includes("mongos");

    if (isTxError) {
      // Close session if created
      try { if (session) session.endSession(); } catch {}

      // ✅ re-run without transaction
      const assignee = await ensureAssignee({ orgId, assignedToUserId });
      return await createCommitmentCore({
        orgId,
        userId,
        assignedToUserId: assignee,
        data,
        session: null,
      });
    }

    // If it’s NOT a tx-support error, throw real error
    try { if (session) await session.abortTransaction(); } catch {}
    throw err;
  } finally {
    try { if (session) session.endSession(); } catch {}
  }
}

const CLIENT_POPULATE = {
  path: "clientId",
  select: "_id name email phone companyName status isActive createdAt updatedAt",
};
const PREVIOUS_COMMITMENT_POPULATE = {
  path: "previousCommitmentId",
  select: "_id title version status createdAt",
};
const ASSIGNEE_POPULATE = {
  path: "assignedToUserId",
  select: "_id name email",
};

function assertAssigned(c, role, userId) {
  if (role === "MANAGER" && String(c.assignedToUserId || "") !== String(userId)) {
    throw new AppError("Not allowed", 403, "FORBIDDEN");
  }
}

function toISODateOrNull(v) {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function normalizeApprovalRules(input, fallback) {
  const r = input ?? fallback ?? {};
  const approver =
    r.approver === "BOTH_PARTIES" || r.approver === "CLIENT_ONLY" ? r.approver : "CLIENT_ONLY";

  return {
    approver,
    reApprovalOnChanges: typeof r.reApprovalOnChanges === "boolean" ? r.reApprovalOnChanges : true,
    acceptanceRequired: typeof r.acceptanceRequired === "boolean" ? r.acceptanceRequired : true,
  };
}

function normalizeAttachments(arr, actorUserId) {
  if (!Array.isArray(arr)) return [];
  return arr
    .filter(Boolean)
    .map((a) => ({
      url: a.url || a.secureUrl,
      publicId: a.publicId,
      fileName: a.fileName || a.originalName,
      originalName: a.originalName,
      mimeType: a.mimeType,
      bytes: a.bytes,
      resourceType: a.resourceType || "raw",
      uploadedAt: a.uploadedAt ? new Date(a.uploadedAt) : new Date(),
      uploadedByUserId: a.uploadedByUserId || actorUserId,
    }))
    .filter((a) => a.url && a.publicId);
}

function normalizePaymentTerms(arr) {
  if (!Array.isArray(arr)) return [];
  return arr
    .filter(Boolean)
    .map((p) => ({
      text: String(p.text || "").trim(),
      status: p.status || "PENDING",
      dueAt: p.dueAt ? new Date(p.dueAt) : undefined,
      paidAt: p.paidAt ? new Date(p.paidAt) : undefined,
      amount: typeof p.amount === "number" ? p.amount : undefined,
      currency: p.currency,
    }))
    .filter((p) => p.text);
}

function normalizeMilestones(arr) {
  if (!Array.isArray(arr)) return [];
  return arr
    .filter(Boolean)
    .map((m) => ({
      text: String(m.text || "").trim(),
      status: m.status || "NOT_STARTED",
      dueAt: m.dueAt ? new Date(m.dueAt) : undefined,
      completedAt: m.completedAt ? new Date(m.completedAt) : undefined,
    }))
    .filter((m) => m.text);
}

function normalizeDeliverables(arr) {
  if (!Array.isArray(arr)) return [];

  return arr
    .filter(Boolean)
    .map((d) => ({
      text: String(d.text).trim(),
      status: d.status || "NOT_STARTED", 
      // NOT_STARTED | IN_PROGRESS | DELIVERED | ACCEPTED | REJECTED

      dueAt: d.dueAt ? new Date(d.dueAt) : undefined,
       completedAt: d.completedAt ? new Date(d.completedAt) : undefined,
    }))
    .filter((d) => d.text); // hard requirement
}


function deepEqualJSON(a, b) {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

function didScopeOrTermsChange(existing, updates) {
  const stripStatuses = (items = []) =>
    items.map((item) => ({
      text: item?.text || "",
    }));

  if (updates.scopeTitle !== undefined && updates.scopeTitle !== existing.scopeTitle) return true;

  const existingScopeDesc = existing.scopeDescription || existing.scopeText || "";
  if (updates.scopeDescription !== undefined && updates.scopeDescription !== existingScopeDesc) return true;

  if (updates.title !== undefined && updates.title !== existing.title) return true;

  if (updates.amount !== undefined && updates.amount !== existing.amount) return true;
  if (updates.currency !== undefined && updates.currency !== existing.currency) return true;

  if (
    updates.paymentTerms !== undefined &&
    !deepEqualJSON(stripStatuses(updates.paymentTerms), stripStatuses(existing.paymentTerms))
  ) {
    return true;
  }
  if (
    updates.milestones !== undefined &&
    !deepEqualJSON(stripStatuses(updates.milestones), stripStatuses(existing.milestones))
  ) {
    return true;
  }
  if (updates.approvalRules !== undefined && !deepEqualJSON(updates.approvalRules, existing.approvalRules)) return true;

  return false;
}

function needsVersionBump(existing, updates) {
  const rules = normalizeApprovalRules(undefined, existing.approvalRules);
  if (!rules.reApprovalOnChanges) return false;

  const wasSentOrApproved = !!(existing.approvalSentAt || existing.approvedAt);
  if (!wasSentOrApproved) return false;

  return didScopeOrTermsChange(existing, updates);
}

async function getClientOrSnapshot({ orgId, commitment }) {
  // Prefer live client
  const client = await Client.findOne({ _id: commitment.clientId, orgId }).lean();
  if (client) return client;

  // Fallback to snapshot (so email sending doesn't crash if client was deleted)
  const snap = commitment.clientSnapshot || {};
  if (snap.email) {
    return {
      _id: commitment.clientId,
      name: snap.name,
      email: snap.email,
      companyName: snap.companyName,
    };
  }

  throw new AppError("Client not found", 404, "NOT_FOUND");
}

/**
 * LIST
 */
export async function listCommitments({ orgId, role, userId, filters }) {
  const q = { orgId };

  if (filters.status) q.status = filters.status;
  if (filters.clientId) q.clientId = filters.clientId;
  if (filters.assignedTo) q.assignedToUserId = filters.assignedTo;

  if (filters.from || filters.to) {
    q.createdAt = {};
    const from = toISODateOrNull(filters.from);
    const to = toISODateOrNull(filters.to);
    if (from) q.createdAt.$gte = from;
    if (to) q.createdAt.$lte = to;
  }

  if (role === "MANAGER") q.assignedToUserId = userId;

  const page = Number(filters.page || 1);
  const limit = Math.min(Number(filters.limit || 20), 100);
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Commitment.find(q)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate(CLIENT_POPULATE)
      .populate(PREVIOUS_COMMITMENT_POPULATE)
      .populate(ASSIGNEE_POPULATE)
      .lean(),
    Commitment.countDocuments(q),
  ]);

  return { items, page, limit, total };
}

/**
 * GET ONE
 */
export async function getCommitment({ orgId, role, userId, id }) {
  const q = { _id: id, orgId };
  if (role === "MANAGER") q.assignedToUserId = userId;

  const c = await Commitment.findOne(q)
    .populate(CLIENT_POPULATE)
    .populate(PREVIOUS_COMMITMENT_POPULATE)
    .populate(ASSIGNEE_POPULATE)
    .lean();
  if (!c) throw new AppError("Commitment not found", 404, "NOT_FOUND");

  return c;
}

/**
 * UPDATE
 */
export async function updateCommitment({ orgId, role, userId, id, patch }) {
  const c = await Commitment.findOne({ _id: id, orgId }).lean();
  if (!c) throw new AppError("Commitment not found", 404, "NOT_FOUND");
  assertAssigned(c, role, userId);

  const lockedStatuses = [
    COMMITMENT_STATUS.IN_PROGRESS,
    COMMITMENT_STATUS.CHANGE_REQUEST_CREATED,
    COMMITMENT_STATUS.DELIVERED,
    COMMITMENT_STATUS.ACCEPTED,
    COMMITMENT_STATUS.CLOSED,
    COMMITMENT_STATUS.CANCELLED,
  ];
  const lockedFields = [
    "title",
    "scopeTitle",
    "scopeDescription",
    "scopeText",
    "amount",
    "currency",
    "attachments",
    "approvalRules",
  ];
  const isLocked =
    lockedStatuses.includes(c.status) ||
    (c.status === COMMITMENT_STATUS.AWAITING_CLIENT_APPROVAL && !c.changeRequestId);

  const deliverablesLockedStatuses = [
    COMMITMENT_STATUS.DELIVERED,
    COMMITMENT_STATUS.ACCEPTED,
    COMMITMENT_STATUS.CLOSED,
    COMMITMENT_STATUS.CANCELLED,
  ];
  if (Array.isArray(patch?.deliverables) && deliverablesLockedStatuses.includes(c.status)) {
    throw new AppError("Deliverables cannot be edited after delivery", 400, "INVALID_STATE");
  }

  const termsLockedStatuses = [
    COMMITMENT_STATUS.ACCEPTED,
    COMMITMENT_STATUS.CLOSED,
    COMMITMENT_STATUS.CANCELLED,
  ];
  if (Array.isArray(patch?.paymentTerms) && termsLockedStatuses.includes(c.status)) {
    throw new AppError("Payment terms cannot be edited after delivery", 400, "INVALID_STATE");
  }
  if (Array.isArray(patch?.milestones) && termsLockedStatuses.includes(c.status)) {
    throw new AppError("Milestones cannot be edited after delivery", 400, "INVALID_STATE");
  }
  if (isLocked) {
    const attemptedLocked = lockedFields.some((f) => patch?.[f] !== undefined);
    if (attemptedLocked) {
      throw new AppError("Commitment is locked after approval", 400, "INVALID_STATE");
    }
  }

  const updates = {};
  let bumped = false;

  if (typeof patch.title === "string") updates.title = patch.title.trim();
  if (typeof patch.scopeTitle === "string") updates.scopeTitle = patch.scopeTitle.trim();

  if (typeof patch.scopeDescription === "string") updates.scopeDescription = patch.scopeDescription;
  if (typeof patch.scopeText === "string" && updates.scopeDescription === undefined) {
    updates.scopeDescription = patch.scopeText;
  }

  if (typeof patch.amount === "number") updates.amount = patch.amount;
  if (typeof patch.currency === "string") updates.currency = patch.currency;

  if (Array.isArray(patch.attachments)) updates.attachments = normalizeAttachments(patch.attachments, userId);
  if (Array.isArray(patch.paymentTerms)) updates.paymentTerms = normalizePaymentTerms(patch.paymentTerms);
  if (Array.isArray(patch.milestones)) updates.milestones = normalizeMilestones(patch.milestones);
  if (Array.isArray(patch.deliverables)) updates.deliverables = normalizeDeliverables(patch.deliverables);

  if (patch.approvalRules && typeof patch.approvalRules === "object") {
    updates.approvalRules = normalizeApprovalRules(patch.approvalRules, c.approvalRules);
  }

  if (needsVersionBump(c, updates)) {
    updates.version = (c.version || 1) + 1;
    updates.status = COMMITMENT_STATUS.AWAITING_CLIENT_APPROVAL;
    updates.approvalSentAt = null;
    updates.approvedAt = null;
    updates.deliveredAt = null;
    updates.acceptedAt = null;
    bumped = true;
  }

  if (Object.keys(updates).length === 0) {
    return await Commitment.findOne({ _id: id, orgId })
      .populate(CLIENT_POPULATE)
      .populate(ASSIGNEE_POPULATE)
      .lean();
  }

  const updated = await Commitment.findOneAndUpdate(
    { _id: id, orgId },
    { $set: updates },
    { new: true }
  )
    .populate(CLIENT_POPULATE)
    .populate(ASSIGNEE_POPULATE)
    .lean();

  await appendEvent({
    orgId,
    commitmentId: id,
    commitmentVersion: updated.version,
    actorType: "USER",
    actorUserId: userId,
    type: bumped ? "SCOPE_TERMS_UPDATED_VERSION_BUMP" : "COMMITMENT_UPDATED",
    message: bumped ? "Scope/terms updated; re-approval required" : "Updated",
  });

  return updated;
}

/**
 * ASSIGN
 */
export async function assignCommitment({ orgId, userId, id, assignedToUserId }) {
  await ensureAssignee({ orgId, assignedToUserId });
  const updated = await Commitment.findOneAndUpdate(
    { _id: id, orgId },
    { $set: { assignedToUserId } },
    { new: true }
  )
    .populate(CLIENT_POPULATE)
    .populate(ASSIGNEE_POPULATE)
    .lean();

  if (!updated) throw new AppError("Commitment not found", 404, "NOT_FOUND");

  await appendEvent({
    orgId,
    commitmentId: id,
    commitmentVersion: updated.version,
    actorType: "USER",
    actorUserId: userId,
    type: "COMMITMENT_ASSIGNED",
    message: String(assignedToUserId),
  });

  return updated;
}

/**
 * MARK DELIVERED
 * - If acceptanceRequired = false => auto-complete.
 * - Else => DELIVERED.
 */
export async function markDelivered({ orgId, role, userId, id }) {
  const c = await Commitment.findOne({ _id: id, orgId }).lean();
  if (!c) throw new AppError("Commitment not found", 404, "NOT_FOUND");
  assertAssigned(c, role, userId);
  if (c.status !== COMMITMENT_STATUS.IN_PROGRESS) {
    throw new AppError("Commitment is not in progress", 400, "INVALID_STATE");
  }
  const deliverables = Array.isArray(c.deliverables) ? c.deliverables : [];
  if (deliverables.length > 0) {
    const incomplete = deliverables.some((d) => {
      const s = String(d?.status || "").toUpperCase();
      return s !== "DELIVERED" && s !== "ACCEPTED";
    });
    if (incomplete) {
      throw new AppError("All deliverables must be delivered before marking delivered", 400, "INVALID_STATE");
    }
  }

  const rules = normalizeApprovalRules(undefined, c.approvalRules);
  const now = new Date();

  const set = { deliveredAt: now };
  if (rules.acceptanceRequired) {
    set.status = COMMITMENT_STATUS.DELIVERED;
  } else {
    set.status = COMMITMENT_STATUS.CLOSED;
    set.acceptedAt = now;
  }

  const updated = await Commitment.findOneAndUpdate({ _id: id, orgId }, { $set: set }, { new: true })
    .populate(CLIENT_POPULATE)
    .populate(ASSIGNEE_POPULATE)
    .lean();

  await appendEvent({
    orgId,
    commitmentId: id,
    commitmentVersion: updated.version,
    actorType: "USER",
    actorUserId: userId,
    type: rules.acceptanceRequired ? "MARKED_DELIVERED" : "MARKED_DELIVERED_AUTO_ACCEPTED",
    message: rules.acceptanceRequired ? "Delivered" : "Delivered (auto-accepted)",
  });

  return updated;
}

/**
 * CREATE SECURE LINK (approval/acceptance)
 */
async function createLink({ orgId, commitment, purpose }) {
  const raw = generateRawToken();
  const tokenHash = createTokenHash(raw);

  await SecureLink.create({
    orgId,
    commitmentId: commitment._id,
    commitmentVersion: commitment.version,
    purpose,
    tokenHash,
    expiresAt: tokenExpiresAt(env.tokenTtlHours),
  });

  const url = `${env.publicBaseUrl}/${
    purpose === LINK_PURPOSE.APPROVAL ? "approve" : "accept"
  }/${raw}`;

  return url;
}

/**
 * SEND/RESEND APPROVAL LINK
 */
export async function sendApprovalLink({ orgId, role, userId, id, resend = false }) {
  const c = await Commitment.findOne({ _id: id, orgId }).lean();
  if (!c) throw new AppError("Commitment not found", 404, "NOT_FOUND");
  assertAssigned(c, role, userId);
  const allowed = [COMMITMENT_STATUS.DRAFT, COMMITMENT_STATUS.INTERNAL_REVIEW];
  if (resend) allowed.push(COMMITMENT_STATUS.AWAITING_CLIENT_APPROVAL);
  if (!allowed.includes(c.status)) {
    throw new AppError("Commitment is not ready for client approval", 400, "INVALID_STATE");
  }

  const updated = await Commitment.findOneAndUpdate(
    { _id: id, orgId },
    { $set: { approvalSentAt: new Date(), status: COMMITMENT_STATUS.AWAITING_CLIENT_APPROVAL } },
    { new: true }
  ).lean();

  const client = await getClientOrSnapshot({ orgId, commitment: updated });

  const url = await createLink({ orgId, commitment: updated, purpose: LINK_PURPOSE.APPROVAL });

  await appendEvent({
    orgId,
    commitmentId: id,
    commitmentVersion: updated.version,
    actorType: "USER",
    actorUserId: userId,
    type: resend ? "APPROVAL_LINK_RESENT" : "APPROVAL_LINK_SENT",
    message: client.email,
  });

  await sendApprovalEmail({
    to: client.email,
    subject: `Approval needed: ${updated.title}`,
    approvalUrl: url,
  });

  return { approvalUrl: url };
}

/**
 * SEND/RESEND ACCEPTANCE LINK
 * Requires:
 * - deliveredAt exists
 * - acceptanceRequired = true
 */
export async function sendAcceptanceLink({ orgId, role, userId, id, resend = false }) {
  const c = await Commitment.findOne({ _id: id, orgId }).lean();
  if (!c) throw new AppError("Commitment not found", 404, "NOT_FOUND");
  assertAssigned(c, role, userId);

  const rules = normalizeApprovalRules(undefined, c.approvalRules);
  if (!rules.acceptanceRequired) {
    throw new AppError("Acceptance not required for this commitment", 400, "INVALID_STATE");
  }

  if (!c.deliveredAt) {
    throw new AppError("Acceptance can be sent only after delivery", 400, "INVALID_STATE");
  }

  if (c.status !== COMMITMENT_STATUS.DELIVERED) {
    throw new AppError("Acceptance can be sent only after delivery", 400, "INVALID_STATE");
  }

  const client = await getClientOrSnapshot({ orgId, commitment: c });

  const url = await createLink({ orgId, commitment: c, purpose: LINK_PURPOSE.ACCEPTANCE });

  await appendEvent({
    orgId,
    commitmentId: id,
    commitmentVersion: c.version,
    actorType: "USER",
    actorUserId: userId,
    type: resend ? "ACCEPTANCE_LINK_RESENT" : "ACCEPTANCE_LINK_SENT",
    message: client.email,
  });

  await sendAcceptanceEmail({
    to: client.email,
    subject: `Acceptance needed: ${c.title}`,
    acceptanceUrl: url,
  });

  return { acceptanceUrl: url };
}

async function createChangeRequest({
  orgId,
  commitment,
  reason,
  requestedByType,
  requestedBy,
  meta,
  session,
}) {
  const existing = await ChangeRequest.findOne({
    orgId,
    commitmentId: commitment._id,
    status: "OPEN",
  }).lean();
  if (existing) throw new AppError("Change request already open", 409, "CONFLICT");

  const doc = {
    orgId,
    commitmentId: commitment._id,
    commitmentVersion: commitment.version,
    reason: reason.trim(),
    status: "OPEN",
    previousStatus: commitment.status,
    requestedByType,
    requestedBy,
    meta,
  };

  const created = await ChangeRequest.create([doc], session ? { session } : undefined);
  return created[0];
}

/**
 * CONSUME APPROVAL TOKEN (public)
 * action:
 * - "approve"
 * - "request_change"
 */
export async function consumeApprovalToken({ tokenHash, action, comment, meta }) {
  const link = await SecureLink.findOneAndUpdate(
    { tokenHash, purpose: LINK_PURPOSE.APPROVAL, usedAt: null, expiresAt: { $gt: new Date() } },
    { $set: { usedAt: new Date() } },
    { new: true }
  ).lean();

  if (!link) throw new AppError("Link invalid/expired/used", 400, "LINK_INVALID");

  const commitment = await Commitment.findById(link.commitmentId).lean();
  if (!commitment) throw new AppError("Commitment not found", 404, "NOT_FOUND");
  if (commitment.version !== link.commitmentVersion) throw new AppError("Old version link", 400, "LINK_OLD_VERSION");

  if (action === "request_change") {
    const client = await getClientOrSnapshot({ orgId: link.orgId, commitment });
    const changeRequest = await createChangeRequest({
      orgId: link.orgId,
      commitment,
      reason: comment || "Change requested",
      requestedByType: "CLIENT",
      requestedBy: { name: client?.name, email: client?.email },
      meta,
    });
    const updated = await Commitment.findOneAndUpdate(
      { _id: commitment._id, orgId: link.orgId },
      { $set: { status: COMMITMENT_STATUS.CHANGE_REQUEST_CREATED } },
      { new: true }
    ).lean();

    await appendEvent({
      orgId: link.orgId,
      commitmentId: commitment._id,
      commitmentVersion: commitment.version,
      actorType: "CLIENT",
      type: "CLIENT_REQUESTED_CHANGE",
      message: comment || "Change requested",
      meta: { ...meta, changeRequestId: String(changeRequest._id) },
    });

    return { status: updated.status, changeRequestId: String(changeRequest._id) };
  }

  // approve
  const updated = await Commitment.findOneAndUpdate(
    { _id: commitment._id, orgId: link.orgId },
    { $set: { approvedAt: new Date(), status: COMMITMENT_STATUS.IN_PROGRESS } },
    { new: true }
  ).lean();

  await appendEvent({
    orgId: link.orgId,
    commitmentId: commitment._id,
    commitmentVersion: commitment.version,
    actorType: "CLIENT",
    type: "CLIENT_APPROVED",
    message: comment || "Approved",
    meta,
  });

  return { status: updated.status };
}

/**
 * CONSUME ACCEPTANCE TOKEN (public)
 */
export async function consumeAcceptanceToken({ tokenHash, comment, meta }) {
  const link = await SecureLink.findOneAndUpdate(
    { tokenHash, purpose: LINK_PURPOSE.ACCEPTANCE, usedAt: null, expiresAt: { $gt: new Date() } },
    { $set: { usedAt: new Date() } },
    { new: true }
  ).lean();

  if (!link) throw new AppError("Link invalid/expired/used", 400, "LINK_INVALID");

  const commitment = await Commitment.findById(link.commitmentId).lean();
  if (!commitment) throw new AppError("Commitment not found", 404, "NOT_FOUND");
  if (commitment.version !== link.commitmentVersion) throw new AppError("Old version link", 400, "LINK_OLD_VERSION");

  const updated = await Commitment.findOneAndUpdate(
    { _id: commitment._id, orgId: link.orgId },
    { $set: { status: COMMITMENT_STATUS.CLOSED, acceptedAt: new Date() } },
    { new: true }
  ).lean();

  await appendEvent({
    orgId: link.orgId,
    commitmentId: commitment._id,
    commitmentVersion: commitment.version,
    actorType: "CLIENT",
    type: "CLIENT_ACCEPTED",
    message: comment || "Accepted",
    meta,
  });

  return { status: updated.status };
}

export async function listChangeRequests({ orgId, commitmentId }) {
  return await ChangeRequest.find({ orgId, commitmentId })
    .sort({ createdAt: -1 })
    .lean();
}

export async function acceptChangeRequest({
  orgId,
  userId,
  role,
  commitmentId,
  changeRequestId,
  patch,
  assignedToUserId,
  resolutionNote,
}) {
  const commitment = await Commitment.findOne({ _id: commitmentId, orgId }).lean();
  if (!commitment) throw new AppError("Commitment not found", 404, "NOT_FOUND");
  assertAssigned(commitment, role, userId);

  const changeRequest = await ChangeRequest.findOne({
    _id: changeRequestId,
    orgId,
    commitmentId,
    status: "OPEN",
  }).lean();
  if (!changeRequest) throw new AppError("Change request not found", 404, "NOT_FOUND");

  const assignee = assignedToUserId
    ? await ensureAssignee({ orgId, assignedToUserId })
    : commitment.assignedToUserId;

  const data = {
    clientId: String(commitment.clientId),
    title: patch.title ?? commitment.title,
    scopeTitle: patch.scopeTitle ?? commitment.scopeTitle,
    scopeDescription:
      patch.scopeDescription ?? patch.scopeText ?? commitment.scopeDescription ?? commitment.scopeText,
    scopeText: undefined,
    attachments: patch.attachments ?? commitment.attachments,
    paymentTerms: patch.paymentTerms ?? commitment.paymentTerms,
    milestones: patch.milestones ?? commitment.milestones,
    approvalRules: patch.approvalRules ?? commitment.approvalRules,
    deliverables: commitment.deliverables,
    amount: patch.amount ?? commitment.amount,
    currency: patch.currency ?? commitment.currency,
  };

  const newVersion = await createCommitmentCore({
    orgId,
    userId,
    assignedToUserId: assignee,
    rootCommitmentId: commitment.rootCommitmentId || commitment._id,
    previousCommitmentId: commitment._id,
    changeRequestId: changeRequest._id,
    version: (commitment.version || 1) + 1,
    status: COMMITMENT_STATUS.AWAITING_CLIENT_APPROVAL,
    data,
    session: null,
  });

  await ChangeRequest.updateOne(
    { _id: changeRequest._id, orgId },
    {
      $set: {
        status: "ACCEPTED",
        resolvedAt: new Date(),
        resolutionNote: resolutionNote || undefined,
        createdVersionId: newVersion._id,
      },
    }
  );

  await appendEvent({
    orgId,
    commitmentId,
    commitmentVersion: commitment.version,
    actorType: "USER",
    actorUserId: userId,
    type: "CHANGE_REQUEST_ACCEPTED",
    message: String(newVersion._id),
  });

  return newVersion;
}

export async function rejectChangeRequest({
  orgId,
  userId,
  role,
  commitmentId,
  changeRequestId,
  resolutionNote,
}) {
  const commitment = await Commitment.findOne({ _id: commitmentId, orgId }).lean();
  if (!commitment) throw new AppError("Commitment not found", 404, "NOT_FOUND");
  assertAssigned(commitment, role, userId);

  const changeRequest = await ChangeRequest.findOne({
    _id: changeRequestId,
    orgId,
    commitmentId,
    status: "OPEN",
  }).lean();
  if (!changeRequest) throw new AppError("Change request not found", 404, "NOT_FOUND");

  await ChangeRequest.updateOne(
    { _id: changeRequest._id, orgId },
    {
      $set: {
        status: "REJECTED",
        resolvedAt: new Date(),
        resolutionNote: resolutionNote || undefined,
      },
    }
  );

  if (changeRequest.previousStatus) {
    await Commitment.updateOne(
      { _id: commitmentId, orgId },
      { $set: { status: changeRequest.previousStatus } }
    );
  }

  await appendEvent({
    orgId,
    commitmentId,
    commitmentVersion: commitment.version,
    actorType: "USER",
    actorUserId: userId,
    type: "CHANGE_REQUEST_REJECTED",
    message: resolutionNote || "Rejected",
  });

  return { status: "REJECTED" };
}

/**
 * HISTORY
 */
export async function getHistory({ orgId, commitmentId }) {
  const { ApprovalEvent } = await import("../models/ApprovalEvent.model.js");
  const events = await ApprovalEvent.find({ orgId, commitmentId }).sort({ createdAt: 1 }).lean();
  return events;
}
