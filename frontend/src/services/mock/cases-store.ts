import type {
  OperationalCase,
  CaseHistoryEntry,
  DashboardMetrics,
  PeriodMetrics,
  AnalystStats,
  CaseStatus,
  CaseCategory,
} from '@/types/cases';
import { DEMO_USERS, getDemoUserById, assignAnalystForCategory, ANALYST_MAILBOXES } from '@/config';
import {
  normalizeCaseStatus,
  isClosedStatus,
  PENDING_STATUSES,
  CASE_STATUS_LABELS,
  LEGACY_STATUS_MAP,
} from '@/config/case-statuses';
import { computeAccumulatedHours, getOpenTimeHours } from '@/lib/case-utils';
import { analyzeInsuranceEmail } from '@/lib/email-analyzer';
import { MOCK_CASES, MOCK_CASE_HISTORY, INSURANCE_RULES } from './cases-data';
import { seedWorkloadDemoCases } from './workload-seed';

function clone<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

function enrichCase(c: OperationalCase): OperationalCase {
  const analyst = assignAnalystForCategory(c.category as CaseCategory);
  const status = normalizeCaseStatus(c.status);
  const base = {
    ...c,
    status,
    assigned_to: c.assigned_to || analyst.id,
    assigned_name: c.assigned_name || analyst.name,
    assigned_at: c.assigned_at || c.received_at,
    source_mailbox:
      c.source_mailbox ||
      ANALYST_MAILBOXES[c.assigned_to || analyst.id]?.email ||
      `${c.assigned_to || analyst.id}@aseesta.com`,
    action_items: c.action_items ?? [],
    deadlines: c.deadlines ?? [],
  };
  if (base.ai_summary && base.action_items.length > 0) return base;
  const analysis = analyzeInsuranceEmail(
    base.sender,
    base.subject || '',
    base.body || '',
    base.category as CaseCategory,
  );
  return {
    ...base,
    ai_summary: base.ai_summary || analysis.ai_summary,
    action_items: base.action_items.length ? base.action_items : analysis.action_items,
    deadlines: base.deadlines.length ? base.deadlines : analysis.deadlines,
    priority: base.priority || analysis.priority,
  };
}

function normalizeAssignments(cases: OperationalCase[]): OperationalCase[] {
  return cases.map(enrichCase);
}

function isToday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

function elapsedHours(receivedAt: string, closedAt: string | null): number {
  const end = closedAt ? new Date(closedAt).getTime() : Date.now();
  return (end - new Date(receivedAt).getTime()) / 3600000;
}

export class CasesMockStore {
  cases: OperationalCase[] = seedWorkloadDemoCases(normalizeAssignments(clone(MOCK_CASES)));
  history: CaseHistoryEntry[] = clone(MOCK_CASE_HISTORY);
  rules = clone(INSURANCE_RULES);

  filterCases(params: Record<string, unknown> = {}, viewerId?: string) {
    let items = [...this.cases];
    const viewer = viewerId ? getDemoUserById(viewerId) : null;

    if (viewer && viewer.role !== 'admin') {
      items = items.filter((c) => c.assigned_to === viewer.id);
    } else if (params.assigned_to) {
      items = items.filter((c) => c.assigned_to === String(params.assigned_to));
    }
    if (params.status) {
      const filterStatus = String(params.status);
      const expanded = new Set<string>([filterStatus]);
      if (filterStatus in LEGACY_STATUS_MAP) {
        expanded.add(LEGACY_STATUS_MAP[filterStatus as keyof typeof LEGACY_STATUS_MAP]);
      }
      Object.entries(LEGACY_STATUS_MAP).forEach(([legacy, canonical]) => {
        if (canonical === filterStatus || legacy === filterStatus) {
          expanded.add(legacy);
          expanded.add(canonical);
        }
      });
      items = items.filter((c) => expanded.has(c.status) || expanded.has(normalizeCaseStatus(c.status)));
    }
    if (params.category) {
      items = items.filter((c) => c.category === params.category);
    }
    if (params.query) {
      const q = String(params.query).toLowerCase();
      items = items.filter(
        (c) =>
          c.subject?.toLowerCase().includes(q) ||
          c.sender.toLowerCase().includes(q) ||
          c.sender_name?.toLowerCase().includes(q) ||
          c.body?.toLowerCase().includes(q),
      );
    }

    const sortBy = String(params.sort_by || 'received_at');
    const sortOrder = String(params.sort_order || 'desc');
    items.sort((a, b) => {
      const aVal = (a as unknown as Record<string, unknown>)[sortBy];
      const bVal = (b as unknown as Record<string, unknown>)[sortBy];
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        const aDate = Date.parse(aVal);
        const bDate = Date.parse(bVal);
        const cmp = Number.isNaN(aDate) || Number.isNaN(bDate)
          ? aVal.localeCompare(bVal)
          : aDate - bDate;
        return sortOrder === 'asc' ? cmp : -cmp;
      }
      return 0;
    });

