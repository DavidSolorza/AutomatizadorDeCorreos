import api from '../api';

export const usersApi = {
  getProfile: () => api.get('/users/me'),
  updateProfile: (data: any) => api.put('/users/me', data),
  deleteAccount: () => api.delete('/users/me'),
};
