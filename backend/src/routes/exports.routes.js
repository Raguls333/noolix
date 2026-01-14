import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { authorizeFeature } from "../middleware/authorizeFeature.js";
import { exportCommitmentPdf, exportReportsCsv } from "../controllers/exports.controller.js";
import { FEATURES } from "../constants/features.js";
export const exportsRouter=Router();
exportsRouter.get("/commitments/:id/pdf", requireAuth, asyncHandler(exportCommitmentPdf));
exportsRouter.get("/reports.csv", requireAuth, authorizeFeature(FEATURES.CSV_EXPORT), asyncHandler(exportReportsCsv));
