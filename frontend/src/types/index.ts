export interface User {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
  updated_at: string;
  last_login: string | null;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface Email {
  id: string;
  account_id: string;
  gmail_message_id: string;
  thread_id: string | null;
  sender: string;
  sender_name: string | null;
  recipient: string;
  subject: string | null;
  body_plain: string | null;
  body_html: string | null;
  received_at: string;
  is_read: boolean;
  is_starred: boolean;
  is_archived: boolean;
  is_pinned: boolean;
  category: string | null;
  urgency_score: number | null;
  priority: string | null;
  created_at: string;
  attachments?: Attachment[];
  labels?: EmailLabel[];
}

export interface EmailListResponse {
  items: Email[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface Attachment {
  id: string;
  email_id: string;
  filename: string;
  mime_type: string | null;
  size_bytes: number | null;
}

export interface EmailLabel {
  id: string;
  email_id: string;
  name: string;
  color: string | null;
}

export interface EmailSummary {
  sender: string;
  sender_name: string | null;
  subject: string | null;
  received_at: string;
  links: string[];
  attachments: Attachment[];
  important_words: string[];
  detected_dates: string[];
  is_urgent: boolean;
  priority: string;
}

export interface Rule {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  field: string;
  operator: string;
  value: string;
  category: string | null;
  label: string | null;
  assigned_to?: string | null;
  is_active: boolean;
  priority: string;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  email_id: string;
  user_id: string;
  title: string;
  message: string | null;
  notification_type: string;
  is_read: boolean;
  created_at: string;
}

export interface GmailAccount {
  id: string;
  user_id: string;
  email: string;
  provider: string;
  is_connected: boolean;
  gmail_user_id: string | null;
  last_sync_at: string | null;
  synced_on_connect: number | null;
}

export interface DashboardStats {
  total_emails: number;
  unread_count: number;
  categories: Record<string, number>;
  recent_emails: Email[];
  starred_count: number;
}

export interface DailySummary {
  id: string;
  user_id: string;
  summary_date: string;
  summary_text: string;
  email_count: number;
  categories: string | null;
  key_highlights: string | null;
  is_read: boolean;
  created_at: string;
}

export interface Task {
  id: string;
  email_id: string | null;
  user_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  status: string;
  priority: string;
  source: string;
  tags: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskListResponse {
  items: Task[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export const CATEGORY_COLORS: Record<string, string> = {
  urgente: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800',
  universidad: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  trabajo: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800',
  personal: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800',
  pagos: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  reuniones: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800',
  no_deseado: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800',
  academicos: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800',
  publicidad: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800',
};

export function getCategoryColor(category: string | null): string {
  if (!category) return 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400';
  return CATEGORY_COLORS[category] || 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400';
}
