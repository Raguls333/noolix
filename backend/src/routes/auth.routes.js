import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validate } from "../middleware/validate.js";
import { authLimiter } from "../middleware/rateLimit.js";
import { loginSchema } from "../validators/auth.schema.js";
import { login } from "../controllers/auth.controller.js";
export const authRouter=Router();
authRouter.post("/login", authLimiter, validate(loginSchema), asyncHandler(login));
