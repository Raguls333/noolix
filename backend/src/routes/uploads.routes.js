import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { makeUploader } from "../middleware/upload.js";
import { uploadMany, deleteUpload } from "../controllers/uploads.controller.js";

export const uploadsRouter = Router();

const uploader = makeUploader({
  folder: "noolix/attachments",
  maxFiles: 10,
  maxFileSizeMB: 10,
});

// POST /api/uploads  (upload)

uploadsRouter.post(
  "/",
  requireAuth,
  uploader.array("files", 10),
  asyncHandler(uploadMany)
);

// DELETE /api/uploads  (delete)
uploadsRouter.delete("/", requireAuth, asyncHandler(deleteUpload));
