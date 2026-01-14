import { z } from "zod";

// enums aligned with the schema we designed
const ApprovalApproverEnum = z.enum(["CLIENT_ONLY", "BOTH_PARTIES"]);
const AttachmentResourceTypeEnum = z.enum(["raw", "image", "video"]);

const AttachmentSchema = z.object({
  url: z.string().url().optional(),        // allow either url or secureUrl
  secureUrl: z.string().url().optional(),  // some clients send secureUrl
  publicId: z.string().min(1),
  originalName: z.string().optional(),
  fileName: z.string().optional(),
  mimeType: z.string().optional(),
  bytes: z.number().optional(),
  resourceType: AttachmentResourceTypeEnum.optional(),
  uploadedAt: z.string().optional(), // ISO string
  uploadedByUserId: z.string().optional(),
}).refine((v) => !!(v.url || v.secureUrl), {
  message: "Attachment must include url or secureUrl",
});

const PaymentTermSchema = z.object({
  text: z.string().min(1),
  status: z.enum(["PENDING", "PAID", "OVERDUE", "CANCELLED"]).optional(),
  dueAt: z.string().optional(),  // ISO date
  paidAt: z.string().optional(), // ISO date
  amount: z.number().optional(),
  currency: z.string().optional(),
});

const MilestoneSchema = z.object({
  text: z.string().min(1),
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "BLOCKED"]).optional(),
  dueAt: z.string().optional(),       // ISO date
  completedAt: z.string().optional(), // ISO date
});
const DeliverableSchema = z.object({
  text: z.string().min(1),
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "DELIVERED", "ACCEPTED", "REJECTED"]).optional(),
  dueAt: z.string().optional(),       // ISO date
  completedAt: z.string().optional(), // ISO date
});

const ApprovalRulesSchema = z.object({
  approver: ApprovalApproverEnum.optional(),
  reApprovalOnChanges: z.boolean().optional(),
  acceptanceRequired: z.boolean().optional(),
}).optional();

export const createCommitmentSchema = z.object({
  body: z.object({
    clientId: z.string().min(1),
    title: z.string().min(1),

    // ✅ new fields
    scopeTitle: z.string().optional(),
    scopeDescription: z.string().min(1),

    // ✅ backwards compatible (optional): accept scopeText too
    // (service can map scopeText -> scopeDescription if you want)
    scopeText: z.string().optional(),

    amount: z.number().optional(),
    currency: z.string().optional(),

    assignedToUserId: z.string().optional(),
    sendApproval: z.boolean().optional(),

    attachments: z.array(AttachmentSchema).optional(),
    paymentTerms: z.array(PaymentTermSchema).optional(),
    milestones: z.array(MilestoneSchema).optional(),
    deliverables: z.array(DeliverableSchema).optional(),
    approvalRules: ApprovalRulesSchema,
  })
  // ✅ If you want strict mode, remove this. Keeping it helps when frontend sends extra fields.
  .passthrough(),

  params: z.any().optional(),
  query: z.any().optional(),
  headers: z.any().optional(),
});
export const listCommitmentsSchema = z.object({
  body: z.any().optional(),
  params: z.any().optional(),
  query: z.object({
    status: z.string().optional(),
    clientId: z.string().optional(),
    assignedTo: z.string().optional(),
    from: z.string().optional(), // ISO date
    to: z.string().optional(),   // ISO date
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
  headers: z.any().optional(),
});

/* ----------------------------------
   UPDATE commitment
---------------------------------- */

export const updateCommitmentSchema = z.object({
  body: z.object({
    title: z.string().optional(),

    // ✅ new scope fields
    scopeTitle: z.string().optional(),
    scopeDescription: z.string().optional(),

    // ✅ backward compatibility
    scopeText: z.string().optional(),

    amount: z.number().optional(),
    currency: z.string().optional(),

    attachments: z.array(AttachmentSchema).optional(),
    paymentTerms: z.array(PaymentTermSchema).optional(),
    milestones: z.array(MilestoneSchema).optional(),
    deliverables: z.array(DeliverableSchema).optional(),
    approvalRules: ApprovalRulesSchema.optional(),
  }).passthrough(), // allow partial updates

  params: z.any().optional(),
  query: z.any().optional(),
  headers: z.any().optional(),
});

/* ----------------------------------
   ASSIGN commitment
---------------------------------- */

export const assignCommitmentSchema = z.object({
  body: z.object({
    assignedToUserId: z.string().min(1),
  }),
  params: z.any().optional(),
  query: z.any().optional(),
  headers: z.any().optional(),
});

/* ----------------------------------
   PUBLIC approval (client)
---------------------------------- */

export const publicApproveSchema = z.object({
  body: z.object({
    action: z.enum(["approve", "request_change"]),
    comment: z.string().max(1000).optional(),
    meta: z.record(z.any()).optional(), // optional metadata (future-proof)
  }).refine((v) => (v.action === "request_change" ? !!v.comment?.trim() : true), {
    message: "comment is required when requesting changes",
    path: ["comment"],
  }),
  params: z.any().optional(),
  query: z.any().optional(),
  headers: z.any().optional(),
});

/* ----------------------------------
   PUBLIC acceptance (client)
---------------------------------- */

export const publicAcceptSchema = z.object({
  body: z.object({
    comment: z.string().max(1000).optional(),
    meta: z.record(z.any()).optional(),
  }),
  params: z.any().optional(),
  query: z.any().optional(),
  headers: z.any().optional(),
});
