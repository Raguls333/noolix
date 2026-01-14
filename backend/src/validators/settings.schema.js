import { z } from "zod";
import { ROLES } from "../constants/roles.js";

const masterTypeSchema = z.enum(["statuses", "risk-levels", "approval-types", "payment-terms"]);

const approvalDefaultsSchema = z
  .object({
    requireApproval: z.boolean().optional(),
    reApprovalOnChanges: z.boolean().optional(),
    acceptanceRequired: z.boolean().optional(),
  })
  .optional();

const notificationSettingsSchema = z
  .object({
    approvalReminders: z.boolean().optional(),
    riskAlerts: z.boolean().optional(),
  })
  .optional();

export const updateOrgSettingsSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    contactEmail: z.string().email().optional(),
    timezone: z.string().min(1).optional(),
    currency: z.string().min(1).optional(),
    approvalDefaults: approvalDefaultsSchema,
    notificationSettings: notificationSettingsSchema,
  }),
  params: z.any().optional(),
  query: z.any().optional(),
  headers: z.any().optional(),
});

export const listActivityLogSchema = z.object({
  query: z
    .object({
      from: z.string().optional(),
      to: z.string().optional(),
      actorId: z.string().optional(),
      action: z.string().optional(),
      limit: z.coerce.number().int().min(1).max(500).optional(),
    })
    .optional(),
  params: z.any().optional(),
  body: z.any().optional(),
  headers: z.any().optional(),
});

export const listMastersSchema = z.object({
  query: z
    .object({
      type: masterTypeSchema.optional(),
      limit: z.coerce.number().int().min(1).max(500).optional(),
    })
    .optional(),
  params: z.any().optional(),
  body: z.any().optional(),
  headers: z.any().optional(),
});

export const createMasterSchema = z.object({
  body: z.object({
    type: masterTypeSchema,
    label: z.string().min(1),
    color: z.string().min(1),
    active: z.boolean().optional(),
  }),
  params: z.any().optional(),
  query: z.any().optional(),
  headers: z.any().optional(),
});

export const updateMasterSchema = z.object({
  body: z.object({
    label: z.string().min(1).optional(),
    color: z.string().min(1).optional(),
  }),
  params: z.any().optional(),
  query: z.any().optional(),
  headers: z.any().optional(),
});

export const toggleMasterSchema = z.object({
  body: z.object({
    active: z.boolean(),
  }),
  params: z.any().optional(),
  query: z.any().optional(),
  headers: z.any().optional(),
});

export const updateTeamMemberSchema = z.object({
  body: z.object({
    role: z.enum([ROLES.FOUNDER, ROLES.MANAGER]).optional(),
    isActive: z.boolean().optional(),
  }),
  params: z.any().optional(),
  query: z.any().optional(),
  headers: z.any().optional(),
});
