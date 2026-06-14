import { isClosedStatus, normalizeCaseStatus } from '@/config/case-statuses';
import { CASE_CATEGORY_LABELS, type OperationalCase } from '@/types/cases';

export function matchesCaseSearch(caseItem: OperationalCase, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  return (
    caseItem.id.toLowerCase().includes(q) ||
    caseItem.subject?.toLowerCase().includes(q) ||
    caseItem.sender.toLowerCase().includes(q) ||
    caseItem.sender_name?.toLowerCase().includes(q) ||
    caseItem.assigned_name.toLowerCase().includes(q) ||
    caseItem.body?.toLowerCase().includes(q) ||
    caseItem.source_mailbox?.toLowerCase().includes(q) ||
    CASE_CATEGORY_LABELS[caseItem.category].toLowerCase().includes(q)
  );
}

export function formatElapsed(receivedAt: string, closedAt?: string | null): string {
  const end = closedAt ? new Date(closedAt).getTime() : Date.now();
  const hours = (end - new Date(receivedAt).getTime()) / 3600000;

  if (hours < 1) return `${Math.round(hours * 60)} min`;
  if (hours < 24) return `${hours.toFixed(1)} h`;
  const days = hours / 24;
  if (days < 7) return `${days.toFixed(1)} d`;
  return `${Math.round(days)} d`;
}

export function formatResponseTime(hours: number | null): string {
  if (hours == null) return '—';
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  if (hours < 24) return `${hours.toFixed(1)} h`;
  return `${(hours / 24).toFixed(1)} d`;
}

export function hoursBetween(start: string, end?: string | null): number {
  const endMs = end ? new Date(end).getTime() : Date.now();
  return (endMs - new Date(start).getTime()) / 3600000;
}

/** Tiempo abierto: desde ingreso hasta cierre (o ahora) */
export function getOpenTimeHours(caseItem: OperationalCase): number {
  return hoursBetween(caseItem.received_at, caseItem.closed_at);
}

/** Tiempo en gestión: desde inicio de gestión hasta cierre (o ahora) */
export function getManagementTimeHours(caseItem: OperationalCase): number | null {
  if (!caseItem.started_at) return null;
  return hoursBetween(caseItem.started_at, caseItem.closed_at);
}

/** Tiempo total de resolución */
export function getResolutionTimeHours(caseItem: OperationalCase): number | null {
  if (!caseItem.closed_at) return null;
  return hoursBetween(caseItem.received_at, caseItem.closed_at);
}

export function isCaseActive(caseItem: OperationalCase): boolean {
  return !isClosedStatus(caseItem.status);
}

export function isCaseCritical(caseItem: OperationalCase): boolean {
  const status = normalizeCaseStatus(caseItem.status);
  return caseItem.priority === 'urgente' || status === 'bloqueado';
}

export function computeAccumulatedHours(cases: OperationalCase[]): number {
  return cases
    .filter(isCaseActive)
    .reduce((sum, c) => sum + getOpenTimeHours(c), 0);
}
