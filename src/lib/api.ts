export const TOKEN_KEY = 'earnhub_bd_token';
export const DEVICE_FP_KEY = 'earnhub_bd_device_fp';

export function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem(TOKEN_KEY);
  const fp = localStorage.getItem(DEVICE_FP_KEY) || 'fp_default_dev';
  const headers: Record<string, string> = {
    'x-device-fingerprint': fp,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export function setAuthToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeAuthToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function getApiBaseUrl(): string {
  // Always return relative path '' in browser so requests hit the same host seamlessly
  if (typeof window !== 'undefined') {
    return '';
  }
  const isProd = typeof process !== 'undefined' && process.env?.NODE_ENV === 'production';
  return isProd ? '' : 'http://localhost:3000';
}

export async function apiFetch(endpoint: string, options: RequestInit = {}): Promise<any> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...(options.headers as Record<string, string> || {}),
  };

  const res = await fetch(url, {
    ...options,
    headers,
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (err) {
    throw new Error(text || 'সার্ভার থেকে অবৈধ রেসপন্স এসেছে।');
  }

  if (!res.ok) {
    throw new Error(data?.error || data?.message || 'অনুরোধটি ব্যর্থ হয়েছে।');
  }

  return data;
}
