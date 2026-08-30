import axios from 'axios';

const axiosInstance = axios.create({
  baseURL:
    (import.meta as any).env?.VITE_API_BASE_URL ||
    (import.meta as any).env?.VITE_API_URL ||
    'https://masajid-1ggr.onrender.com/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('masajid_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => {
    if (response.data && response.data.data !== undefined) {
      return response.data.data;
    }
    return response.data;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('masajid_token');
      localStorage.removeItem('masajid_admin');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'حدث خطأ في الاتصال بالخادم';
    return Promise.reject(new Error(Array.isArray(message) ? message[0] : message));
  },
);

export const api = {
  get: <T = any>(url: string, config?: any): Promise<T> => axiosInstance.get(url, config) as any,
  post: <T = any>(url: string, data?: any, config?: any): Promise<T> => axiosInstance.post(url, data, config) as any,
  patch: <T = any>(url: string, data?: any, config?: any): Promise<T> => axiosInstance.patch(url, data, config) as any,
  delete: <T = any>(url: string, config?: any): Promise<T> => axiosInstance.delete(url, config) as any,
};

export const apiClient = api;
