export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost/backend/api';

export async function apiRequest(endpoint, options = {}) {
  const headers = new Headers(options.headers || {});
  const csrf = typeof window !== 'undefined' ? sessionStorage.getItem('jhatpatai_csrf') : '';
  if (csrf && options.method && options.method !== 'GET') headers.set('X-CSRF-Token', csrf);
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const response = await fetch(`${API_BASE}/${endpoint}`, { ...options, headers, credentials: 'include', cache: 'no-store' });
  let data;
  try { data = await response.json(); } catch { data = { status: 'error', message: 'Invalid server response' }; }
  if (!response.ok) {
    const error = new Error(data.message || 'Request failed');
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}

export function jsonBody(value) { return JSON.stringify(value); }
