import { Organization } from "../models/Organization.model.js";
import { User } from "../models/User.model.js";
import { ApprovalEvent } from "../models/ApprovalEvent.model.js";
import { ActivityLog } from "../models/ActivityLog.model.js";
import { MasterSetting } from "../models/MasterSetting.model.js";
import { ok } from "../utils/response.js";
import { AppError } from "../utils/errors.js";

function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

async function logActivity(req, { action, details, targetType, targetId, meta }) {
  if (!req.user) return;
  try {
    await ActivityLog.create({
      orgId: req.user.orgId,
      actorUserId: req.user.userId,
      actorName: req.user.name,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action,
      details,
      targetType,
      targetId,
      meta,
      ipAddress: req.ip,
    });
  } catch (err) {
    // Avoid blocking core flows on log failures
    console.error("Failed to write activity log", err);
  }
}

function normalizeOrg(org) {
  if (!org) return null;
  return {
    id: String(org._id),
    name: org.name,
    contactEmail: org.contactEmail || "",
    timezone: org.timezone || "Asia/Kolkata",
    currency: org.currency || "INR",
    approvalDefaults: {
      requireApproval: org.approvalDefaults?.requireApproval ?? true,
      reApprovalOnChanges: org.approvalDefaults?.reApprovalOnChanges ?? true,
      acceptanceRequired: org.approvalDefaults?.acceptanceRequired ?? true,
    },
    notificationSettings: {
      approvalReminders: org.notificationSettings?.approvalReminders ?? true,
      riskAlerts: org.notificationSettings?.riskAlerts ?? true,
    },
  };
}

export async function getOrganizationSettings(req, res) {
  const org = await Organization.findById(req.user.orgId).lean();
  if (!org) throw new AppError("Org not found", 404, "NOT_FOUND");
  return ok(res, { organization: normalizeOrg(org) }, req.id);
}

export async function updateOrganizationSettings(req, res) {
  const org = await Organization.findById(req.user.orgId);
  if (!org) throw new AppError("Org not found", 404, "NOT_FOUND");

  const body = req.validated.body || {};

  if (body.name !== undefined) org.name = body.name;
  if (body.contactEmail !== undefined) org.contactEmail = body.contactEmail;
  if (body.timezone !== undefined) org.timezone = body.timezone;
  if (body.currency !== undefined) org.currency = body.currency;

  if (body.approvalDefaults) {
    org.approvalDefaults = {
      ...org.approvalDefaults?.toObject?.(),
      ...body.approvalDefaults,
    };
  }
  if (body.notificationSettings) {
    org.notificationSettings = {
      ...org.notificationSettings?.toObject?.(),
      ...body.notificationSettings,
    };
  }

  await org.save();

  await logActivity(req, {
    action: "ORG_SETTINGS_UPDATED",
    details: "Organization settings updated",
    targetType: "Organization",
    targetId: org._id,
  });

  return ok(res, { organization: normalizeOrg(org) }, req.id);
}

export async function listTeamMembers(req, res) {
  const users = await User.find({ orgId: req.user.orgId }).sort({ createdAt: 1 }).lean();
  const items = users.map((u) => ({
    id: String(u._id),
    name: u.name,
    email: u.email,
    role: u.role,
    isActive: u.isActive,
    lastActiveAt: u.updatedAt || u.createdAt,
    createdAt: u.createdAt,
  }));
  return ok(res, { items }, req.id);
}

export async function updateTeamMember(req, res) {
  const { id } = req.params;
  const body = req.validated.body || {};

  if (req.user.userId === id && body.isActive === false) {
    throw new AppError("You cannot deactivate your own account", 400, "INVALID_STATE");
  }
  if (req.user.userId === id && body.role && body.role !== req.user.role) {
    throw new AppError("You cannot change your own role", 400, "INVALID_STATE");
  }

  const user = await User.findOne({ _id: id, orgId: req.user.orgId });
  if (!user) throw new AppError("User not found", 404, "NOT_FOUND");

  const prevRole = user.role;
  const prevActive = user.isActive;

  if (body.role !== undefined) user.role = body.role;
  if (body.isActive !== undefined) user.isActive = body.isActive;

  await user.save();

  const changes = [];
  if (body.role && body.role !== prevRole) changes.push(`role -> ${body.role}`);
  if (body.isActive !== undefined && body.isActive !== prevActive) {
    changes.push(`active -> ${body.isActive ? "true" : "false"}`);
  }

  await logActivity(req, {
    action: "TEAM_MEMBER_UPDATED",
    details: `Updated team member ${user.name}${changes.length ? ` (${changes.join(", ")})` : ""}`,
    targetType: "User",
    targetId: user._id,
  });

  return ok(
    res,
    {
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        lastActiveAt: user.updatedAt || user.createdAt,
        createdAt: user.createdAt,
      },
    },
    req.id
  );
}

