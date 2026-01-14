import { cloudinary } from "../config/cloudinary.js";

export async function uploadMany(req, res) {
  const files = req.files || [];

  const items = files.map((f) => ({
    url: f.path || f.url,
    secureUrl: f.path || f.secure_url || f.url,
    publicId: f.filename || f.public_id,
    originalName: f.originalname,
    mimeType: f.mimetype,
    bytes: f.size,
    resourceType: f.resource_type,
    format: f.format,
    createdAt: f.created_at,
  }));

  return res.status(201).json({ items });
}

export async function deleteUpload(req, res) {
  const { publicId, resourceType } = req.body;

  if (!publicId) {
    return res.status(400).json({
      error: "publicId is required",
    });
  }

  // default to raw (pdf, doc, etc.)
  const type = resourceType || "raw";

  const result = await cloudinary.uploader.destroy(publicId, {
    resource_type: type,
  });

  if (result?.result !== "ok" && result?.result !== "not found") {
    return res.status(500).json({
      error: "Failed to delete file",
      cloudinaryResult: result,
    });
  }

  return res.json({
    ok: true,
    publicId,
    result: result.result,
  });
}