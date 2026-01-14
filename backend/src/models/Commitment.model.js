import mongoose from "mongoose";
import { COMMITMENT_STATUS } from "../constants/status.js";

/**
 * Subdocs
 */
const AttachmentSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true }, // for Cloudinary delete
    fileName: { type: String },
    mimeType: { type: String },
    bytes: { type: Number },
    resourceType: { type: String, enum: ["raw", "image", "video"], default: "raw" },
    uploadedAt: { type: Date, default: Date.now },
    uploadedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { _id: false }
);

const PaymentTermSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true }, // e.g. "50% upfront, 50% on completion"
    status: {
      type: String,
      enum: ["PENDING", "PAID", "OVERDUE", "CANCELLED"],
      default: "PENDING",
    },
    dueAt: { type: Date }, // optional
    paidAt: { type: Date }, // optional
    amount: { type: Number }, // optional: specific term amount
    currency: { type: String }, // optional if different
  },
  { _id: false }
);

const MilestoneSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "BLOCKED"],
      default: "NOT_STARTED",
    },
    dueAt: { type: Date }, // optional
    completedAt: { type: Date }, // optional
  },
  { _id: false }
);

const DeliverableSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["NOT_STARTED", "IN_PROGRESS", "DELIVERED", "ACCEPTED", "REJECTED"],
      default: "NOT_STARTED",
    },
    dueAt: { type: Date }, // optional
    completedAt: { type: Date }, // optional
  },
  { _id: false }
);

const ApprovalRulesSchema = new mongoose.Schema(
  {
    // Client only OR Both parties
    approver: {
      type: String,
      enum: ["CLIENT_ONLY", "BOTH_PARTIES"],
      default: "CLIENT_ONLY",
      required: true,
    },
    // Re-approval on changes
    reApprovalOnChanges: { type: Boolean, default: true },
    // Acceptance required
    acceptanceRequired: { type: Boolean, default: true },
  },
  { _id: false }
);

/**
 * Commitment
 */
const CommitmentSchema = new mongoose.Schema(
  {
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    // ✅ Client association (already present)
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
      index: true,
    },

    // ✅ Optional: snapshot client details at time of creation (recommended)
    // This avoids "client name changed later" affecting old commitments
    clientSnapshot: {
      name: { type: String, trim: true },
      email: { type: String, trim: true, lowercase: true },
      companyName: { type: String, trim: true },
    },

    title: { type: String, required: true, trim: true },

    // ✅ Scope Title + Description
    scopeTitle: { type: String, trim: true }, // optional label like "Phase 1 Scope"
    scopeDescription: { type: String, required: true }, // replaces scopeText

    // ✅ Attachments (Cloudinary)
    attachments: { type: [AttachmentSchema], default: [] },

    status: {
      type: String,
      enum: Object.values(COMMITMENT_STATUS),
      default: COMMITMENT_STATUS.DRAFT,
      index: true,
    },

    version: { type: Number, default: 1 },

    // ✅ Approval / acceptance timestamps
    approvalSentAt: Date,
    approvedAt: Date,
    deliveredAt: Date,
    acceptedAt: Date,

    // ✅ Commercial terms
    amount: { type: Number },
    currency: { type: String, default: "INR" },

    // ✅ Payment terms & milestones
    paymentTerms: { type: [PaymentTermSchema], default: [] },
    milestones: { type: [MilestoneSchema], default: [] }, // optional (can be empty)
    deliverables: { type: [DeliverableSchema], default: [] }, // optional (can be empty)

    // ✅ Approval rules
    approvalRules: { type: ApprovalRulesSchema, default: () => ({}) },

    rootCommitmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Commitment", index: true },
    previousCommitmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Commitment", index: true },
    changeRequestId: { type: mongoose.Schema.Types.ObjectId, ref: "ChangeRequest", index: true },

    assignedToUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    createdByUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

/**
 * Indexes (kept + extended)
 */
CommitmentSchema.index({ orgId: 1, status: 1, updatedAt: -1 });
CommitmentSchema.index({ orgId: 1, assignedToUserId: 1, status: 1 });
CommitmentSchema.index({ orgId: 1, clientId: 1, updatedAt: -1 });

/**
 * ✅ Populate helper (so client data shows when fetching)
 * Usage:
 *   Commitment.findById(id).populate(Commitment.clientPopulate())
 */
CommitmentSchema.statics.clientPopulate = function () {
  return {
    path: "clientId",
    select: "_id name email phone companyName status isActive createdAt updatedAt",
  };
};

export const Commitment = mongoose.model("Commitment", CommitmentSchema);
