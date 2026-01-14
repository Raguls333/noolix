import { z } from "zod";

const reportFiltersSchema = z.object({
  days: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  clientId: z.string().optional(),
  assignedTo: z.string().optional(),
  limit: z.string().optional(),
});

export const atRiskSchema = z.object({
  body: z.any().optional(),
  params: z.any().optional(),
  query: reportFiltersSchema,
  headers: z.any().optional(),
});

export const reportFilters = z.object({
  body: z.any().optional(),
  params: z.any().optional(),
  query: reportFiltersSchema,
  headers: z.any().optional(),
});
