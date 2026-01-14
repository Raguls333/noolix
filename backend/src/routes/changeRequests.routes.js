import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { validate } from "../middleware/validate.js";
import { listChangeRequestsQueue } from "../controllers/changeRequests.controller.js";
import { listChangeRequestsQueueSchema } from "../validators/changeRequest.schema.js";

export const changeRequestsRouter = Router();

changeRequestsRouter.get("/", requireAuth, validate(listChangeRequestsQueueSchema), asyncHandler(listChangeRequestsQueue));
