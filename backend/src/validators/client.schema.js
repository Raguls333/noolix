import { z } from "zod";
export const createClientSchema=z.object({body:z.object({name:z.string().min(1),email:z.string().email(),phone:z.string().optional(),companyName:z.string().optional()}),params:z.any().optional(),query:z.any().optional(),headers:z.any().optional()});
export const updateClientSchema=z.object({body:z.object({name:z.string().min(1).optional(),email:z.string().email().optional(),phone:z.string().optional(),companyName:z.string().optional(),isActive:z.boolean().optional()}),params:z.any().optional(),query:z.any().optional(),headers:z.any().optional()});
