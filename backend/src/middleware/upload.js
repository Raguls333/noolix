import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { cloudinary } from "../config/cloudinary.js";

function resolveResourceType(mime) {
  if (mime?.startsWith("image/")) return "image";
  if (mime?.startsWith("video/")) return "video";
  // pdf/doc/docx/etc
  return "raw";
}

export function makeUploader(opts = {}) {
  const folder = opts.folder ?? "noolix/attachments";
  const maxFiles = opts.maxFiles ?? 10;
  const maxFileSizeMB = opts.maxFileSizeMB ?? 10;
  const maxFileSize = maxFileSizeMB * 1024 * 1024;

  const storage = new CloudinaryStorage({
    cloudinary,
    params: async (_req, file) => ({
      folder,
      resource_type: resolveResourceType(file.mimetype),
      public_id: `${Date.now()}-${String(file.originalname || "file").replace(/\s+/g, "-")}`,
    }),
  });

  return multer({
    storage,
    limits: { fileSize: maxFileSize, files: maxFiles },
  });
}
