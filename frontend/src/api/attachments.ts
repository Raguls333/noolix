import { apiRequest } from './http';

export async function initUpload(payload: { filename: string; mimeType: string; size: number }) {
  return apiRequest<any>('/api/attachments', { method: 'POST', body: payload });
}

export async function completeUpload(payload: { uploadId: string; storageKey: string }) {
  return apiRequest<any>('/api/attachments/complete', { method: 'POST', body: payload });
}

export async function listCommitmentAttachments(commitmentId: string) {
  return apiRequest<any>(`/api/commitments/${commitmentId}/attachments`);
}
