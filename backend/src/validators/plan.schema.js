import { z } from "zod";
import { PLANS } from "../constants/plans.js";

const PlanEnum = z.enum(Object.values(PLANS));
const PlanStatusEnum = z.enum(["ACTIVE", "PAST_DUE", "CANCELLED"]);

const PagingQuerySchema = z.object({
  orgId: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

export const updateOrgPlanSchema = z.object({
  body: z.object({
    plan: PlanEnum,
    planStatus: PlanStatusEnum.optional(),
  }),
  params: z.object({
    orgId: z.string().min(1),
  }),
  query: z.any().optional(),
  headers: z.any().optional(),
});

export const updateUserPlanSchema = z.object({
  body: z.object({
    plan: PlanEnum,
    planStatus: PlanStatusEnum.optional(),
  }),
  params: z.object({
    userId: z.string().min(1),
  }),
  query: z.any().optional(),
  headers: z.any().optional(),
});

export const listLogsSchema = z.object({
  body: z.any().optional(),
  params: z.any().optional(),
  query: PagingQuerySchema,
  headers: z.any().optional(),
});
