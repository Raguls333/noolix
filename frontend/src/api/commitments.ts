// frontend/api/commitments.ts
import { apiRequest } from "./http";

/**
 * Backend enums (align with your COMMITMENT_STATUS)
 */
export type CommitmentStatus =
  | "DRAFT"
  | "INTERNAL_REVIEW"
  | "AWAITING_CLIENT_APPROVAL"
  | "IN_PROGRESS"
  | "CHANGE_REQUEST_CREATED"
  | "DELIVERED"
  | "ACCEPTED"
  | "CLOSED"
  | "CANCELLED";

/**
 * Related types (based on your updated backend schema + populate)
 */
export type Client = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  companyName?: string;
  status?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type AssignedUser = {
  _id: string;
  name?: string;
  email?: string;
};

export type ApprovalRules = {
  approver?: "CLIENT_ONLY" | "BOTH_PARTIES";
  reApprovalOnChanges?: boolean;
  acceptanceRequired?: boolean;
};

export type Attachment = {
  url: string;
  publicId: string;
  fileName?: string;
  originalName?: string;
  mimeType?: string;
  bytes?: number;
  resourceType?: "raw" | "image" | "video";
  uploadedAt?: string;
  uploadedByUserId?: string;
};

export type PaymentTerm = {
  text: string;
  status?: "PENDING" | "PAID" | "OVERDUE" | "CANCELLED";
  dueAt?: string; // ISO
  paidAt?: string; // ISO
  amount?: number;
  currency?: string;
};

export type Milestone = {
  text: string;
  status?: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "BLOCKED";
  dueAt?: string; // ISO
  completedAt?: string; // ISO
};

export type Deliverable = {
  text: string;
  status?: "NOT_STARTED" | "IN_PROGRESS" | "DELIVERED" | "ACCEPTED" | "REJECTED";
  dueAt?: string; // ISO
  completedAt?: string; // ISO
};

export type Commitment = {
  _id: string;

  // With populate enabled in backend, clientId may come as object
  clientId: string | Client;

  // Optional snapshot (if your backend returns it)
  clientSnapshot?: {
    name?: string;
    email?: string;
    companyName?: string;
  };

  title: string;

  // New scope fields
  scopeTitle?: string;
  scopeDescription?: string;

  // Backward compat (some old records / endpoints)
  scopeText?: string;

  status: CommitmentStatus;
  version: number;

  amount?: number;
  currency?: string;

  attachments?: Attachment[];
  paymentTerms?: PaymentTerm[];
  milestones?: Milestone[];
  deliverables?: Deliverable[];
  approvalRules?: ApprovalRules;

  assignedToUserId?: string | AssignedUser;
  rootCommitmentId?: string;
  previousCommitmentId?: string;
  changeRequestId?: string;

  approvalSentAt?: string;
  approvedAt?: string;
  deliveredAt?: string;
  acceptedAt?: string;

  createdAt?: string;
  updatedAt?: string;
};

/**
 * API responses
 */
export type PaginatedCommitmentsResponse = {
  items: Commitment[];
  page: number;
  limit: number;
  total: number;
};

export type HistoryEvent = any; // You can type this later if you want
export type HistoryResponse = { items: HistoryEvent[] };

export type CreateCommitmentPayload = {
  clientId: string;
  title: string;

  // New fields
  scopeTitle?: string;
  scopeDescription: string;

  // Backward compat (if your frontend still sends it)
  scopeText?: string;

  amount?: number;
  currency?: string;

  attachments?: Attachment[];
  paymentTerms?: PaymentTerm[];
  milestones?: Milestone[];
  approvalRules?: ApprovalRules;
};

export type UpdateCommitmentPayload = Partial<{
  title: string;

  scopeTitle: string;
  scopeDescription: string;

  // Backward compat
  scopeText: string;

  amount: number;
  currency: string;

  attachments: Attachment[];
  paymentTerms: PaymentTerm[];
  milestones: Milestone[];
  approvalRules: ApprovalRules;
}>;

export async function listCommitments(
  params: {
    page?: number;
    limit?: number;
    status?: CommitmentStatus | string;
    clientId?: string;
    assignedTo?: string; // backend expects assignedTo in query (mapped to assignedToUserId)
    from?: string; // ISO date
    to?: string; // ISO date
  } = {}
) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") sp.set(k, String(v));
  });
  const qs = sp.toString();

  return apiRequest<PaginatedCommitmentsResponse>(
    `/api/commitments${qs ? `?${qs}` : ""}`
  );
}

export async function createCommitment(payload: CreateCommitmentPayload) {
  // If frontend is still using scopeText, keep backend happy by sending scopeDescription too
  const body: CreateCommitmentPayload = {
    ...payload,
    scopeDescription: payload.scopeDescription || payload.scopeText || "",
  };

  return apiRequest<{ commitment: Commitment } | Commitment>("/api/commitments", {
    method: "POST",
    body,
  });
}

export async function getCommitment(id: string) {
  return apiRequest<{ commitment: Commitment } | Commitment>(`/api/commitments/${id}`);
}

export async function updateCommitment(id: string, payload: UpdateCommitmentPayload) {
  const body: UpdateCommitmentPayload = { ...payload };

  // Backward compat: if only scopeText provided, also send scopeDescription
  if (body.scopeDescription === undefined && body.scopeText !== undefined) {
    body.scopeDescription = body.scopeText;
  }

  return apiRequest<{ commitment: Commitment } | Commitment>(`/api/commitments/${id}`, {
    method: "PATCH",
    body,
  });
}

/**
 * Backend validator expects: { assignedToUserId }
 */
export async function assignCommitment(id: string, assignedToUserId: string) {
  return apiRequest<{ commitment: Commitment } | Commitment>(`/api/commitments/${id}/assign`, {
    method: "PATCH",
    body: { assignedToUserId },
  });
}

export async function markDelivered(id: string) {
  return apiRequest<{ commitment: Commitment } | Commitment>(`/api/commitments/${id}/mark-delivered`, {
    method: "POST",
  });
}

/**
 * Approval link endpoints (both exist in backend routes)
 */
export async function sendApprovalLink(id: string) {
  return apiRequest<{ approvalUrl: string }>(`/api/commitments/${id}/send-approval-link`, {
    method: "POST",
  });
}

export async function resendApprovalLink(id: string) {
  return apiRequest<{ approvalUrl: string }>(`/api/commitments/${id}/resend-approval-link`, {
    method: "POST",
  });
}

/**
 * Acceptance link endpoints
 */
export async function sendAcceptanceLink(id: string) {
  return apiRequest<{ acceptanceUrl: string }>(`/api/commitments/${id}/send-acceptance-link`, {
    method: "POST",
  });
}

export async function resendAcceptanceLink(id: string) {
  return apiRequest<{ acceptanceUrl: string }>(`/api/commitments/${id}/resend-acceptance-link`, {
    method: "POST",
  });
}

export async function getHistory(id: string) {
  return apiRequest<HistoryResponse>(`/api/commitments/${id}/history`);
}
