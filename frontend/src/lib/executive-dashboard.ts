import {
  isClosedStatus,
  normalizeCaseStatus,
  PENDING_STATUSES,
  CASE_STATUS_LABELS,
} from '@/config/case-statuses';
import {
  getOpenTimeHours,
  isCaseCritical,
  hoursBetween,
} from '@/lib/case-utils';
import type {
  AnalystStats,
  DashboardMetrics,
  OperationalCase,
} from '@/types/cases';
import { ANALYST_PROFILES } from '@/config';

export type OperationHealth = 'stable' | 'risk' | 'critical';

export type TrendGranularity = 'daily' | 'weekly' | 'monthly';

export interface OperationStatus {
  health: OperationHealth;
  label: string;
  description: string;
  activeCases: number;
  backloggedCases: number;
  criticalCases: number;
  avgResponseTime: number;
}

export interface KpiWithDelta {
  value: number | string;
  delta: number | null;
  deltaLabel: string;
  isPositiveGood: boolean;
}

export interface PriorityCase {
  caseItem: OperationalCase;
  reason: string;
  score: number;
  elapsedLabel: string;
}

export interface OperationalAlert {
  id: string;
  severity: 'warning' | 'critical';
  message: string;
}

export interface TrendPoint {
  label: string;
  received: number;
  closed: number;
  pending: number;
}

const HEALTH_CONFIG: Record<
  OperationHealth,
  { label: string; description: string; dot: string; gradient: string; border: string }
> = {
  stable: {
    label: 'Operación Estable',
    description: 'La operación fluye con niveles normales de carga y sin alertas críticas.',
    dot: 'bg-success',
    gradient: 'from-success/8 via-bg-secondary to-bg-secondary',
    border: 'border-success/25',
  },
  risk: {
    label: 'Operación con Riesgos',
    description: 'Hay señales de sobrecarga o casos represados que requieren seguimiento.',
    dot: 'bg-warning',
    gradient: 'from-warning/10 via-bg-secondary to-bg-secondary',
    border: 'border-warning/30',
  },
  critical: {
    label: 'Operación Crítica',
    description: 'Múltiples indicadores críticos activos. Se requiere intervención inmediata.',
    dot: 'bg-error',
    gradient: 'from-error/10 via-bg-secondary to-bg-secondary',
    border: 'border-error/35',
  },
};

export function getOperationStatus(
  metrics: DashboardMetrics,
  cases: OperationalCase[],
): OperationStatus {
  const activeCases = cases.filter((c) => !isClosedStatus(c.status));
  const backloggedCases = activeCases.filter(
    (c) => normalizeCaseStatus(c.status) === 'bloqueado',
  ).length;
  const staleCases = activeCases.filter((c) => getOpenTimeHours(c) >= 72).length;
  const criticalCases = metrics.critical;
  const maxAnalystLoad = Math.max(
    ...Object.values(metrics.by_analyst).map((a) => a.active),
    0,
  );

  let health: OperationHealth = 'stable';
  if (
    criticalCases >= 5 ||
    backloggedCases >= 5 ||
    staleCases >= 8 ||
    maxAnalystLoad >= 40
  ) {
    health = 'critical';
  } else if (
    criticalCases > 0 ||
    backloggedCases >= 2 ||
    staleCases >= 3 ||
    maxAnalystLoad >= 28
  ) {
    health = 'risk';
  }

  const config = HEALTH_CONFIG[health];
  return {
    health,
    label: config.label,
    description: config.description,
    activeCases: activeCases.length,
    backloggedCases,
    criticalCases,
    avgResponseTime: metrics.avg_response_time,
  };
}

export function getHealthStyle(health: OperationHealth) {
  return HEALTH_CONFIG[health];
}

export function filterCasesByAnalyst(
  cases: OperationalCase[],
  analystId: string | null,
): OperationalCase[] {
  if (!analystId) return cases;
  return cases.filter((c) => c.assigned_to === analystId);
}

