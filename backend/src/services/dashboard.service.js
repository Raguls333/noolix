import { Commitment } from "../models/Commitment.model.js";
import { Client } from "../models/Client.model.js";
import { ApprovalEvent } from "../models/ApprovalEvent.model.js";
import { COMMITMENT_STATUS } from "../constants/status.js";
import { getPendingApprovals, getPendingAcceptance, getAtRisk } from "./report.service.js";

const CLIENT_POPULATE = {
  path: "clientId",
  select: "name email companyName",
};

function getClientName(commitment) {
  const client = commitment?.clientId;
  if (client && typeof client === "object") {
    return client.name || client.companyName || client.email || "Unknown";
  }
  return commitment?.clientSnapshot?.name || "Unknown";
}

function normalizeStatusForUi(status) {
  switch (status) {
    case COMMITMENT_STATUS.DRAFT:
      return "draft";
    case COMMITMENT_STATUS.INTERNAL_REVIEW:
      return "internal-review";
    case COMMITMENT_STATUS.AWAITING_CLIENT_APPROVAL:
      return "pending";
    case COMMITMENT_STATUS.IN_PROGRESS:
      return "active";
    case COMMITMENT_STATUS.CHANGE_REQUEST_CREATED:
      return "at-risk";
    case COMMITMENT_STATUS.DELIVERED:
      return "awaiting-acceptance";
    case COMMITMENT_STATUS.ACCEPTED:
    case COMMITMENT_STATUS.CLOSED:
      return "completed";
    case COMMITMENT_STATUS.CANCELLED:
      return "disputed";
    default:
      return "pending";
  }
}

