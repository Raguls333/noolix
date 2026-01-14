import mongoose from "mongoose";

const RequestedBySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    name: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
  },
  { _id: false }
);

const ChangeRequestSchema = new mongoose.Schema(
  {
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    commitmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Commitment", required: true, index: true },
    commitmentVersion: { type: Number, required: true },

    reason: { type: String, required: true, trim: true },
    status: { type: String, enum: ["OPEN", "ACCEPTED", "REJECTED"], default: "OPEN", index: true },
    previousStatus: { type: String },

    requestedByType: { type: String, enum: ["CLIENT", "USER"], required: true },
    requestedBy: { type: RequestedBySchema, default: {} },

    resolvedAt: { type: Date },
    resolutionNote: { type: String, trim: true },
    createdVersionId: { type: mongoose.Schema.Types.ObjectId, ref: "Commitment" },
    meta: Object,
  },
  { timestamps: true }
);

ChangeRequestSchema.index({ orgId: 1, commitmentId: 1, status: 1, createdAt: -1 });

export const ChangeRequest = mongoose.model("ChangeRequest", ChangeRequestSchema);
