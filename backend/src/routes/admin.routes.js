import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { authorizeRole } from "../middleware/authorizeRole.js";
import { validate } from "../middleware/validate.js";
import { ROLES } from "../constants/roles.js";
import { assignPlanToOrg, assignPlanToUser, listApprovalEvents, listExportLogs } from "../controllers/admin.controller.js";
import { updateOrgPlanSchema, updateUserPlanSchema, listLogsSchema } from "../validators/plan.schema.js";

export const adminRouter = Router();

adminRouter.patch("/orgs/:orgId/plan", requireAuth, authorizeRole([ROLES.SUPER_ADMIN]), validate(updateOrgPlanSchema), asyncHandler(assignPlanToOrg));
adminRouter.patch("/users/:userId/plan", requireAuth, authorizeRole([ROLES.SUPER_ADMIN]), validate(updateUserPlanSchema), asyncHandler(assignPlanToUser));
adminRouter.get("/logs/approvals", requireAuth, authorizeRole([ROLES.SUPER_ADMIN]), validate(listLogsSchema), asyncHandler(listApprovalEvents));
adminRouter.get("/logs/exports", requireAuth, authorizeRole([ROLES.SUPER_ADMIN]), validate(listLogsSchema), asyncHandler(listExportLogs));
