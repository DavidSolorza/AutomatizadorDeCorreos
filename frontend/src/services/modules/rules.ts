import api from '../api';

export const rulesApi = {
  list: () => api.get('/rules'),
  get: (id: string) => api.get(`/rules/${id}`),
  create: (data: any) => api.post('/rules', data),
  update: (id: string, data: any) => api.put(`/rules/${id}`, data),
  delete: (id: string) => api.delete(`/rules/${id}`),
  seed: () => api.post('/rules/seed'),
};