export async function listActivityLog(req, res) {
  const { from, to, actorId, action, limit } = req.validated.query || {};
  const query = { orgId: req.user.orgId };

  if (actorId) query.actorUserId = actorId;
  if (action) query.type = action;

  const fromDate = parseDate(from);
  const toDate = parseDate(to);
  if (fromDate || toDate) {
    query.createdAt = {};
    if (fromDate) query.createdAt.$gte = fromDate;
    if (toDate) query.createdAt.$lte = toDate;
  }

  const items = await ApprovalEvent.find(query)
    .sort({ createdAt: -1 })
    .limit(limit || 200)
    .populate({ path: "actorUserId", select: "_id name email role" })
    .lean();

  const mapped = items.map((item) => {
    const actorUser = item.actorUserId && typeof item.actorUserId === "object" ? item.actorUserId : null;
    const actorName =
      item.actorType === "CLIENT" ? "Client" : actorUser?.name || "Unknown";
    const actorEmail =
      item.actorType === "CLIENT" ? "" : actorUser?.email || "";
    return {
      id: String(item._id),
      createdAt: item.createdAt,
      actor: {
        id: actorUser?._id ? String(actorUser._id) : null,
        name: actorName,
        email: actorEmail,
        role: actorUser?.role || "",
      },
      action: item.type,
      details: item.message || "",
      ipAddress: item.meta?.ip || item.meta?.ipAddress || "",
      targetType: "Commitment",
      targetId: item.commitmentId ? String(item.commitmentId) : "",
      meta: item.meta || null,
    };
  });

  return ok(res, { items: mapped }, req.id);
}

export async function listMasters(req, res) {
  const { type, limit } = req.validated.query || {};
  const query = { orgId: req.user.orgId };
  if (type) query.type = type;
  const items = await MasterSetting.find(query)
    .sort({ createdAt: 1 })
    .limit(limit || 200)
    .lean();
  const mapped = items.map((item) => ({
    id: String(item._id),
    type: item.type,
    label: item.label,
    color: item.color,
    active: item.active,
    usageCount: item.usageCount || 0,
    createdAt: item.createdAt,
  }));
  return ok(res, { items: mapped }, req.id);
}

export async function createMaster(req, res) {
  const body = req.validated.body || {};
  const master = await MasterSetting.create({
    orgId: req.user.orgId,
    type: body.type,
    label: body.label,
    color: body.color,
    active: body.active !== undefined ? body.active : true,
    createdBy: req.user.userId,
    updatedBy: req.user.userId,
  });

  await logActivity(req, {
    action: "MASTER_CREATED",
    details: `Created ${body.type} "${body.label}"`,
    targetType: "MasterSetting",
    targetId: master._id,
  });

  return ok(
    res,
    {
      item: {
        id: String(master._id),
        type: master.type,
        label: master.label,
        color: master.color,
        active: master.active,
        usageCount: master.usageCount || 0,
      },
    },
    req.id
  );
}

export async function updateMaster(req, res) {
  const { id } = req.params;
  const body = req.validated.body || {};
  const master = await MasterSetting.findOne({ _id: id, orgId: req.user.orgId });
  if (!master) throw new AppError("Master setting not found", 404, "NOT_FOUND");

  if (body.label !== undefined) master.label = body.label;
  if (body.color !== undefined) master.color = body.color;
  master.updatedBy = req.user.userId;

  await master.save();

  await logActivity(req, {
    action: "MASTER_UPDATED",
    details: `Updated ${master.type} "${master.label}"`,
    targetType: "MasterSetting",
    targetId: master._id,
  });

  return ok(
    res,
    {
      item: {
        id: String(master._id),
        type: master.type,
        label: master.label,
        color: master.color,
        active: master.active,
        usageCount: master.usageCount || 0,
      },
    },
    req.id
  );
}

export async function toggleMaster(req, res) {
  const { id } = req.params;
  const { active } = req.validated.body || {};
  const master = await MasterSetting.findOne({ _id: id, orgId: req.user.orgId });
  if (!master) throw new AppError("Master setting not found", 404, "NOT_FOUND");

  master.active = active;
  master.updatedBy = req.user.userId;
  await master.save();

  await logActivity(req, {
    action: "MASTER_TOGGLED",
    details: `${master.type} "${master.label}" set to ${active ? "active" : "inactive"}`,
    targetType: "MasterSetting",
    targetId: master._id,
  });

  return ok(
    res,
    {
      item: {
        id: String(master._id),
        type: master.type,
        label: master.label,
        color: master.color,
        active: master.active,
        usageCount: master.usageCount || 0,
      },
    },
    req.id
  );
}
