import { z } from "zod";

export const createManagerSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(8),
  }),
  params: z.any().optional(),
  query: z.any().optional(),
  headers: z.any().optional(),
});

export const inviteManagerSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    email: z.string().email(),
  }),
  params: z.any().optional(),
  query: z.any().optional(),
  headers: z.any().optional(),
});
