import api from '../api';

export const summaryApi = {
  list: (limit?: number) => api.get('/summaries', { params: { limit: limit || 30 } }),
  generateDaily: (date?: string) => api.post('/summaries/daily', null, { params: { summary_date: date } }),
  markRead: (id: string) => api.patch(`/summaries/${id}/read`),
};
