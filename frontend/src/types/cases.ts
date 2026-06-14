export type { CaseStatus } from '@/config/case-statuses';
export {
  CASE_STATUS_LABELS,
  CASE_STATUS_DEFINITIONS,
  STATUS_COLORS,
  KANBAN_COLUMNS,
  CLOSED_STATUSES,
  PENDING_STATUSES,
  ACTIVE_STATUSES,
  normalizeCaseStatus,
  isClosedStatus,
  getStatusColor,
  getStatusBadgeVariant,
  kanbanColumnForStatus,
} from '@/config/case-statuses';

export type UserRole = 'admin' | 'analyst';

export interface DemoUser {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
  updated_at: string;
  last_login: string | null;
}

export type CaseCategory =
  | 'cotizaciones'
  | 'renovaciones'
  | 'emisiones'
  | 'cartera'
  | 'licitaciones'
  | 'colectivas'
  | 'sin_clasificar';

export type CasePriority = 'urgente' | 'alto' | 'media' | 'bajo';

export interface OperationalCase {
  id: string;
  sender: string;
  sender_name: string | null;
  subject: string | null;
  body: string | null;
  received_at: string;
  assigned_at?: string | null;
  started_at?: string | null;
  assigned_to: string;
  assigned_name: string;
  source_mailbox?: string | null;
  status: import('@/config/case-statuses').CaseStatus;
  category: CaseCategory;
  closed_at: string | null;
  response_time: number | null;
  observations: string | null;
  email_id: string | null;
  ai_summary?: string | null;
  action_items?: string[];
  deadlines?: string[];
  priority?: CasePriority | null;
  created_at: string;
  updated_at: string;
}

export interface CaseListResponse {
  items: OperationalCase[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface CaseHistoryEntry {
  id: string;
  case_id: string;
  action: string;
  performed_by: string;
  performed_by_name: string;
  created_at: string;
}

export interface CaseHistoryResponse {
  items: CaseHistoryEntry[];
  total: number;
}

export interface AnalystWorkload {
  active: number;
  in_process: number;
  pending: number;
  blocked: number;
  closed: number;
  avg_time: number;
  accumulated_hours: number;
}

export interface DashboardMetrics {
  received_today: number;
  pending: number;
  closed: number;
  blocked: number;
  critical: number;
  avg_response_time: number;
  by_category: Record<string, number>;
  by_analyst: Record<string, AnalystWorkload>;
}

export interface PeriodMetrics {
  period: 'daily' | 'weekly' | 'monthly';
  avg_response_time: number;
  cases_attended: number;
  cases_pending: number;
  cases_backlogged: number;
}

export interface AnalystStats {
  id: string;
  name: string;
  email: string;
  active_cases: number;
  in_process_cases: number;
  pending_cases: number;
  blocked_cases: number;
  closed_cases: number;
  avg_response_time: number;
  accumulated_hours: number;
  workload: number;
}

export const CASE_CATEGORY_LABELS: Record<CaseCategory, string> = {
  cotizaciones: 'Cotizaciones',
  renovaciones: 'Renovaciones',
  emisiones: 'Emisiones',
  cartera: 'Cartera',
  licitaciones: 'Licitaciones',
  colectivas: 'Colectivas de Automóviles',
  sin_clasificar: 'Sin clasificar',
};

export const CATEGORY_COLORS: Record<string, string> = {
  cotizaciones: 'bg-primary/10 text-[#1d4ed8] border-primary/20',
  renovaciones: 'bg-secondary/10 text-[#0f766e] border-secondary/20',
  emisiones: 'bg-info/10 text-[#1d4ed8] border-info/20',
  cartera: 'bg-primary/8 text-primary border-primary/15',
  licitaciones: 'bg-secondary/8 text-[#0d9488] border-secondary/15',
  colectivas: 'bg-info/8 text-info border-info/15',
  sin_clasificar: 'bg-bg-tertiary text-text-secondary border-border',
};

export const CATEGORY_CHART_COLORS: Record<string, string> = {
  cotizaciones: '#2563EB',
  renovaciones: '#14B8A6',
  emisiones: '#3B82F6',
  cartera: '#1D4ED8',
  licitaciones: '#0D9488',
  colectivas: '#60A5FA',
  sin_clasificar: '#64748B',
};

export function getCategoryColor(category: string | null): string {
  if (!category) return CATEGORY_COLORS.sin_clasificar;
  return CATEGORY_COLORS[category] || CATEGORY_COLORS.sin_clasificar;
}
