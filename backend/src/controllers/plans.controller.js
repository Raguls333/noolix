import { ok } from "../utils/response.js";
import { PLANS } from "../constants/plans.js";
import { planRules } from "../constants/planRules.js";

export async function listPlans(req, res) {
  const plans = Object.values(PLANS).map((plan) => ({
    plan,
    features: Array.from(planRules[plan] || []),
  }));

  return ok(res, { plans }, req.id);
}
