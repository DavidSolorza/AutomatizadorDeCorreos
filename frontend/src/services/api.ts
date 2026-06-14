import axios from 'axios';
import { USE_MOCK } from '@/config';
import { handleMockRequest } from './mock/handler';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const demoUserId = localStorage.getItem('demo_user_id');
  if (demoUserId) {
    config.headers['X-Demo-User-Id'] = demoUserId;
  }

  if (USE_MOCK) {
    config.adapter = () => handleMockRequest(config);
    return config;
  }

  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refresh = localStorage.getItem('refresh_token');
      if (refresh && error.config.url !== '/auth/refresh') {
        try {
          const { data } = await axios.post('/api/v1/auth/refresh', { refresh_token: refresh });
          localStorage.setItem('access_token', data.access_token);
          localStorage.setItem('refresh_token', data.refresh_token);
          error.config.headers.Authorization = `Bearer ${data.access_token}`;
          return api(error.config);
        } catch {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          if (!USE_MOCK) window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;

export {
  authApi,
  usersApi,
  emailsApi,
  gmailApi,
  rulesApi,
  tasksApi,
  notificationsApi,
  summaryApi,
  casesApi,
} from './modules';
