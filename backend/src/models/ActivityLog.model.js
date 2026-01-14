import mongoose from "mongoose";

const ActivityLogSchema = new mongoose.Schema(
  {
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    actorUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    actorName: { type: String, trim: true },
    actorEmail: { type: String, trim: true, lowercase: true },
    actorRole: { type: String },
    action: { type: String, required: true, trim: true },
    details: { type: String, trim: true },
    targetType: { type: String, trim: true },
    targetId: { type: mongoose.Schema.Types.ObjectId },
    ipAddress: { type: String, trim: true },
    meta: { type: Object },
  },
  { timestamps: true }
);

ActivityLogSchema.index({ orgId: 1, createdAt: -1 });

export const ActivityLog = mongoose.model("ActivityLog", ActivityLogSchema);
