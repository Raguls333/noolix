import { apiRequest } from "./http";

type ReportFilters = {
  days?: number;
  from?: string;
  to?: string;
  clientId?: string;
  assignedTo?: string;
  limit?: number;
};

function toQuery(params: ReportFilters = {}) {
  const sp = new URLSearchParams();
  if (params.days !== undefined) sp.set("days", String(params.days));
  if (params.from) sp.set("from", params.from);
  if (params.to) sp.set("to", params.to);
  if (params.clientId) sp.set("clientId", params.clientId);
  if (params.assignedTo) sp.set("assignedTo", params.assignedTo);
  if (params.limit) sp.set("limit", String(params.limit));
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

export async function pendingApprovals(filters: ReportFilters = {}) {
  return apiRequest<any>(`/api/reports/pending-approvals${toQuery(filters)}`);
}

export async function pendingAcceptance(filters: ReportFilters = {}) {
  return apiRequest<any>(`/api/reports/pending-acceptance${toQuery(filters)}`);
}

export async function atRisk(filters: ReportFilters = {}) {
  return apiRequest<any>(`/api/reports/at-risk${toQuery(filters)}`);
}

export async function agingReport(filters: ReportFilters = {}) {
  return apiRequest<any>(`/api/reports/aging${toQuery(filters)}`);
}

export async function clientBehaviorReport(filters: ReportFilters = {}) {
  return apiRequest<any>(`/api/reports/client-behavior${toQuery(filters)}`);
}

export async function revenueSummary() {
  return apiRequest<any>("/api/reports/revenue-summary");
}
