import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../middleware/requireAuth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ensureUploadDir } from "../services/attachment.service.js";
import { uploadInit, completeAttach, listByCommitment } from "../controllers/attachments.controller.js";
import { validate } from "../middleware/validate.js";
import { completeAttachmentSchema } from "../validators/attachment.schema.js";

const uploadDir=ensureUploadDir();
const storage=multer.diskStorage({
  destination: (_req,_file,cb)=>cb(null, uploadDir),
  filename: (_req,file,cb)=>cb(null, `${Date.now()}_${file.originalname.replace(/[^a-zA-Z0-9._-]/g,"_")}`)
});
const upload=multer({ storage });

export const attachmentsRouter=Router();
attachmentsRouter.post("/", requireAuth, upload.single("file"), asyncHandler(uploadInit));
attachmentsRouter.post("/complete", requireAuth, validate(completeAttachmentSchema), asyncHandler(completeAttach));
attachmentsRouter.get("/commitments/:id", requireAuth, asyncHandler(listByCommitment));
