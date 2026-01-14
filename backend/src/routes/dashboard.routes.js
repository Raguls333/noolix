import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { authorizeRole } from "../middleware/authorizeRole.js";
import { ROLES } from "../constants/roles.js";
import { founderDashboard, managerDashboard, clientDashboard } from "../controllers/dashboard.controller.js";

export const dashboardRouter = Router();

dashboardRouter.get(
  "/founder",
  requireAuth,
  authorizeRole([ROLES.FOUNDER, ROLES.SUPER_ADMIN]),
  asyncHandler(founderDashboard)
);

dashboardRouter.get(
  "/manager",
  requireAuth,
  authorizeRole([ROLES.MANAGER, ROLES.FOUNDER, ROLES.SUPER_ADMIN]),
  asyncHandler(managerDashboard)
);

dashboardRouter.get(
  "/client",
  requireAuth,
  authorizeRole([ROLES.CLIENT, ROLES.FOUNDER, ROLES.MANAGER, ROLES.SUPER_ADMIN]),
  asyncHandler(clientDashboard)
);
