import axios, { type InternalAxiosRequestConfig } from 'axios';
import type { AuthResponse } from './authService';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  withCredentials: true,
  // Use the masked token from /auth/csrf; never overwrite it with the raw cookie.
  withXSRFToken: false,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

let accessToken: string | null = null;
let csrfRequest: Promise<string> | null = null;
let refreshRequest: Promise<AuthResponse> | null = null;
export const setAccessToken = (token: string | null) => { accessToken = token; };
const publicAuth = (url = '') => /^\/?auth\/(csrf|login|register|refresh)(?:\?|$)/.test(url);
interface RetriableRequest extends InternalAxiosRequestConfig { _retry?: boolean }

async function csrfToken(): Promise<string> {
  if (!csrfRequest) {
    csrfRequest = api.get('/auth/csrf').then(r => r.data.data.token as string)
      .finally(() => { csrfRequest = null; });
  }
  return csrfRequest;
}

export function refreshSession(): Promise<AuthResponse> {
  if (!refreshRequest) {
    const rotate = async () => {
      const { data } = await api.post('/auth/refresh', {});
      const session: AuthResponse = data.data;
      setAccessToken(session.accessToken);
      window.dispatchEvent(new CustomEvent('session-restored', { detail: session }));
      return session;
    };
    // Cookies are shared between tabs. Serialize rotations across tabs as well.
    refreshRequest = (navigator.locks ? navigator.locks.request('holoka-refresh', rotate) : rotate())
      .finally(() => { refreshRequest = null; });
  }
  return refreshRequest;
}

api.interceptors.request.use(async config => {
  if (!publicAuth(config.url) && accessToken) config.headers.set('Authorization', 'Bearer ' + accessToken);
  else config.headers.delete('Authorization');
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(config.method?.toUpperCase() ?? '')) {
    config.headers.set('X-XSRF-TOKEN', await csrfToken());
  }
  return config;
});

api.interceptors.response.use(response => response, async error => {
  const request = error.config as RetriableRequest | undefined;
  if (error.response?.status === 401 && request && !publicAuth(request.url)) {
    if (!request._retry) {
      request._retry = true;
      try {
        // A concurrent request may already have renewed this token.
        if (!accessToken || request.headers.get('Authorization') === 'Bearer ' + accessToken) await refreshSession();
        return await api(request);
      } catch (refreshError) {
        if (axios.isAxiosError(refreshError) && refreshError.response?.status === 401) {
          setAccessToken(null);
          window.dispatchEvent(new Event('auth-change'));
        }
        return Promise.reject(refreshError);
      }
    }
    setAccessToken(null);
    window.dispatchEvent(new Event('auth-change'));
  }
  return Promise.reject(error);
});

export function errorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const fields = error.response?.data?.fieldErrors as Record<string, string> | undefined;
    if (fields) return Object.entries(fields).map(([key, value]) => key + ': ' + value).join(' · ');
    if (error.response?.status === 409) return error.response.data?.message || 'Dữ liệu đã thay đổi. Vui lòng tải lại trước khi lưu.';
    return error.response?.data?.message || 'Không kết nối được máy chủ. Vui lòng kiểm tra backend và thử lại.';
  }
  return error instanceof Error ? error.message : 'Có lỗi xảy ra. Vui lòng thử lại.';
}
export default api;
