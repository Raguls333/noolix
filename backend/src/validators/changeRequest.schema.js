import { z } from "zod";

const AttachmentResourceTypeEnum = z.enum(["raw", "image", "video"]);
const AttachmentSchema = z.object({
  url: z.string().url().optional(),
  secureUrl: z.string().url().optional(),
  publicId: z.string().min(1),
  originalName: z.string().optional(),
  fileName: z.string().optional(),
  mimeType: z.string().optional(),
  bytes: z.number().optional(),
  resourceType: AttachmentResourceTypeEnum.optional(),
  uploadedAt: z.string().optional(),
  uploadedByUserId: z.string().optional(),
}).refine((v) => !!(v.url || v.secureUrl), {
  message: "Attachment must include url or secureUrl",
});

const PaymentTermSchema = z.object({
  text: z.string().min(1),
  status: z.enum(["PENDING", "PAID", "OVERDUE", "CANCELLED"]).optional(),
  dueAt: z.string().optional(),
  paidAt: z.string().optional(),
  amount: z.number().optional(),
  currency: z.string().optional(),
});

const MilestoneSchema = z.object({
  text: z.string().min(1),
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "BLOCKED"]).optional(),
  dueAt: z.string().optional(),
  completedAt: z.string().optional(),
});

const ApprovalRulesSchema = z
  .object({
    approver: z.enum(["CLIENT_ONLY", "BOTH_PARTIES"]).optional(),
    reApprovalOnChanges: z.boolean().optional(),
    acceptanceRequired: z.boolean().optional(),
  })
  .optional();

export const listChangeRequestsSchema = z.object({
  body: z.any().optional(),
  params: z.object({
    id: z.string().min(1),
  }),
  query: z.any().optional(),
  headers: z.any().optional(),
});

export const listChangeRequestsQueueSchema = z.object({
  body: z.any().optional(),
  params: z.any().optional(),
  query: z.object({
    status: z.enum(["OPEN", "ACCEPTED", "REJECTED"]).optional(),
    commitmentId: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
  headers: z.any().optional(),
});

export const acceptChangeRequestSchema = z.object({
  body: z.object({
    title: z.string().optional(),
    scopeTitle: z.string().optional(),
    scopeDescription: z.string().optional(),
    scopeText: z.string().optional(),
    amount: z.number().optional(),
    currency: z.string().optional(),
    attachments: z.array(AttachmentSchema).optional(),
    paymentTerms: z.array(PaymentTermSchema).optional(),
    milestones: z.array(MilestoneSchema).optional(),
    approvalRules: ApprovalRulesSchema,
    assignedToUserId: z.string().optional(),
    resolutionNote: z.string().max(1000).optional(),
  }).passthrough(),
  params: z.object({
    id: z.string().min(1),
    changeRequestId: z.string().min(1),
  }),
  query: z.any().optional(),
  headers: z.any().optional(),
});

export const rejectChangeRequestSchema = z.object({
  body: z.object({
    resolutionNote: z.string().max(1000).optional(),
  }),
  params: z.object({
    id: z.string().min(1),
    changeRequestId: z.string().min(1),
  }),
  query: z.any().optional(),
  headers: z.any().optional(),
});
