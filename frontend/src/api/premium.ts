import { apiRequest } from './http';

export async function getBranding() {
  return apiRequest<any>('/api/premium/branding');
}

export async function updateBranding(payload: any) {
  return apiRequest<any>('/api/premium/branding', { method: 'PATCH', body: payload });
}

export async function createSlaRule(payload: any) {
  return apiRequest<any>('/api/premium/sla-rules', { method: 'POST', body: payload });
}

export async function listSlaRules() {
  return apiRequest<any>('/api/premium/sla-rules');
}
