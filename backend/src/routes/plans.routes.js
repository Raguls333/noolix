import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { listPlans } from "../controllers/plans.controller.js";

export const plansRouter = Router();

plansRouter.get("/", requireAuth, asyncHandler(listPlans));
