export class ApiError extends Error {
  constructor(message, status, details = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

async function request(path, options = {}) {
  let response;

  try {
    response = await fetch(path, {
      credentials: 'include',
      headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
      ...options
    });
  } catch {
    // The request never reached the server (offline, DNS, server asleep).
    throw new ApiError('Could not reach the server. Check your connection and try again.', 0);
  }

  let payload = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    throw new ApiError(
      payload?.error || `Request failed (${response.status}).`,
      response.status,
      payload?.details || []
    );
  }

  return payload;
}

export const api = {
  me: () => request('/api/me'),
  logout: () => request('/api/logout', { method: 'POST' }),
  listCapsules: () => request('/api/capsules'),
  createCapsule: (data) =>
    request('/api/capsules', { method: 'POST', body: JSON.stringify(data) }),
  updateCapsule: (id, data) =>
    request(`/api/capsules/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCapsule: (id) => request(`/api/capsules/${id}`, { method: 'DELETE' })
};
