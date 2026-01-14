import mongoose from "mongoose";
import { PLANS } from "../constants/plans.js";

const BrandingSchema = new mongoose.Schema(
  { logoUrl: String, primaryColor: String, footerText: String },
  { _id: false }
);
const SlaSchema = new mongoose.Schema(
  { enabled: { type: Boolean, default: false }, remindAfterHours: { type: Number, default: 48 } },
  { _id: false }
);
const ApprovalDefaultsSchema = new mongoose.Schema(
  {
    requireApproval: { type: Boolean, default: true },
    reApprovalOnChanges: { type: Boolean, default: true },
    acceptanceRequired: { type: Boolean, default: true },
  },
  { _id: false }
);
const NotificationSettingsSchema = new mongoose.Schema(
  {
    approvalReminders: { type: Boolean, default: true },
    riskAlerts: { type: Boolean, default: true },
  },
  { _id: false }
);

const OrganizationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    contactEmail: { type: String, trim: true, lowercase: true },
    timezone: { type: String, default: "Asia/Kolkata" },
    currency: { type: String, default: "INR" },
    plan: { type: String, enum: Object.values(PLANS), default: PLANS.AGENCY, index: true },
    planStatus: { type: String, enum: ["ACTIVE", "PAST_DUE", "CANCELLED"], default: "ACTIVE", index: true },
    brandingSettings: { type: BrandingSchema, default: {} },
    slaSettings: { type: SlaSchema, default: {} },
    approvalDefaults: { type: ApprovalDefaultsSchema, default: {} },
    notificationSettings: { type: NotificationSettingsSchema, default: {} },
  },
  { timestamps: true }
);
export const Organization = mongoose.model("Organization", OrganizationSchema);
