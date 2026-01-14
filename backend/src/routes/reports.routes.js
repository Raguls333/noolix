import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { authorizeRole } from "../middleware/authorizeRole.js";
import { authorizeFeature } from "../middleware/authorizeFeature.js";
import { validate } from "../middleware/validate.js";
import { atRiskSchema, reportFilters } from "../validators/report.schema.js";
import {
  pendingApprovals,
  pendingAcceptance,
  atRisk,
  revenueSummary,
  agingReport,
  clientBehaviorReport,
} from "../controllers/reports.controller.js";
import { FEATURES } from "../constants/features.js";
import { ROLES } from "../constants/roles.js";
export const reportsRouter=Router();
reportsRouter.get(
  "/pending-approvals",
  requireAuth,
  authorizeFeature(FEATURES.ADVANCED_REPORTS),
  validate(reportFilters),
  asyncHandler(pendingApprovals)
);
reportsRouter.get(
  "/pending-acceptance",
  requireAuth,
  authorizeFeature(FEATURES.ADVANCED_REPORTS),
  validate(reportFilters),
  asyncHandler(pendingAcceptance)
);
reportsRouter.get(
  "/at-risk",
  requireAuth,
  authorizeFeature(FEATURES.ADVANCED_REPORTS),
  validate(atRiskSchema),
  asyncHandler(atRisk)
);
reportsRouter.get(
  "/aging",
  requireAuth,
  authorizeFeature(FEATURES.ADVANCED_REPORTS),
  validate(reportFilters),
  asyncHandler(agingReport)
);
reportsRouter.get(
  "/client-behavior",
  requireAuth,
  authorizeRole([ROLES.FOUNDER]),
  authorizeFeature(FEATURES.ADVANCED_REPORTS),
  validate(reportFilters),
  asyncHandler(clientBehaviorReport)
);
reportsRouter.get(
  "/revenue-summary",
  requireAuth,
  authorizeRole([ROLES.FOUNDER]),
  authorizeFeature(FEATURES.ADVANCED_REPORTS),
  asyncHandler(revenueSummary)
);
