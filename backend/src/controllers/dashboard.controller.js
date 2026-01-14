import { ok } from "../utils/response.js";
import { getFounderDashboard, getManagerDashboard, getClientDashboard } from "../services/dashboard.service.js";

export async function founderDashboard(req, res) {
  const data = await getFounderDashboard({ orgId: req.user.orgId });
  return ok(res, { dashboard: data }, req.id);
}

export async function managerDashboard(req, res) {
  const data = await getManagerDashboard({ orgId: req.user.orgId, userId: req.user.userId });
  return ok(res, { dashboard: data }, req.id);
}

export async function clientDashboard(req, res) {
  const clientId = req.query?.clientId;
  const data = await getClientDashboard({
    orgId: req.user.orgId,
    clientId,
    clientEmail: req.user.email,
  });
  return ok(res, { dashboard: data }, req.id);
}
