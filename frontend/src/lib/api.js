// Thin fetch wrapper. Authentication rides on an HttpOnly session cookie set by
// the server, so no tokens are ever stored in JavaScript-accessible storage.

export class ApiError extends Error {
  constructor(message, status, fields) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}

let unauthorizedHandler = null;

/** Called when any non-auth request comes back 401 (session expired/revoked). */
export function onUnauthorized(handler) {
  unauthorizedHandler = handler;
}

async function request(method, path, body) {
  let response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      credentials: 'same-origin',
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(navigator.onLine ? 'Could not reach the server' : "You're offline", 0);
  }

  if (response.status === 204) return null;

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    if (response.status === 401 && !path.startsWith('/auth/')) unauthorizedHandler?.();
    throw new ApiError(data?.error || `Request failed (${response.status})`, response.status, data?.fields);
  }
  return data;
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body = {}) => request('POST', path, body),
  put: (path, body = {}) => request('PUT', path, body),
  delete: (path) => request('DELETE', path),
};

export function query(params) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') search.set(key, value);
  }
  const str = search.toString();
  return str ? `?${str}` : '';
}
