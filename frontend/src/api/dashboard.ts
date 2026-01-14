import { apiRequest } from "./http";

export async function getFounderDashboard() {
  return apiRequest<any>("/api/dashboard/founder");
}

export async function getManagerDashboard() {
  return apiRequest<any>("/api/dashboard/manager");
}

export async function getClientDashboard(clientId?: string) {
  const qs = clientId ? `?clientId=${encodeURIComponent(clientId)}` : "";
  return apiRequest<any>(`/api/dashboard/client${qs}`);
}
