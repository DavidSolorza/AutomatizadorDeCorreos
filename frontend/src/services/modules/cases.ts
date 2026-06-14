import api from '../api';
import type {
  OperationalCase,
  CaseListResponse,
  CaseHistoryResponse,
  DashboardMetrics,
  PeriodMetrics,
  AnalystStats,
} from '@/types/cases';

export const casesApi = {
  list: (params?: Record<string, unknown>) =>
    api.get<CaseListResponse>('/cases', { params }),

  get: (id: string) =>
    api.get<OperationalCase>(`/cases/${id}`),

  update: (id: string, data: Partial<OperationalCase>) =>
    api.patch<OperationalCase>(`/cases/${id}`, data),

  history: (params?: { case_id?: string; limit?: number }) =>
    api.get<CaseHistoryResponse>('/cases/history', { params }),

  dashboard: () =>
    api.get<DashboardMetrics>('/cases/metrics/dashboard'),

  periodMetrics: (period: 'daily' | 'weekly' | 'monthly') =>
    api.get<PeriodMetrics>(`/cases/metrics/${period}`),

  analysts: () =>
    api.get<AnalystStats[]>('/cases/analysts'),

  simulate: (data: { sender: string; sender_name?: string; subject: string; body: string }) =>
    api.post<OperationalCase>('/cases/simulate', data),
};
