import { Commitment } from "../models/Commitment.model.js";
import { COMMITMENT_STATUS } from "../constants/status.js";

const CLIENT_POPULATE = {
  path: "clientId",
  select: "name email companyName",
};
const ASSIGNEE_POPULATE = {
  path: "assignedToUserId",
  select: "name email",
};

function toDateOrNull(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function buildQuery({ orgId, statuses, from, to, clientId, assignedTo, dateField = "createdAt" }) {
  const q = { orgId };
  if (statuses && statuses.length > 0) q.status = { $in: statuses };
  if (clientId) q.clientId = clientId;
  if (assignedTo) q.assignedToUserId = assignedTo;

  const start = toDateOrNull(from);
  const end = toDateOrNull(to);
  if (start || end) {
    q[dateField] = {};
    if (start) q[dateField].$gte = start;
    if (end) q[dateField].$lte = end;
  }

  return q;
}

function clampLimit(value, fallback = 200) {
  const n = Number(value || fallback);
  if (Number.isNaN(n)) return fallback;
  return Math.min(Math.max(n, 1), 1000);
}

export const getPendingApprovals = ({ orgId, from, to, clientId, assignedTo, limit }) =>
  Commitment.find(
    buildQuery({
      orgId,
      statuses: [COMMITMENT_STATUS.AWAITING_CLIENT_APPROVAL],
      from,
      to,
      clientId,
      assignedTo,
      dateField: "approvalSentAt",
    })
  )
    .sort({ approvalSentAt: 1 })
    .limit(clampLimit(limit))
    .populate(CLIENT_POPULATE)
    .populate(ASSIGNEE_POPULATE)
    .lean();

export const getPendingAcceptance = ({ orgId, from, to, clientId, assignedTo, limit }) =>
  Commitment.find(
    buildQuery({
      orgId,
      statuses: [COMMITMENT_STATUS.DELIVERED],
      from,
      to,
      clientId,
      assignedTo,
      dateField: "deliveredAt",
    })
  )
    .sort({ deliveredAt: 1 })
    .limit(clampLimit(limit))
    .populate(CLIENT_POPULATE)
    .populate(ASSIGNEE_POPULATE)
    .lean();

export async function getAtRisk({ orgId, days, from, to, clientId, assignedTo, limit }) {
  const cutoffDays = Number(days || 7);
  const cutoff = new Date(Date.now() - cutoffDays * 24 * 60 * 60 * 1000);
  const q = buildQuery({
    orgId,
    statuses: [
      COMMITMENT_STATUS.AWAITING_CLIENT_APPROVAL,
      COMMITMENT_STATUS.DELIVERED,
      COMMITMENT_STATUS.CHANGE_REQUEST_CREATED,
    ],
    from,
    to,
    clientId,
    assignedTo,
    dateField: "updatedAt",
  });

  if (!from && !to) {
    q.updatedAt = { ...(q.updatedAt || {}), $lte: cutoff };
  }

  return Commitment.find(q)
    .sort({ updatedAt: 1 })
    .limit(clampLimit(limit))
    .populate(CLIENT_POPULATE)
    .populate(ASSIGNEE_POPULATE)
    .lean();
}

export async function getAgingReport({ orgId, from, to, clientId, assignedTo, limit }) {
  return Commitment.find(
    buildQuery({
      orgId,
      statuses: [
        COMMITMENT_STATUS.DRAFT,
        COMMITMENT_STATUS.INTERNAL_REVIEW,
        COMMITMENT_STATUS.AWAITING_CLIENT_APPROVAL,
        COMMITMENT_STATUS.IN_PROGRESS,
        COMMITMENT_STATUS.DELIVERED,
        COMMITMENT_STATUS.ACCEPTED,
        COMMITMENT_STATUS.CLOSED,
        COMMITMENT_STATUS.CHANGE_REQUEST_CREATED,
      ],
      from,
      to,
      clientId,
      assignedTo,
      dateField: "createdAt",
    })
  )
    .sort({ createdAt: -1 })
    .limit(clampLimit(limit))
    .populate(CLIENT_POPULATE)
    .populate(ASSIGNEE_POPULATE)
    .lean();
}

export async function getClientBehavior({ orgId, from, to, clientId, assignedTo, limit }) {
  return Commitment.find(
    buildQuery({
      orgId,
      statuses: [
        COMMITMENT_STATUS.DRAFT,
        COMMITMENT_STATUS.INTERNAL_REVIEW,
        COMMITMENT_STATUS.AWAITING_CLIENT_APPROVAL,
        COMMITMENT_STATUS.IN_PROGRESS,
        COMMITMENT_STATUS.CHANGE_REQUEST_CREATED,
        COMMITMENT_STATUS.DELIVERED,
        COMMITMENT_STATUS.ACCEPTED,
        COMMITMENT_STATUS.CLOSED,
      ],
      from,
      to,
      clientId,
      assignedTo,
      dateField: "createdAt",
    })
  )
    .sort({ updatedAt: -1 })
    .limit(clampLimit(limit))
    .populate(CLIENT_POPULATE)
    .lean();
}

export async function getRevenueSummary({ orgId }) {
  const mongoose = (await import("mongoose")).default;
  return Commitment.aggregate([
    { $match: { orgId: new mongoose.Types.ObjectId(orgId) } },
    {
      $group: {
        _id: "$status",
        totalAmount: { $sum: { $ifNull: ["$amount", 0] } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);
}
