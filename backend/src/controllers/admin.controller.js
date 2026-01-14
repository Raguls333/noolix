import { ok } from "../utils/response.js";
import { Organization } from "../models/Organization.model.js";
import { User } from "../models/User.model.js";
import { ApprovalEvent } from "../models/ApprovalEvent.model.js";
import { ExportLog } from "../models/ExportLog.model.js";
import { AppError } from "../utils/errors.js";

function toPageOptions(query) {
  const page = Math.max(Number(query.page || 1), 1);
  const limit = Math.min(Math.max(Number(query.limit || 50), 1), 200);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

export async function assignPlanToOrg(req, res) {
  const { plan, planStatus } = req.validated.body;
  const set = { plan };
  if (planStatus) set.planStatus = planStatus;

  const org = await Organization.findByIdAndUpdate(
    req.params.orgId,
    { $set: set },
    { new: true }
  ).lean();
  if (!org) throw new AppError("Org not found", 404, "NOT_FOUND");

  return ok(res, { org }, req.id);
}

export async function assignPlanToUser(req, res) {
  const { plan, planStatus } = req.validated.body;
  const user = await User.findById(req.params.userId).lean();
  if (!user) throw new AppError("User not found", 404, "NOT_FOUND");

  const set = { plan };
  if (planStatus) set.planStatus = planStatus;

  const org = await Organization.findByIdAndUpdate(
    user.orgId,
    { $set: set },
    { new: true }
  ).lean();
  if (!org) throw new AppError("Org not found", 404, "NOT_FOUND");

  return ok(res, { org, userId: String(user._id) }, req.id);
}

export async function listApprovalEvents(req, res) {
  const { orgId } = req.validated.query;
  const q = {};
  if (orgId) q.orgId = orgId;
  const { page, limit, skip } = toPageOptions(req.validated.query);

  const [items, total] = await Promise.all([
    ApprovalEvent.find(q).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    ApprovalEvent.countDocuments(q),
  ]);

  return ok(res, { items, page, limit, total }, req.id);
}

export async function listExportLogs(req, res) {
  const { orgId } = req.validated.query;
  const q = {};
  if (orgId) q.orgId = orgId;
  const { page, limit, skip } = toPageOptions(req.validated.query);

  const [items, total] = await Promise.all([
    ExportLog.find(q).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    ExportLog.countDocuments(q),
  ]);

  return ok(res, { items, page, limit, total }, req.id);
}
