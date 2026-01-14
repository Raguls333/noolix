// Central HTTP helper for NOOLIX frontend
// - Uses Vite proxy by default: call paths like '/api/...'
// - Attaches JWT token automatically (stored in localStorage)

export type ApiError = {
  ok: false;
  code?: string;
  message: string;
  requestId?: string;
  status?: number;
  details?: unknown;
};

const BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || '';

export function getToken() {
  return localStorage.getItem('noolix_token');
}

export function setToken(token: string | null) {
  if (!token) localStorage.removeItem('noolix_token');
  else localStorage.setItem('noolix_token', token);
}

async function parseJsonSafe(res: Response) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

export async function apiRequest<T>(
  path: string,
  opts: {
    method?: string;
    body?: any;
    headers?: Record<string, string>;
    auth?: boolean;
  } = {}
): Promise<T> {
  const method = opts.method || 'GET';
  const url = `${BASE_URL}${path}`;

  const headers: Record<string, string> = {
    ...(opts.headers || {}),
  };

  const isJsonBody = opts.body !== undefined && !(opts.body instanceof FormData);
  if (isJsonBody) headers['Content-Type'] = 'application/json';

  if (opts.auth !== false) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: isJsonBody ? JSON.stringify(opts.body) : (opts.body as any),
  });

  // File downloads
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/pdf') || contentType.includes('text/csv')) {
    // @ts-ignore
    return (await res.blob()) as T;
  }

  const data = await parseJsonSafe(res);

  if (!res.ok) {
    const err: ApiError = {
      ok: false,
      status: res.status,
      message: (data && (data.message || data.error || data.raw)) || `Request failed (${res.status})`,
      code: data?.code,
      requestId: data?.requestId,
      details: data,
    };
    throw err;
  }

  return data as T;
}
