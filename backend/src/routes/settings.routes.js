import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { authorizeRole } from "../middleware/authorizeRole.js";
import { validate } from "../middleware/validate.js";
import { ROLES } from "../constants/roles.js";
import {
  getOrganizationSettings,
  updateOrganizationSettings,
  listTeamMembers,
  updateTeamMember,
  listActivityLog,
  listMasters,
  createMaster,
  updateMaster,
  toggleMaster,
} from "../controllers/settings.controller.js";
import {
  updateOrgSettingsSchema,
  listActivityLogSchema,
  listMastersSchema,
  createMasterSchema,
  updateMasterSchema,
  toggleMasterSchema,
  updateTeamMemberSchema,
} from "../validators/settings.schema.js";

export const settingsRouter = Router();

settingsRouter.get(
  "/organization",
  requireAuth,
  authorizeRole([ROLES.FOUNDER, ROLES.MANAGER]),
  asyncHandler(getOrganizationSettings)
);
settingsRouter.patch(
  "/organization",
  requireAuth,
  authorizeRole([ROLES.FOUNDER]),
  validate(updateOrgSettingsSchema),
  asyncHandler(updateOrganizationSettings)
);

settingsRouter.get(
  "/team",
  requireAuth,
  authorizeRole([ROLES.FOUNDER, ROLES.MANAGER]),
  asyncHandler(listTeamMembers)
);
settingsRouter.patch(
  "/team/:id",
  requireAuth,
  authorizeRole([ROLES.FOUNDER]),
  validate(updateTeamMemberSchema),
  asyncHandler(updateTeamMember)
);

settingsRouter.get(
  "/activity",
  requireAuth,
  authorizeRole([ROLES.FOUNDER, ROLES.MANAGER]),
  validate(listActivityLogSchema),
  asyncHandler(listActivityLog)
);

settingsRouter.get(
  "/masters",
  requireAuth,
  authorizeRole([ROLES.FOUNDER, ROLES.MANAGER]),
  validate(listMastersSchema),
  asyncHandler(listMasters)
);
settingsRouter.post(
  "/masters",
  requireAuth,
  authorizeRole([ROLES.FOUNDER]),
  validate(createMasterSchema),
  asyncHandler(createMaster)
);
settingsRouter.patch(
  "/masters/:id",
  requireAuth,
  authorizeRole([ROLES.FOUNDER]),
  validate(updateMasterSchema),
  asyncHandler(updateMaster)
);
settingsRouter.patch(
  "/masters/:id/toggle",
  requireAuth,
  authorizeRole([ROLES.FOUNDER]),
  validate(toggleMasterSchema),
  asyncHandler(toggleMaster)
);
