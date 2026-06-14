import api from '../api';

export const gmailApi = {
  getAuthUrl: () => api.get('/gmail/auth/url'),
  callback: (code: string) => api.get('/gmail/callback', { params: { code } }),
  accounts: () => api.get('/gmail/accounts'),
  sync: (accountId: string, maxResults = 200, labelIds = 'INBOX') =>
    api.post(`/gmail/accounts/${accountId}/sync`, null, {
      params: { max_results: maxResults, label_ids: labelIds },
    }),
  demoConnect: () => api.post('/gmail/demo/connect'),
  demoSyncAll: () => api.post('/gmail/demo/sync-all'),
};