export function buildMetricsFromCases(cases: OperationalCase[]): DashboardMetrics {
  const closed = cases.filter((c) => isClosedStatus(c.status));
  const pending = cases.filter((c) =>
    PENDING_STATUSES.includes(normalizeCaseStatus(c.status)),
  );
  const blocked = cases.filter((c) => normalizeCaseStatus(c.status) === 'bloqueado');
  const critical = cases.filter(
    (c) => c.priority === 'urgente' || normalizeCaseStatus(c.status) === 'bloqueado',
  );
  const closedWithTime = closed.filter((c) => c.response_time != null);

  const by_category: Record<string, number> = {};
  for (const c of cases) {
    by_category[c.category] = (by_category[c.category] || 0) + 1;
  }

  const by_analyst: DashboardMetrics['by_analyst'] = {};
  const analystNames = new Set(cases.map((c) => c.assigned_name));
  for (const name of analystNames) {
    const analystCases = cases.filter((c) => c.assigned_name === name);
    const analystClosed = analystCases.filter((c) => isClosedStatus(c.status));
    const activeCases = analystCases.filter((c) => !isClosedStatus(c.status));
    const times = analystClosed.filter((c) => c.response_time).map((c) => c.response_time!);
    by_analyst[name] = {
      active: activeCases.length,
      in_process: activeCases.filter((c) => normalizeCaseStatus(c.status) === 'en_proceso').length,
      pending: activeCases.filter((c) =>
        PENDING_STATUSES.includes(normalizeCaseStatus(c.status)),
      ).length,
      blocked: activeCases.filter((c) => normalizeCaseStatus(c.status) === 'bloqueado').length,
      closed: analystClosed.length,
      avg_time: times.length ? times.reduce((a, b) => a + b, 0) / times.length : 0,
      accumulated_hours: Math.round(
        activeCases.reduce((s, c) => s + getOpenTimeHours(c), 0) * 10,
      ) / 10,
    };
  }

  const today = startOfDay(new Date());
  return {
    received_today: cases.filter((c) => startOfDay(new Date(c.received_at)).getTime() === today.getTime()).length,
    pending: pending.length,
    closed: closed.length,
    blocked: blocked.length,
    critical: critical.length,
    avg_response_time: closedWithTime.length
      ? closedWithTime.reduce((s, c) => s + (c.response_time || 0), 0) / closedWithTime.length
      : 0,
    by_category,
    by_analyst,
  };
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function isSameDay(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

function countReceivedOn(cases: OperationalCase[], day: Date): number {
  return cases.filter((c) => isSameDay(new Date(c.received_at), day)).length;
}

function countClosedOn(cases: OperationalCase[], day: Date): number {
  return cases.filter(
    (c) => c.closed_at && isSameDay(new Date(c.closed_at), day),
  ).length;
}

function countPendingAt(cases: OperationalCase[], at: Date): number {
  const atMs = at.getTime();
  return cases.filter((c) => {
    const received = new Date(c.received_at).getTime();
    const closed = c.closed_at ? new Date(c.closed_at).getTime() : null;
    return received <= atMs && (closed === null || closed > atMs);
  }).length;
}

export function computeKpiDeltas(
  metrics: DashboardMetrics,
  cases: OperationalCase[],
): {
  receivedToday: KpiWithDelta;
  pending: KpiWithDelta;
  closed: KpiWithDelta;
  avgTime: KpiWithDelta;
} {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const receivedToday = metrics.received_today;
  const receivedYesterday = countReceivedOn(cases, yesterday);

  const closedToday = countClosedOn(cases, today);
  const closedYesterday = countClosedOn(cases, yesterday);

  const activeNow = cases.filter((c) => !isClosedStatus(c.status)).length;
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const pendingWeekAgo = countPendingAt(cases, weekAgo);

  const last30Closed = cases.filter((c) => {
    if (!c.closed_at || !c.response_time) return false;
    return Date.now() - new Date(c.closed_at).getTime() <= 30 * 86400000;
  });
  const prev30Closed = cases.filter((c) => {
    if (!c.closed_at || !c.response_time) return false;
    const closedMs = new Date(c.closed_at).getTime();
    const now = Date.now();
    return now - closedMs > 30 * 86400000 && now - closedMs <= 60 * 86400000;
  });

  const avgLast30 = last30Closed.length
    ? last30Closed.reduce((s, c) => s + (c.response_time || 0), 0) / last30Closed.length
    : metrics.avg_response_time;
  const avgPrev30 = prev30Closed.length
    ? prev30Closed.reduce((s, c) => s + (c.response_time || 0), 0) / prev30Closed.length
    : avgLast30;

  const pctDelta = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const formatDelta = (delta: number, unit: string) => {
    if (delta === 0) return `Sin cambio vs ${unit}`;
    const sign = delta > 0 ? '+' : '';
    return `${sign}${delta}% vs ${unit}`;
  };

  const receivedDelta = pctDelta(receivedToday, receivedYesterday);
  const closedDelta = pctDelta(closedToday, closedYesterday);
  const pendingDelta = pctDelta(activeNow, pendingWeekAgo);
  const timeDelta = pctDelta(avgLast30, avgPrev30);

  const formatTime = (h: number) => {
    if (h < 1) return `${Math.round(h * 60)} min`;
    if (h < 24) return `${h.toFixed(1)} h`;
    return `${(h / 24).toFixed(1)} d`;
  };

  return {
    receivedToday: {
      value: receivedToday,
      delta: receivedDelta,
      deltaLabel: formatDelta(receivedDelta, 'ayer'),
      isPositiveGood: true,
    },
    pending: {
      value: metrics.pending,
      delta: pendingDelta,
      deltaLabel: formatDelta(pendingDelta, 'semana ant.'),
      isPositiveGood: false,
    },
    closed: {
      value: metrics.closed,
      delta: closedDelta,
      deltaLabel: formatDelta(closedDelta, 'ayer'),
      isPositiveGood: true,
    },
    avgTime: {
      value: formatTime(metrics.avg_response_time),
      delta: timeDelta,
      deltaLabel: formatDelta(timeDelta, 'mes ant.'),
      isPositiveGood: false,
    },
  };
}

export function getPriorityCases(cases: OperationalCase[], limit = 5): PriorityCase[] {
  const active = cases.filter((c) => !isClosedStatus(c.status));

  const scored = active.map((caseItem) => {
    let score = 0;
    const reasons: string[] = [];
    const status = normalizeCaseStatus(caseItem.status);
    const openHours = getOpenTimeHours(caseItem);
    const staleHours = hoursBetween(caseItem.updated_at);

    if (isCaseCritical(caseItem)) {
      score += 100;
      reasons.push('Caso crítico');
    }
    if (status === 'bloqueado') {
      score += 80;
      reasons.push('Represado');
    }
    if (openHours >= 72) {
      score += 60 + Math.min(openHours - 72, 48);
      reasons.push('Más de 72 h abierto');
    }
    if (status === 'pendiente_documentacion') {
      score += 40;
      reasons.push('Pendiente documentación');
    }
    if (staleHours >= 48) {
      score += 35;
      reasons.push('Sin movimiento reciente');
    }
    if (caseItem.priority === 'urgente') {
      score += 50;
      reasons.push('Prioridad urgente');
    }
    if (PENDING_STATUSES.includes(status) && openHours >= 48) {
      score += 25;
      reasons.push('Próximo a incumplir SLA');
    }

    const elapsedLabel =
      openHours < 24
        ? `${Math.round(openHours)} h`
        : `${Math.round(openHours / 24)} d`;

    return {
      caseItem,
      score,
      reason: reasons[0] || 'Requiere seguimiento',
      elapsedLabel,
    };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function buildOperationalAlerts(
  metrics: DashboardMetrics,
  analysts: AnalystStats[],
  cases: OperationalCase[],
): OperationalAlert[] {
  const alerts: OperationalAlert[] = [];
  const maxActive = Math.max(...analysts.map((a) => a.active_cases), 0);
  const overloaded = analysts.find(
    (a) => a.active_cases >= maxActive * 0.75 && maxActive >= 20,
  );

  if (overloaded) {
    alerts.push({
      id: 'overload',
      severity: overloaded.active_cases >= 35 ? 'critical' : 'warning',
      message: `${overloaded.name.split(' ')[0]} tiene sobrecarga operativa (${overloaded.active_cases} casos activos).`,
    });
  }

  const stale72 = cases.filter(
    (c) => !isClosedStatus(c.status) && getOpenTimeHours(c) >= 72,
  ).length;
  if (stale72 > 0) {
    alerts.push({
      id: 'stale72',
      severity: stale72 >= 8 ? 'critical' : 'warning',
      message: `${stale72} caso${stale72 !== 1 ? 's' : ''} llevan más de 72 horas abiertos.`,
    });
  }

  if (metrics.blocked > 0) {
    alerts.push({
      id: 'blocked',
      severity: metrics.blocked >= 3 ? 'critical' : 'warning',
      message: `Existen ${metrics.blocked} caso${metrics.blocked !== 1 ? 's' : ''} bloqueados.`,
    });
  }

  const pendingDocs = cases.filter(
    (c) => normalizeCaseStatus(c.status) === 'pendiente_documentacion',
  ).length;
  if (pendingDocs > 0) {
    alerts.push({
      id: 'pending-docs',
      severity: 'warning',
      message: `Hay ${pendingDocs} caso${pendingDocs !== 1 ? 's' : ''} pendientes de documentación.`,
    });
  }

  if (metrics.critical > 0) {
    alerts.push({
      id: 'critical',
      severity: 'critical',
      message: `${metrics.critical} caso${metrics.critical !== 1 ? 's' : ''} marcados como críticos.`,
    });
  }

  return alerts.slice(0, 5);
}

export function buildTrendData(
  cases: OperationalCase[],
  granularity: TrendGranularity,
): TrendPoint[] {
  const now = new Date();
  const points: TrendPoint[] = [];

  const bucketCount = granularity === 'daily' ? 7 : granularity === 'weekly' ? 6 : 6;

  for (let i = bucketCount - 1; i >= 0; i--) {
    const end = new Date(now);
    let start = new Date(now);
    let label = '';

    if (granularity === 'daily') {
      end.setDate(end.getDate() - i);
      start = startOfDay(end);
      end.setHours(23, 59, 59, 999);
      label = end.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric' });
    } else if (granularity === 'weekly') {
      end.setDate(end.getDate() - i * 7);
      start = new Date(end);
      start.setDate(start.getDate() - 6);
      start = startOfDay(start);
      label = `S${bucketCount - i}`;
    } else {
      end.setMonth(end.getMonth() - i);
      start = new Date(end.getFullYear(), end.getMonth(), 1);
      end.setMonth(end.getMonth() + 1);
      end.setDate(0);
      end.setHours(23, 59, 59, 999);
      label = end.toLocaleDateString('es-CO', { month: 'short' });
    }

    const startMs = start.getTime();
    const endMs = end.getTime();

    const received = cases.filter((c) => {
      const t = new Date(c.received_at).getTime();
      return t >= startMs && t <= endMs;
    }).length;

    const closed = cases.filter((c) => {
      if (!c.closed_at) return false;
      const t = new Date(c.closed_at).getTime();
      return t >= startMs && t <= endMs;
    }).length;

    const pending = countPendingAt(cases, end);

    points.push({ label, received, closed, pending });
  }

  return points;
}

export function getWorkloadBars(analysts: AnalystStats[]) {
  const maxActive = Math.max(...analysts.map((a) => a.active_cases), 1);
  return analysts
    .map((a) => ({
      id: a.id,
      name: a.name.split(' ')[0],
      fullName: a.name,
      active: a.active_cases,
      pending: a.pending_cases,
      closed: a.closed_cases,
      pct: Math.round((a.active_cases / maxActive) * 100),
      color: ANALYST_PROFILES[a.id]?.color || '#3B82F6',
      isOverloaded: a.active_cases >= maxActive * 0.75 && maxActive >= 20,
    }))
    .sort((a, b) => b.active - a.active);
}

export function getStatusLabel(status: string): string {
  return CASE_STATUS_LABELS[normalizeCaseStatus(status)];
}