function toDateOrNull(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getEarliestDueDate(commitment) {
  const dates = [];
  const addDates = (items) => {
    if (!Array.isArray(items)) return;
    items.forEach((item) => {
      const d = toDateOrNull(item?.dueAt);
      if (d) dates.push(d);
    });
  };
  addDates(commitment?.deliverables);
  addDates(commitment?.milestones);
  addDates(commitment?.paymentTerms);
  if (dates.length === 0) return null;
  return new Date(Math.min(...dates.map((d) => d.getTime())));
}

function daysBetween(from, to) {
  if (!from || !to) return null;
  const diff = to.getTime() - from.getTime();
  if (Number.isNaN(diff)) return null;
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

function computePriority(commitment) {
  if (commitment.status === COMMITMENT_STATUS.CHANGE_REQUEST_CREATED) return "critical";
  const dueDate = getEarliestDueDate(commitment);
  if (!dueDate) return "medium";
  const days = daysBetween(new Date(), dueDate);
  if (days !== null && days < 0) return "critical";
  if (days !== null && days <= 7) return "high";
  return "medium";
}

async function sumAmountByStatus({ orgId, statuses, assignedToUserId, clientId }) {
  const match = { orgId };
  if (statuses?.length) match.status = { $in: statuses };
  if (assignedToUserId) match.assignedToUserId = assignedToUserId;
  if (clientId) match.clientId = clientId;

  const result = await Commitment.aggregate([
    { $match: match },
    { $group: { _id: null, total: { $sum: { $ifNull: ["$amount", 0] } }, count: { $sum: 1 } } },
  ]);

  if (!result.length) return { count: 0, amount: 0 };
  return { count: result[0].count || 0, amount: result[0].total || 0 };
}

async function getRecentActivity({ orgId, commitmentIds = [], limit = 8 }) {
  const query = { orgId };
  if (commitmentIds.length > 0) query.commitmentId = { $in: commitmentIds };

  const events = await ApprovalEvent.find(query).sort({ createdAt: -1 }).limit(limit).lean();
  if (events.length === 0) return [];

  const ids = events.map((e) => e.commitmentId).filter(Boolean);
  const commitments = await Commitment.find({ orgId, _id: { $in: ids } })
    .select("_id title amount clientId clientSnapshot")
    .populate(CLIENT_POPULATE)
    .lean();
  const byId = new Map(commitments.map((c) => [String(c._id), c]));

  return events.map((event) => {
    const commitment = byId.get(String(event.commitmentId));
    return {
      id: String(event._id),
      commitmentId: event.commitmentId ? String(event.commitmentId) : "",
      client: commitment ? getClientName(commitment) : "Unknown",
      action: event.message || event.type,
      type: event.type,
      amount: commitment?.amount || 0,
      createdAt: event.createdAt,
    };
  });
}

export async function getFounderDashboard({ orgId }) {
  const [pending, active, atRiskItems, totalValue] = await Promise.all([
    sumAmountByStatus({
      orgId,
      statuses: [COMMITMENT_STATUS.AWAITING_CLIENT_APPROVAL],
    }),
    sumAmountByStatus({
      orgId,
      statuses: [COMMITMENT_STATUS.IN_PROGRESS],
    }),
    getAtRisk({ orgId, days: 7, limit: 200 }),
    sumAmountByStatus({ orgId, statuses: [] }),
  ]);

  const atRiskSummary = atRiskItems.reduce(
    (acc, c) => {
      acc.count += 1;
      acc.amount += c.amount || 0;
      return acc;
    },
    { count: 0, amount: 0 }
  );

  const priorityCandidates = await Commitment.find({
    orgId,
    status: {
      $in: [
        COMMITMENT_STATUS.AWAITING_CLIENT_APPROVAL,
        COMMITMENT_STATUS.IN_PROGRESS,
        COMMITMENT_STATUS.DELIVERED,
        COMMITMENT_STATUS.CHANGE_REQUEST_CREATED,
      ],
    },
  })
    .sort({ updatedAt: -1 })
    .limit(12)
    .populate(CLIENT_POPULATE)
    .lean();

  const priorityCommitments = priorityCandidates.map((c) => {
    const dueDate = getEarliestDueDate(c);
    const daysUntilDue = dueDate ? daysBetween(new Date(), dueDate) : null;
    return {
      id: String(c._id),
      commitmentId: String(c._id),
      client: getClientName(c),
      name: c.title,
      status: normalizeStatusForUi(c.status),
      amount: c.amount || 0,
      dueDate: dueDate ? dueDate.toISOString() : null,
      daysUntilDue,
      priority: computePriority(c),
    };
  });

  const recentActivity = await getRecentActivity({ orgId, limit: 8 });

  return {
    summary: {
      pendingApprovals: pending,
      active,
      atRisk: atRiskSummary,
      totalValue,
    },
    priorityCommitments,
    recentActivity,
  };
}

export async function getManagerDashboard({ orgId, userId }) {
  const [pending, active, awaitingAcceptance] = await Promise.all([
    sumAmountByStatus({
      orgId,
      statuses: [COMMITMENT_STATUS.AWAITING_CLIENT_APPROVAL],
      assignedToUserId: userId,
    }),
    sumAmountByStatus({
      orgId,
      statuses: [COMMITMENT_STATUS.IN_PROGRESS],
      assignedToUserId: userId,
    }),
    sumAmountByStatus({
      orgId,
      statuses: [COMMITMENT_STATUS.DELIVERED],
      assignedToUserId: userId,
    }),
  ]);

  const commitments = await Commitment.find({
    orgId,
    assignedToUserId: userId,
    status: {
      $in: [
        COMMITMENT_STATUS.DRAFT,
        COMMITMENT_STATUS.INTERNAL_REVIEW,
        COMMITMENT_STATUS.AWAITING_CLIENT_APPROVAL,
        COMMITMENT_STATUS.IN_PROGRESS,
        COMMITMENT_STATUS.CHANGE_REQUEST_CREATED,
        COMMITMENT_STATUS.DELIVERED,
      ],
    },
  })
    .sort({ updatedAt: -1 })
    .limit(50)
    .populate(CLIENT_POPULATE)
    .lean();

  const mappedCommitments = commitments.map((c) => ({
    id: String(c._id),
    commitmentId: String(c._id),
    client: getClientName(c),
    name: c.title,
    status: normalizeStatusForUi(c.status),
    amount: c.amount || 0,
    lastActivityAt: c.updatedAt || c.createdAt,
  }));

  return {
    summary: {
      pendingApprovals: pending,
      active,
      awaitingAcceptance,
    },
    commitments: mappedCommitments,
  };
}

export async function getClientDashboard({ orgId, clientId, clientEmail }) {
  let client = null;
  if (clientId) {
    client = await Client.findOne({ _id: clientId, orgId }).lean();
  } else if (clientEmail) {
    client = await Client.findOne({ orgId, email: clientEmail }).lean();
  }

  if (!client) {
    return {
      client: null,
      summary: {
        pendingApprovals: { count: 0, amount: 0 },
        pendingAcceptance: { count: 0, amount: 0 },
        recentActivity: 0,
      },
      pendingApprovals: [],
      pendingAcceptance: [],
      recentActivity: [],
    };
  }

  const [pendingApprovals, pendingAcceptance] = await Promise.all([
    getPendingApprovals({ orgId, clientId: client._id, limit: 20 }),
    getPendingAcceptance({ orgId, clientId: client._id, limit: 20 }),
  ]);

  const approvalSummary = pendingApprovals.reduce(
    (acc, c) => {
      acc.count += 1;
      acc.amount += c.amount || 0;
      return acc;
    },
    { count: 0, amount: 0 }
  );
  const acceptanceSummary = pendingAcceptance.reduce(
    (acc, c) => {
      acc.count += 1;
      acc.amount += c.amount || 0;
      return acc;
    },
    { count: 0, amount: 0 }
  );

  const commitmentIds = [...pendingApprovals, ...pendingAcceptance].map((c) => c._id);
  const recentActivity = await getRecentActivity({
    orgId,
    commitmentIds,
    limit: 6,
  });

  return {
    client: {
      id: String(client._id),
      name: client.name || client.companyName || client.email,
      email: client.email,
    },
    summary: {
      pendingApprovals: approvalSummary,
      pendingAcceptance: acceptanceSummary,
      recentActivity: recentActivity.length,
    },
    pendingApprovals: pendingApprovals.map((c) => ({
      id: String(c._id),
      commitmentId: String(c._id),
      name: c.title,
      client: getClientName(c),
      value: c.amount || 0,
      dueDate: getEarliestDueDate(c)?.toISOString() || null,
      lastUpdateAt: c.updatedAt || c.createdAt,
      status: normalizeStatusForUi(c.status),
    })),
    pendingAcceptance: pendingAcceptance.map((c) => ({
      id: String(c._id),
      commitmentId: String(c._id),
      name: c.title,
      client: getClientName(c),
      value: c.amount || 0,
      deliveryDate: c.deliveredAt ? new Date(c.deliveredAt).toISOString() : null,
      lastUpdateAt: c.updatedAt || c.createdAt,
      status: normalizeStatusForUi(c.status),
    })),
    recentActivity,
  };
}
