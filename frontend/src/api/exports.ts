import { apiRequest } from './http';

export async function downloadCommitmentPdf(commitmentId: string) {
  // Returns Blob
  return apiRequest<Blob>(`/api/exports/commitments/${commitmentId}/pdf`);
}

export async function downloadReportsCsv(params: Record<string, string | number | boolean> = {}) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => sp.set(k, String(v)));
  const qs = sp.toString();
  return apiRequest<Blob>(`/api/exports/reports.csv${qs ? `?${qs}` : ''}`);
}

export function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
