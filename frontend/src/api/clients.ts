import { apiRequest } from './http';

export type Client = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
};

export async function listClients(params: {
  page?: number;
  limit?: number;
  q?: string;
} = {}) {
  const sp = new URLSearchParams();
  if (params.page) sp.set('page', String(params.page));
  if (params.limit) sp.set('limit', String(params.limit));
  if (params.q) sp.set('search', params.q);
  const qs = sp.toString();
  return apiRequest<{ clients: Client[]; page: number; limit: number; total: number }>(
    `/api/clients${qs ? `?${qs}` : ''}`
  );
}

export async function createClient(payload: {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  companyName?: string;
}) {
  return apiRequest<Client>('/api/clients', { method: 'POST', body: payload });
}

export async function getClient(id: string) {
  const res = await apiRequest<{client: Client}>(`/api/clients/${id}`);
  return res.client;
}

export async function updateClient(
  id: string,
  payload: Partial<{ name: string; email: string; phone: string; company: string; companyName: string; isActive: boolean }>
) {
  return apiRequest<Client>(`/api/clients/${id}`, { method: 'PATCH', body: payload });
}
