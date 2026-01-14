// ✅ auth.ts (production-ready)
import { apiRequest, setToken } from './http';

export type LoginResponse = {
  ok?: boolean;
  token: string;
  user?: { id: string; email: string; role: string };
  org?: { id: string; plan?: string };
};

// ✅ Persist token so refresh keeps session
const TOKEN_KEY = 'noolix.token';

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function hydrateTokenFromStorage() {
  const t = getToken();
  if (t) setToken(t);
  return t;
}

export async function login(email: string, password: string) {
  const res = await apiRequest<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: { email, password },
    auth: false,
  });

  if (res?.token) {
    // ✅ set in memory (http.ts) + persist
    setToken(res.token);
    try {
      localStorage.setItem(TOKEN_KEY, res.token);
    } catch {}
  }

  return res;
}

// ✅ (Optional but recommended) verify token on refresh
export async function me() {
  // backend should expose this; if not available, delete this function or add endpoint
  return apiRequest<{ user?: { id: string; email: string; role: string } }>('/api/org/me', {
    method: 'GET',
  });
}

export function logout() {
  setToken(null);
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {}
}
