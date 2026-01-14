import mongoose from "mongoose";

const MASTER_TYPES = ["statuses", "risk-levels", "approval-types", "payment-terms"];

const MasterSettingSchema = new mongoose.Schema(
  {
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    type: { type: String, enum: MASTER_TYPES, required: true, index: true },
    label: { type: String, required: true, trim: true },
    color: { type: String, required: true, trim: true },
    active: { type: Boolean, default: true },
    usageCount: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

MasterSettingSchema.index({ orgId: 1, type: 1, label: 1 });

export const MasterSetting = mongoose.model("MasterSetting", MasterSettingSchema);
