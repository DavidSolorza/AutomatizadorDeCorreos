import api from '../api';

export const emailsApi = {
  list: (params?: any) => api.get('/emails', { params }),
  get: (id: string) => api.get(`/emails/${id}`),
  update: (id: string, data: any) => api.patch(`/emails/${id}`, data),
  delete: (id: string) => api.delete(`/emails/${id}`),
  analyze: (id: string) => api.post(`/emails/${id}/analyze`),
  summary: (id: string) => api.get(`/emails/${id}/summary`),
  archive: (id: string) => api.post(`/emails/${id}/archive`),
  pin: (id: string) => api.post(`/emails/${id}/pin`),
  unpin: (id: string) => api.post(`/emails/${id}/unpin`),
  bulkArchiveRead: () => api.post('/emails/bulk/archive'),
  bulkDeleteNoDeseados: () => api.delete('/emails/bulk/no-deseados'),
};
