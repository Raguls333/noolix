import { apiRequest } from './http';

export async function getApprovalInfo(token: string) {
  return apiRequest<any>(`/api/public/approve/${token}`, { auth: false });
}

export async function postApproval(token: string, action: 'approve' | 'request_change', comment?: string) {
  const body: { action: 'approve' | 'request_change'; comment?: string } = { action };
  if (comment) body.comment = comment;
  return apiRequest<any>(`/api/public/approve/${token}`, {
    method: 'POST',
    body,
    auth: false,
  });
}

export async function getAcceptanceInfo(token: string) {
  return apiRequest<any>(`/api/public/accept/${token}`, { auth: false });
}

export async function postAcceptance(
  token: string,
  action: 'accept' | 'request_fix',
  comment?: string
) {
  return apiRequest<any>(`/api/public/accept/${token}`, {
    method: 'POST',
    body: { action, comment },
    auth: false,
  });
}