    const page = Math.max(1, Number(params.page) || 1);
    const size = Number(params.size) || 20;
    const total = items.length;
    const pages = Math.max(1, Math.ceil(total / size));
    const start = (page - 1) * size;

    return { items: items.slice(start, start + size), total, page, size, pages };
  }

  getCase(id: string) {
    return this.cases.find((c) => c.id === id) ?? null;
  }

  updateCase(id: string, data: Partial<OperationalCase>, performedBy: string) {
    const idx = this.cases.findIndex((c) => c.id === id);
    if (idx === -1) return null;

    const prev = this.cases[idx];
    const now = new Date().toISOString();
    const patch = { ...data };
    if (patch.status) patch.status = normalizeCaseStatus(patch.status) as CaseStatus;

    const updated = { ...prev, ...patch, updated_at: now };
    this.cases[idx] = updated;

    const performer = getDemoUserById(performedBy);
    const performerName = performer?.full_name || 'Sistema';

    if (patch.status && patch.status !== prev.status) {
      const from = CASE_STATUS_LABELS[normalizeCaseStatus(prev.status)];
      const to = CASE_STATUS_LABELS[patch.status as CaseStatus];
      this.addHistory(id, `Estado cambiado: ${from} → ${to}`, performedBy, performerName);
      if (patch.status === 'en_proceso' && !prev.started_at) {
        updated.started_at = now;
        this.addHistory(id, 'Inicio de gestión registrado', performedBy, performerName);
      }
    }
    if (patch.assigned_to && patch.assigned_to !== prev.assigned_to) {
      const newAnalyst = getDemoUserById(patch.assigned_to);
      const prevName = prev.assigned_name;
      updated.assigned_name = newAnalyst?.full_name || patch.assigned_to;
      updated.assigned_at = now;
      if (updated.status === 'nuevo') updated.status = 'asignado';
      this.addHistory(
        id,
        `Reasignado de ${prevName} a ${updated.assigned_name} (correo permanece en buzón original)`,
        performedBy,
        performerName,
      );
    }
    if (patch.observations !== undefined && patch.observations !== prev.observations) {
      const excerpt = (patch.observations || '').slice(0, 80);
      this.addHistory(
        id,
        excerpt ? `Observación: ${excerpt}${(patch.observations || '').length > 80 ? '…' : ''}` : 'Observaciones actualizadas',
        performedBy,
        performerName,
      );
    }

    if (patch.status === 'cerrado' && !prev.closed_at) {
      updated.closed_at = new Date().toISOString();
      updated.response_time = Math.round(elapsedHours(prev.received_at, updated.closed_at) * 10) / 10;
      this.addHistory(id, 'Caso cerrado', performedBy, performerName);
    }

    return updated;
  }

  addHistory(caseId: string, action: string, performedBy: string, performedByName: string) {
    const entry: CaseHistoryEntry = {
      id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      case_id: caseId,
      action,
      performed_by: performedBy,
      performed_by_name: performedByName,
      created_at: new Date().toISOString(),
    };
    this.history.unshift(entry);
    return entry;
  }

  getCaseHistory(caseId?: string, limit = 50, viewerId?: string) {
    let items = [...this.history];
    if (caseId) {
      items = items.filter((h) => h.case_id === caseId);
    } else if (viewerId) {
      const viewer = getDemoUserById(viewerId);
      if (viewer && viewer.role !== 'admin') {
        const myCaseIds = new Set(
          this.cases.filter((c) => c.assigned_to === viewer.id).map((c) => c.id),
        );
        items = items.filter((h) => myCaseIds.has(h.case_id));
      }
    }
    items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return { items: items.slice(0, limit), total: items.length };
  }

  getDashboardMetrics(viewerId?: string): DashboardMetrics {
    let cases = [...this.cases];
    const viewer = viewerId ? getDemoUserById(viewerId) : null;
    if (viewer && viewer.role !== 'admin') {
      cases = cases.filter((c) => c.assigned_to === viewer.id);
    }

    const closed = cases.filter((c) => isClosedStatus(c.status));
    const pending = cases.filter((c) => PENDING_STATUSES.includes(normalizeCaseStatus(c.status)));
    const blocked = cases.filter((c) => normalizeCaseStatus(c.status) === 'bloqueado');
    const critical = cases.filter((c) => c.priority === 'urgente' || normalizeCaseStatus(c.status) === 'bloqueado');
    const closedWithTime = closed.filter((c) => c.response_time != null);

    const by_category: Record<string, number> = {};
    for (const c of cases) {
      by_category[c.category] = (by_category[c.category] || 0) + 1;
    }

    const by_analyst: DashboardMetrics['by_analyst'] = {};
    for (const analyst of DEMO_USERS.filter((u) => u.role === 'analyst')) {
      const analystCases = this.cases.filter((c) => c.assigned_to === analyst.id);
      const analystClosed = analystCases.filter((c) => isClosedStatus(c.status));
      const activeCases = analystCases.filter((c) => !isClosedStatus(c.status));
      const times = analystClosed.filter((c) => c.response_time).map((c) => c.response_time!);
      by_analyst[analyst.full_name] = {
        active: activeCases.length,
        in_process: activeCases.filter((c) => normalizeCaseStatus(c.status) === 'en_proceso').length,
        pending: activeCases.filter((c) => PENDING_STATUSES.includes(normalizeCaseStatus(c.status))).length,
        blocked: activeCases.filter((c) => normalizeCaseStatus(c.status) === 'bloqueado').length,
        closed: analystClosed.length,
        avg_time: times.length ? times.reduce((a, b) => a + b, 0) / times.length : 0,
        accumulated_hours: Math.round(computeAccumulatedHours(activeCases) * 10) / 10,
      };
    }

    return {
      received_today: cases.filter((c) => isToday(c.received_at)).length,
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

  getPeriodMetrics(period: 'daily' | 'weekly' | 'monthly', viewerId?: string): PeriodMetrics {
    let cases = [...this.cases];
    const viewer = viewerId ? getDemoUserById(viewerId) : null;
    if (viewer && viewer.role !== 'admin') {
      cases = cases.filter((c) => c.assigned_to === viewer.id);
    }

    const now = Date.now();
    const ms =
      period === 'daily' ? 86400000 : period === 'weekly' ? 7 * 86400000 : 30 * 86400000;
    const inPeriod = cases.filter((c) => now - new Date(c.received_at).getTime() <= ms);

    const closed = inPeriod.filter((c) => isClosedStatus(c.status));
    const pending = inPeriod.filter((c) => !isClosedStatus(c.status));
    const backlogged = inPeriod.filter((c) => normalizeCaseStatus(c.status) === 'bloqueado');
    const times = closed.filter((c) => c.response_time).map((c) => c.response_time!);

    return {
      period,
      avg_response_time: times.length ? times.reduce((a, b) => a + b, 0) / times.length : 0,
      cases_attended: closed.length,
      cases_pending: pending.length,
      cases_backlogged: backlogged.length,
    };
  }

  getAnalystStats(viewerId?: string): AnalystStats[] {
    const viewer = viewerId ? getDemoUserById(viewerId) : null;
    let analysts = DEMO_USERS.filter((u) => u.role === 'analyst');

    if (viewer && viewer.role !== 'admin') {
      analysts = analysts.filter((a) => a.id === viewer.id);
    }

    const maxActive = Math.max(
      ...analysts.map((a) => this.cases.filter((c) => c.assigned_to === a.id && !isClosedStatus(c.status)).length),
      1,
    );

    return analysts.map((analyst) => {
      const analystCases = this.cases.filter((c) => c.assigned_to === analyst.id);
      const active = analystCases.filter((c) => !isClosedStatus(c.status));
      const closed = analystCases.filter((c) => isClosedStatus(c.status));
      const times = closed.filter((c) => c.response_time).map((c) => c.response_time!);

      return {
        id: analyst.id,
        name: analyst.full_name,
        email: analyst.email,
        active_cases: active.length,
        in_process_cases: active.filter((c) => normalizeCaseStatus(c.status) === 'en_proceso').length,
        pending_cases: active.filter((c) => PENDING_STATUSES.includes(normalizeCaseStatus(c.status))).length,
        blocked_cases: active.filter((c) => normalizeCaseStatus(c.status) === 'bloqueado').length,
        closed_cases: closed.length,
        avg_response_time: times.length ? times.reduce((a, b) => a + b, 0) / times.length : 0,
        accumulated_hours: Math.round(computeAccumulatedHours(active) * 10) / 10,
        workload: Math.round((active.length / maxActive) * 100),
      };
    });
  }

  private _ruleFieldValue(
    rule: { field: string },
    subject: string,
    body: string,
    sender: string,
    senderName?: string,
  ): string {
    switch (rule.field) {
      case 'subject': return subject;
      case 'body_plain': return body;
      case 'sender': return sender;
      case 'sender_name': return senderName || '';
      case 'domain': return sender.includes('@') ? sender.split('@')[1] : '';
      default: return body;
    }
  }

  private _matchRule(fieldValue: string, operator: string, ruleValue: string): boolean {
    const fv = fieldValue.toLowerCase();
    const rv = ruleValue.toLowerCase();
    switch (operator) {
      case 'contains': return fv.includes(rv);
      case 'not_contains': return !fv.includes(rv);
      case 'equals': return fv === rv;
      case 'starts_with': return fv.startsWith(rv);
      case 'ends_with': return fv.endsWith(rv);
      case 'regex':
        try { return new RegExp(ruleValue, 'i').test(fieldValue); } catch { return false; }
      default: return fv.includes(rv);
    }
  }

  classifyEmail(
    subject: string,
    body: string,
    sender = '',
    senderName?: string,
  ): { category: CaseCategory; assignedTo?: string; ruleName?: string } {
    for (const rule of this.rules.filter((r) => r.is_active)) {
      const fieldValue = this._ruleFieldValue(rule, subject, body, sender, senderName);
      if (this._matchRule(fieldValue, rule.operator, rule.value)) {
        return {
          category: (rule.category as CaseCategory) || 'sin_clasificar',
          assignedTo: rule.assigned_to || undefined,
          ruleName: rule.name,
        };
      }
    }
    const text = `${subject} ${body}`.toLowerCase();
    if (text.includes('cotiz')) return { category: 'cotizaciones' };
    if (text.includes('renov')) return { category: 'renovaciones' };
    if (text.includes('emisi')) return { category: 'emisiones' };
    if (text.includes('cartera')) return { category: 'cartera' };
    if (text.includes('licit')) return { category: 'licitaciones' };
    if (text.includes('colectiv')) return { category: 'colectivas' };
    return { category: 'sin_clasificar' };
  }

  simulateIncomingEmail(data: { sender: string; sender_name?: string; subject: string; body: string }) {
    const { category, assignedTo, ruleName } = this.classifyEmail(
      data.subject,
      data.body,
      data.sender,
      data.sender_name,
    );
    const analyst = assignedTo
      ? { id: assignedTo, name: getDemoUserById(assignedTo)?.full_name || assignedTo }
      : assignAnalystForCategory(category);
    const analysis = analyzeInsuranceEmail(data.sender, data.subject, data.body, category);
    const now = new Date().toISOString();
    const mailbox = ANALYST_MAILBOXES[analyst.id]?.email || `${analyst.id}@aseesta.com`;
    const newCase: OperationalCase = {
      id: `case-${Date.now()}`,
      sender: data.sender,
      sender_name: data.sender_name || null,
      subject: data.subject,
      body: data.body,
      received_at: now,
      assigned_at: now,
      started_at: null,
      source_mailbox: mailbox,
      assigned_to: analyst.id,
      assigned_name: analyst.name,
      status: 'nuevo',
      category,
      closed_at: null,
      response_time: null,
      observations: null,
      email_id: null,
      ai_summary: analysis.ai_summary,
      action_items: analysis.action_items,
      deadlines: analysis.deadlines,
      priority: analysis.priority,
      created_at: now,
      updated_at: now,
    };
    this.cases.unshift(newCase);
    this.addHistory(newCase.id, `Correo recibido en ${mailbox}`, 'system', 'Sistema');
    this.addHistory(newCase.id, 'Caso operativo creado automáticamente', 'system', 'Sistema');
    if (ruleName) {
      this.addHistory(newCase.id, `Clasificado por regla «${ruleName}» → ${category}`, 'system', 'Sistema');
    } else if (category !== 'sin_clasificar') {
      this.addHistory(newCase.id, `Clasificado como ${category} por regla automática`, 'system', 'Sistema');
    }
    this.addHistory(
      newCase.id,
      `Asignado a ${analyst.name}${assignedTo ? ' (regla personalizada)' : ` (especialista en ${category})`}`,
      'system',
      'Sistema',
    );
    this.addHistory(
      newCase.id,
      `Análisis generado: ${analysis.action_items.length} tarea(s) identificada(s)`,
      'system',
      'Sistema',
    );
    return newCase;
  }
}

export function resetCasesMockSeed(): void {
  casesMockStore.cases = seedWorkloadDemoCases(normalizeAssignments(clone(MOCK_CASES)));
  casesMockStore.history = clone(MOCK_CASE_HISTORY);
  casesMockStore.rules = clone(INSURANCE_RULES);
}

export const casesMockStore = new CasesMockStore();
