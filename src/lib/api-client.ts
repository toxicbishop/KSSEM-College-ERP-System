import { auth } from './firebase/client';

const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || 'https://college-erp-system-l7ij.onrender.com';

async function getAuthHeaders() {
  const user = auth?.currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }
  const token = await user.getIdToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

export async function apiGet<T>(path: string): Promise<T> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${GATEWAY_URL}${path}`, {
    method: 'GET',
    headers,
  });
  if (!response.ok) {
    throw new Error(`API GET Error: ${response.statusText}`);
  }
  return response.json();
}

export async function apiPost<T>(path: string, body: any): Promise<T> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${GATEWAY_URL}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`API POST Error: ${response.statusText}`);
  }
  return response.json();
}

export async function apiPatch<T>(path: string, body: any): Promise<T> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${GATEWAY_URL}${path}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`API PATCH Error: ${response.statusText}`);
  }
  return response.json();
}

export async function apiDelete<T>(path: string): Promise<T> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${GATEWAY_URL}${path}`, {
    method: 'DELETE',
    headers,
  });
  if (!response.ok) {
    throw new Error(`API DELETE Error: ${response.statusText}`);
  }
  // Delete might not return a body, depending on implementation
  const text = await response.text();
  return text ? JSON.parse(text) : ({} as T);
}
