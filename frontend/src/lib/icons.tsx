import type { LucideIcon } from 'lucide-react';
import {
  Briefcase,
  FileText,
  ShieldCheck,
  Inbox,
  Loader2,
  Clock,
  PauseCircle,
  CheckCircle2,
  UserCheck,
  FileQuestion,
  Building2,
  ShieldAlert,
  AlertOctagon,
} from 'lucide-react';
import type { CaseStatus } from '@/config/case-statuses';
import { normalizeCaseStatus } from '@/config/case-statuses';

const ANALYST_ICON_MAP: Record<string, LucideIcon> = {
  Briefcase,
  FileText,
  ShieldCheck,
};

const STATUS_ICON_MAP: Record<CaseStatus, LucideIcon> = {
  nuevo: Inbox,
  asignado: UserCheck,
  en_proceso: Loader2,
  pendiente_cliente: Clock,
  pendiente_documentacion: FileQuestion,
  en_revision_bogota: Building2,
  requiere_autorizacion: ShieldAlert,
  bloqueado: AlertOctagon,
  cerrado: CheckCircle2,
};

const KANBAN_COLUMN_ICONS: Record<string, LucideIcon> = {
  entrada: Inbox,
  gestion: Loader2,
  pendientes: Clock,
  bloqueado: PauseCircle,
  cerrado: CheckCircle2,
};

export function getAnalystIcon(name: string): LucideIcon {
  return ANALYST_ICON_MAP[name] || Briefcase;
}

export function getStatusIcon(status: CaseStatus | string): LucideIcon {
  return STATUS_ICON_MAP[normalizeCaseStatus(status)] || Inbox;
}

export function getKanbanColumnIcon(columnKey: string): LucideIcon {
  return KANBAN_COLUMN_ICONS[columnKey] || Inbox;
}
