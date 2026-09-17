const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  return response;
}

export async function apiGet(endpoint: string, options: RequestInit = {}) {
  return apiFetch(endpoint, {
    method: 'GET',
    ...options,
  });
}

export async function apiPost(endpoint: string, body: any, options: RequestInit = {}) {
  return apiFetch(endpoint, {
    method: 'POST',
    ...options,
    body: JSON.stringify(body),
  });
}

export async function apiPatch(endpoint: string, body: any, options: RequestInit = {}) {
  return apiFetch(endpoint, {
    method: 'PATCH',
    ...options,
    body: JSON.stringify(body),
  });
}

export async function apiDelete(endpoint: string, options: RequestInit = {}) {
  return apiFetch(endpoint, {
    method: 'DELETE',
    ...options,
  });
}
