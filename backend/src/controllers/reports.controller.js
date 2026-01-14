import { ok } from "../utils/response.js";
import {
  getPendingApprovals,
  getPendingAcceptance,
  getAtRisk,
  getRevenueSummary,
  getAgingReport,
  getClientBehavior,
} from "../services/report.service.js";
import { sanitizeCommitmentForRole } from "../utils/sanitize.js";

function daysBetween(from, to) {
  if (!from || !to) return 0;
  const diff = new Date(to).getTime() - new Date(from).getTime();
  if (Number.isNaN(diff)) return 0;
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

function getClientName(commitment) {
  const client = commitment?.clientId;
  if (client && typeof client === "object") {
    return client.name || client.companyName || client.email || "Unknown";
  }
  return commitment?.clientSnapshot?.name || "Unknown";
}

export async function pendingApprovals(req, res) {
  const { from, to, clientId, assignedTo, limit } = req.validated.query || {};
  const raw = await getPendingApprovals({ orgId: req.user.orgId, from, to, clientId, assignedTo, limit });
  const now = new Date().toISOString();
  const items = raw.map((i) => {
    const cleaned = sanitizeCommitmentForRole(i, req.user.role);
    const sentAt = i.approvalSentAt || i.createdAt;
    return {
      ...cleaned,
      clientName: getClientName(i),
      daysPending: daysBetween(sentAt, now),
    };
  });
  return ok(res, { items }, req.id);
}

export async function pendingAcceptance(req, res) {
  const { from, to, clientId, assignedTo, limit } = req.validated.query || {};
  const raw = await getPendingAcceptance({ orgId: req.user.orgId, from, to, clientId, assignedTo, limit });
  const now = new Date().toISOString();
  const items = raw.map((i) => {
    const cleaned = sanitizeCommitmentForRole(i, req.user.role);
    const deliveredAt = i.deliveredAt || i.updatedAt || i.createdAt;
    return {
      ...cleaned,
      clientName: getClientName(i),
      daysPending: daysBetween(deliveredAt, now),
    };
  });
  return ok(res, { items }, req.id);
}

export async function atRisk(req, res) {
  const { days, from, to, clientId, assignedTo, limit } = req.validated.query || {};
  const daysNum = Number(days || 7);
  const raw = await getAtRisk({ orgId: req.user.orgId, days: daysNum, from, to, clientId, assignedTo, limit });
  const now = new Date().toISOString();
  const items = raw.map((i) => {
    const cleaned = sanitizeCommitmentForRole(i, req.user.role);
    const lastUpdate = i.updatedAt || i.createdAt;
    const riskReason =
      i.status === "CHANGE_REQUEST_CREATED"
        ? "Change request pending"
        : i.status === "DELIVERED"
        ? "Awaiting client acceptance"
        : "Awaiting client approval";
    return {
      ...cleaned,
      clientName: getClientName(i),
      daysSinceUpdate: daysBetween(lastUpdate, now),
      riskReason,
    };
  });
  return ok(res, { days: daysNum, items }, req.id);
}

export async function agingReport(req, res) {
  const { from, to, clientId, assignedTo, limit } = req.validated.query || {};
  const raw = await getAgingReport({ orgId: req.user.orgId, from, to, clientId, assignedTo, limit });
  const now = new Date().toISOString();
  const items = raw.map((i) => {
    const cleaned = sanitizeCommitmentForRole(i, req.user.role);
    const ageDays = daysBetween(i.createdAt, now);
    const bucket = ageDays > 30 ? "30+" : ageDays > 7 ? "8-30" : "0-7";
    return {
      ...cleaned,
      clientName: getClientName(i),
      ageDays,
      bucket,
    };
  });
  const buckets = {
    "0-7": { count: 0, totalAmount: 0 },
    "8-30": { count: 0, totalAmount: 0 },
    "30+": { count: 0, totalAmount: 0 },
  };
  items.forEach((item) => {
    const amount = typeof item.amount === "number" ? item.amount : 0;
    const bucket = item.bucket;
    buckets[bucket].count += 1;
    buckets[bucket].totalAmount += amount;
  });
  return ok(res, { items, buckets }, req.id);
}

export async function clientBehaviorReport(req, res) {
  const { from, to, clientId, assignedTo, limit } = req.validated.query || {};
  const raw = await getClientBehavior({ orgId: req.user.orgId, from, to, clientId, assignedTo, limit });

  const byClient = new Map();
  raw.forEach((c) => {
    const client = c.clientId && typeof c.clientId === "object" ? c.clientId : null;
    const clientKey = client?._id?.toString() || c.clientId?.toString() || "unknown";
    if (!byClient.has(clientKey)) {
      byClient.set(clientKey, {
        clientId: clientKey,
        clientName: client?.name || client?.companyName || c.clientSnapshot?.name || "Unknown",
        totalCommitments: 0,
        approvalDays: [],
        acceptanceDays: [],
        changeRequests: 0,
      });
    }
    const item = byClient.get(clientKey);
    item.totalCommitments += 1;
    if (c.approvalSentAt && c.approvedAt) {
      item.approvalDays.push(daysBetween(c.approvalSentAt, c.approvedAt));
    }
    if (c.deliveredAt && c.acceptedAt) {
      item.acceptanceDays.push(daysBetween(c.deliveredAt, c.acceptedAt));
    }
    if (c.status === "CHANGE_REQUEST_CREATED") {
      item.changeRequests += 1;
    }
  });

  const items = Array.from(byClient.values()).map((item) => {
    const avgApprovalDays =
      item.approvalDays.length > 0
        ? Math.round(item.approvalDays.reduce((a, b) => a + b, 0) / item.approvalDays.length)
        : null;
    const avgAcceptanceDays =
      item.acceptanceDays.length > 0
        ? Math.round(item.acceptanceDays.reduce((a, b) => a + b, 0) / item.acceptanceDays.length)
        : null;
    const changeFrequency =
      item.totalCommitments > 0 ? Math.round((item.changeRequests / item.totalCommitments) * 100) : 0;
    return {
      clientId: item.clientId,
      clientName: item.clientName,
      totalCommitments: item.totalCommitments,
      avgApprovalDays,
      avgAcceptanceDays,
      changeFrequency,
    };
  });

  return ok(res, { items }, req.id);
}

export async function revenueSummary(req, res) {
  const summary = await getRevenueSummary({ orgId: req.user.orgId });
  const totals = summary.reduce(
    (acc, row) => {
      acc.count += row.count || 0;
      acc.amount += row.totalAmount || 0;
      return acc;
    },
    { count: 0, amount: 0 }
  );
  return ok(res, { summary, totals }, req.id);
}
