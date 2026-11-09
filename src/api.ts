const TOKEN_KEY = 'blc_api_token';

export function setApiToken(token: string) { sessionStorage.setItem(TOKEN_KEY, token); }
export function clearApiToken() { sessionStorage.removeItem(TOKEN_KEY); }
export function hasApiToken() { return !!sessionStorage.getItem(TOKEN_KEY); }

export async function openAttachment(id: string): Promise<void> {
  const token = sessionStorage.getItem(TOKEN_KEY);
  const response = await fetch(`/api/v1/attachments/${encodeURIComponent(id)}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) throw new Error('Lampiran tidak dapat dibuka.');
  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement('a');
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export async function api<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const token = sessionStorage.getItem(TOKEN_KEY);
  const response = await fetch(`/api/v1${path}`, {
    method,
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || `HTTP ${response.status}`);
  return result as T;
}
