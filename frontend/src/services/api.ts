import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import { supabase } from '@/lib/supabase';

const BASE_URL = (
  (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3000'
).replace(/\/$/, '');

export const httpClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach Supabase JWT as Authorization: Bearer <token>
httpClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }
    return config;
  },
  (error: unknown) => Promise.reject(error),
);

// Response interceptor: redirect on 401, normalize error messages
httpClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: unknown) => {
    if (error instanceof AxiosError) {
      if (error.response?.status === 401) {
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        return Promise.reject(new Error('Session expired. Please log in again.'));
      }
      const serverMessage = (
        error.response?.data as { message?: string } | undefined
      )?.message;
      return Promise.reject(
        new Error(serverMessage ?? error.message ?? 'An unexpected error occurred'),
      );
    }
    return Promise.reject(error);
  },
);
