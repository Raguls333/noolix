import { apiRequest } from "./http";

export type OrgSettings = {
  id: string;
  name: string;
  contactEmail: string;
  timezone: string;
  currency: string;
  approvalDefaults: {
    requireApproval: boolean;
    reApprovalOnChanges: boolean;
    acceptanceRequired: boolean;
  };
  notificationSettings: {
    approvalReminders: boolean;
    riskAlerts: boolean;
  };
};

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  lastActiveAt?: string;
  createdAt?: string;
};

export type ActivityLogItem = {
  id: string;
  createdAt: string;
  actor: {
    id: string | null;
    name: string;
    email: string;
    role: string;
  };
  action: string;
  details: string;
  ipAddress: string;
};

export type MasterItem = {
  id: string;
  type: "statuses" | "risk-levels" | "approval-types" | "payment-terms";
  label: string;
  color: string;
  active: boolean;
  usageCount: number;
};

type ActivityLogFilters = {
  from?: string;
  to?: string;
  actorId?: string;
  action?: string;
  limit?: number;
};

function toQuery(params: Record<string, any> = {}) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    sp.set(key, String(value));
  });
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

export async function getOrganizationSettings() {
  return apiRequest<{ organization: OrgSettings }>("/api/settings/organization");
}

export async function updateOrganizationSettings(payload: Partial<OrgSettings>) {
  return apiRequest<{ organization: OrgSettings }>("/api/settings/organization", {
    method: "PATCH",
    body: payload,
  });
}

export async function listTeamMembers() {
  return apiRequest<{ items: TeamMember[] }>("/api/settings/team");
}

export async function updateTeamMember(id: string, payload: { role?: string; isActive?: boolean }) {
  return apiRequest<{ user: TeamMember }>(`/api/settings/team/${id}`, {
    method: "PATCH",
    body: payload,
  });
}

export async function listActivityLog(filters: ActivityLogFilters = {}) {
  return apiRequest<{ items: ActivityLogItem[] }>(`/api/settings/activity${toQuery(filters)}`);
}

export async function listMasters(type: MasterItem["type"]) {
  return apiRequest<{ items: MasterItem[] }>(`/api/settings/masters${toQuery({ type })}`);
}

export async function createMaster(payload: Pick<MasterItem, "type" | "label" | "color">) {
  return apiRequest<{ item: MasterItem }>("/api/settings/masters", {
    method: "POST",
    body: payload,
  });
}

export async function updateMaster(id: string, payload: Partial<Pick<MasterItem, "label" | "color">>) {
  return apiRequest<{ item: MasterItem }>(`/api/settings/masters/${id}`, {
    method: "PATCH",
    body: payload,
  });
}

export async function toggleMaster(id: string, active: boolean) {
  return apiRequest<{ item: MasterItem }>(`/api/settings/masters/${id}/toggle`, {
    method: "PATCH",
    body: { active },
  });
}
