import { apiRequest } from "./http";

export type ChangeRequestStatus = "OPEN" | "ACCEPTED" | "REJECTED";

export type ChangeRequest = {
  _id: string;
  orgId?: string;
  reason?: string;
  status?: ChangeRequestStatus;
  commitmentId?: string;
  commitmentVersion?: number;
  requestedByType?: "CLIENT" | "USER" | string;
  requestedBy?: { name?: string; email?: string };
  createdAt?: string;
  updatedAt?: string;
};

export async function listChangeRequests(params: {
  status?: ChangeRequestStatus;
  page?: number;
  limit?: number;
  commitmentId?: string;
} = {}) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") sp.set(k, String(v));
  });
  const qs = sp.toString();
  return apiRequest<{ items: ChangeRequest[] } | ChangeRequest[]>(
    `/api/change-requests${qs ? `?${qs}` : ""}`
  );
}

export async function listCommitmentChangeRequests(commitmentId: string) {
  return apiRequest<{ items: ChangeRequest[] } | ChangeRequest[]>(
    `/api/commitments/${commitmentId}/change-requests`
  );
}

export async function acceptChangeRequest(
  commitmentId: string,
  changeRequestId: string,
  payload: Partial<{
    title: string;
    scopeTitle: string;
    scopeDescription: string;
    scopeText: string;
    amount: number;
    currency: string;
    attachments: unknown[];
    paymentTerms: unknown[];
    milestones: unknown[];
    approvalRules: {
      approver?: "CLIENT_ONLY" | "BOTH_PARTIES";
      reApprovalOnChanges?: boolean;
      acceptanceRequired?: boolean;
    };
    assignedToUserId: string;
    resolutionNote: string;
  }> = {}
) {
  return apiRequest<any>(
    `/api/commitments/${commitmentId}/change-requests/${changeRequestId}/accept`,
    { method: "POST", body: payload }
  );
}

export async function rejectChangeRequest(
  commitmentId: string,
  changeRequestId: string,
  payload: Partial<{ resolutionNote: string }> = {}
) {
  return apiRequest<any>(
    `/api/commitments/${commitmentId}/change-requests/${changeRequestId}/reject`,
    { method: "POST", body: payload }
  );
}
