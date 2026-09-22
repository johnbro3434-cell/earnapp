export const TOKEN_KEY = 'earnhub_bd_token';
export const DEVICE_FP_KEY = 'earnhub_bd_device_fp';

export function getDeviceFingerprint(): string {
  let fp = localStorage.getItem(DEVICE_FP_KEY);
  if (!fp) {
    fp = 'fp_bd_' + Math.random().toString(36).substring(2, 12) + '_' + Date.now().toString(36);
    localStorage.setItem(DEVICE_FP_KEY, fp);
  }
  return fp;
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem(TOKEN_KEY);
  const fp = getDeviceFingerprint();
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
  if (typeof window !== 'undefined') {
    return '';
  }
  const isProd = typeof process !== 'undefined' && process.env?.NODE_ENV === 'production';
  return isProd ? '' : 'http://localhost:3000';
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  return apiFetch(endpoint, options);
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
