import type { InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { mockStore } from './store';
import { casesMockStore } from './cases-store';
import { INSURANCE_RULES } from './cases-data';
import { DEFAULT_DEMO_USER, DEMO_USERS, getDemoUserById, MOCK_USER } from '@/config';
import {
  processDemoMailboxSync,
  processDemoFullSync,
  connectAllDemoMailboxes,
  simulateCustomEmail,
  persistDemoState,
} from './demo-engine';

function getViewerId(config: InternalAxiosRequestConfig): string {
  const header = config.headers?.['X-Demo-User-Id'] as string | undefined;
  return header || DEFAULT_DEMO_USER.id;
}

function mockResponse<T>(config: InternalAxiosRequestConfig, data: T, status = 200): AxiosResponse<T> {
  return {
    data,
    status,
    statusText: 'OK',
    headers: {},
    config,
    request: {},
  };
}

function parseUrl(url: string): { path: string; params: Record<string, string> } {
  const [pathPart, queryPart] = url.split('?');
  const path = pathPart.replace(/^\//, '');
  const params: Record<string, string> = {};
  if (queryPart) {
    for (const pair of queryPart.split('&')) {
      const [k, v] = pair.split('=');
      if (k) params[decodeURIComponent(k)] = decodeURIComponent(v || '');
    }
  }
  return { path, params };
}

export function handleMockRequest(config: InternalAxiosRequestConfig): Promise<AxiosResponse> {
  const method = (config.method || 'get').toLowerCase();
  const url = config.url || '';
  const { path, params: urlParams } = parseUrl(url);
  const queryParams = { ...urlParams, ...(config.params as Record<string, unknown> || {}) };
  const body = config.data ? (typeof config.data === 'string' ? JSON.parse(config.data) : config.data) : {};

  // Emails
  if (path === 'emails' && method === 'get') {
    return Promise.resolve(mockResponse(config, mockStore.filterEmails(queryParams)));
  }
  if (path.match(/^emails\/([^/]+)$/) && method === 'get') {
    const id = path.split('/')[1];
    const email = mockStore.getEmail(id);
    if (!email) return Promise.reject({ response: { status: 404, data: { detail: 'Not found' } } });
    return Promise.resolve(mockResponse(config, email));
  }
  if (path.match(/^emails\/([^/]+)$/) && method === 'patch') {
    const id = path.split('/')[1];
    const updated = mockStore.updateEmail(id, body);
    if (!updated) return Promise.reject({ response: { status: 404 } });
    return Promise.resolve(mockResponse(config, updated));
  }
  if (path.match(/^emails\/([^/]+)$/) && method === 'delete') {
    const id = path.split('/')[1];
    mockStore.deleteEmail(id);
    return Promise.resolve(mockResponse(config, { ok: true }));
  }
  if (path.match(/^emails\/([^/]+)\/analyze$/) && method === 'post') {
    const id = path.split('/')[1];
    const result = mockStore.getAnalyze(id);
    return Promise.resolve(mockResponse(config, result));
  }
  if (path.match(/^emails\/([^/]+)\/summary$/) && method === 'get') {
    const id = path.split('/')[1];
    return Promise.resolve(mockResponse(config, mockStore.getEmailSummary(id)));
  }
  if (path.match(/^emails\/([^/]+)\/archive$/) && method === 'post') {
    const id = path.split('/')[1];
    const updated = mockStore.updateEmail(id, { is_archived: true });
    return Promise.resolve(mockResponse(config, updated));
  }
  if (path.match(/^emails\/([^/]+)\/pin$/) && method === 'post') {
    const id = path.split('/')[1];
    const updated = mockStore.updateEmail(id, { is_pinned: true });
    return Promise.resolve(mockResponse(config, updated));
  }
  if (path.match(/^emails\/([^/]+)\/unpin$/) && method === 'post') {
    const id = path.split('/')[1];
    const updated = mockStore.updateEmail(id, { is_pinned: false });
    return Promise.resolve(mockResponse(config, updated));
  }
  if (path === 'emails/bulk/archive' && method === 'post') {
    let count = 0;
    for (const e of mockStore.emails) {
      if (e.is_read && !e.is_archived) {
        e.is_archived = true;
        count++;
      }
    }
    return Promise.resolve(mockResponse(config, { archived: count }));
  }
  if (path === 'emails/bulk/no-deseados' && method === 'delete') {
    const before = mockStore.emails.length;
    mockStore.emails = mockStore.emails.filter((e) => e.category !== 'no_deseado');
    return Promise.resolve(mockResponse(config, { deleted: before - mockStore.emails.length }));
  }

  // Tasks
  if (path === 'tasks' && method === 'get') {
    return Promise.resolve(mockResponse(config, mockStore.filterTasks(queryParams)));
  }
  if (path === 'tasks' && method === 'post') {
    const task = { id: `task-${Date.now()}`, user_id: MOCK_USER.id, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), ...body };
    mockStore.tasks.push(task);
    return Promise.resolve(mockResponse(config, task));
  }
  if (path.match(/^tasks\/([^/]+)$/) && method === 'get') {
    const id = path.split('/')[1];
    const task = mockStore.tasks.find((t) => t.id === id);
    return Promise.resolve(mockResponse(config, task));
  }
  if (path.match(/^tasks\/([^/]+)$/) && method === 'patch') {
    const id = path.split('/')[1];
    const idx = mockStore.tasks.findIndex((t) => t.id === id);
    if (idx !== -1) {
      mockStore.tasks[idx] = { ...mockStore.tasks[idx], ...body, updated_at: new Date().toISOString() };
      return Promise.resolve(mockResponse(config, mockStore.tasks[idx]));
    }
    return Promise.reject({ response: { status: 404 } });
  }
  if (path.match(/^tasks\/([^/]+)$/) && method === 'delete') {
    const id = path.split('/')[1];
    mockStore.tasks = mockStore.tasks.filter((t) => t.id !== id);
    return Promise.resolve(mockResponse(config, { ok: true }));
  }
  if (path.match(/^tasks\/detect\/([^/]+)$/) && method === 'post') {
    const emailId = path.split('/')[2];
    return Promise.resolve(mockResponse(config, mockStore.detectTasks(emailId)));
  }

  // Rules (insurance classification)
  if (path === 'rules' && method === 'get') {
    return Promise.resolve(mockResponse(config, casesMockStore.rules));
  }
  if (path === 'rules' && method === 'post') {
    const rule = { id: `rule-${Date.now()}`, user_id: 'admin', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), ...body };
    casesMockStore.rules.push(rule);
    return Promise.resolve(mockResponse(config, rule));
  }
  if (path === 'rules/seed' && method === 'post') {
    if (casesMockStore.rules.length === 0) {
      casesMockStore.rules = JSON.parse(JSON.stringify(INSURANCE_RULES));
    }
    return Promise.resolve(mockResponse(config, casesMockStore.rules));
  }
  if (path.match(/^rules\/([^/]+)$/) && method === 'get') {
    const id = path.split('/')[1];
    return Promise.resolve(mockResponse(config, casesMockStore.rules.find((r) => r.id === id)));
  }
  if (path.match(/^rules\/([^/]+)$/) && method === 'put') {
    const id = path.split('/')[1];
    const idx = casesMockStore.rules.findIndex((r) => r.id === id);
    if (idx !== -1) {
      casesMockStore.rules[idx] = { ...casesMockStore.rules[idx], ...body, updated_at: new Date().toISOString() };
      return Promise.resolve(mockResponse(config, casesMockStore.rules[idx]));
    }
    return Promise.reject({ response: { status: 404 } });
  }
  if (path.match(/^rules\/([^/]+)$/) && method === 'delete') {
    const id = path.split('/')[1];
    casesMockStore.rules = casesMockStore.rules.filter((r) => r.id !== id);
    return Promise.resolve(mockResponse(config, { ok: true }));
  }

  // Notifications
  if (path === 'notifications' && method === 'get') {
    const unread = mockStore.notifications.filter((n) => !n.is_read).length;
    return Promise.resolve(mockResponse(config, { items: mockStore.notifications, unread_count: unread }));
  }
  if (path.match(/^notifications\/([^/]+)\/read$/) && method === 'patch') {
    const id = path.split('/')[1];
    const n = mockStore.notifications.find((x) => x.id === id);
    if (n) n.is_read = true;
    return Promise.resolve(mockResponse(config, n));
  }
  if (path === 'notifications/read-all' && method === 'patch') {
    mockStore.notifications.forEach((n) => { n.is_read = true; });
    return Promise.resolve(mockResponse(config, { ok: true }));
  }

  // Summaries
  if (path === 'summaries' && method === 'get') {
    const limit = Number(queryParams.limit) || 30;
    return Promise.resolve(mockResponse(config, mockStore.summaries.slice(0, limit)));
  }
  if (path === 'summaries/daily' && method === 'post') {
    const summary = mockStore.summaries[0];
    return Promise.resolve(mockResponse(config, summary));
  }
  if (path.match(/^summaries\/([^/]+)\/read$/) && method === 'patch') {
    const id = path.split('/')[1];
    const s = mockStore.summaries.find((x) => x.id === id);
    if (s) s.is_read = true;
    return Promise.resolve(mockResponse(config, s));
  }

  // Gmail
  if (path === 'gmail/accounts' && method === 'get') {
    return Promise.resolve(mockResponse(config, mockStore.gmailAccounts));
  }
  if (path === 'gmail/auth/url' && method === 'get') {
    return Promise.resolve(mockResponse(config, { auth_url: '#' }));
  }
  if (path === 'gmail/demo/connect' && method === 'post') {
    const accounts = connectAllDemoMailboxes();
    return Promise.resolve(mockResponse(config, { accounts, message: 'Buzones demo conectados' }));
  }
  if (path === 'gmail/demo/sync-all' && method === 'post') {
    const synced = processDemoFullSync();
    return Promise.resolve(mockResponse(config, { synced, message: `Demo: ${synced} correo(s) procesados en todos los buzones` }));
  }
  if (path.match(/^gmail\/accounts\/([^/]+)\/sync$/) && method === 'post') {
    const accountId = path.split('/')[2];
    const result = processDemoMailboxSync(accountId);
    return Promise.resolve(mockResponse(config, { synced: result.synced, message: result.message }));
  }

  // Cases — rutas específicas ANTES de cases/:id
  if (path === 'cases/history' && method === 'get') {
    const caseId = queryParams.case_id as string | undefined;
    const limit = Number(queryParams.limit) || 50;
    const viewerId = getViewerId(config);
    return Promise.resolve(mockResponse(config, casesMockStore.getCaseHistory(caseId, limit, viewerId)));
  }
  if (path === 'cases/metrics/dashboard' && method === 'get') {
    const viewerId = getViewerId(config);
    return Promise.resolve(mockResponse(config, casesMockStore.getDashboardMetrics(viewerId)));
  }
  if (path.match(/^cases\/metrics\/(daily|weekly|monthly)$/) && method === 'get') {
    const period = path.split('/')[2] as 'daily' | 'weekly' | 'monthly';
    const viewerId = getViewerId(config);
    return Promise.resolve(mockResponse(config, casesMockStore.getPeriodMetrics(period, viewerId)));
  }
  if (path === 'cases/analysts' && method === 'get') {
    const viewerId = getViewerId(config);
    return Promise.resolve(mockResponse(config, casesMockStore.getAnalystStats(viewerId)));
  }
  if (path === 'cases/simulate' && method === 'post') {
    const newCase = simulateCustomEmail(body);
    return Promise.resolve(mockResponse(config, newCase, 201));
  }
  if (path === 'cases' && method === 'get') {
    const viewerId = getViewerId(config);
    return Promise.resolve(mockResponse(config, casesMockStore.filterCases(queryParams, viewerId)));
  }
  if (path.match(/^cases\/([^/]+)$/) && method === 'get') {
    const id = path.split('/')[1];
    const caseItem = casesMockStore.getCase(id);
    if (!caseItem) return Promise.reject({ response: { status: 404, data: { detail: 'Caso no encontrado' } } });
    return Promise.resolve(mockResponse(config, caseItem));
  }
  if (path.match(/^cases\/([^/]+)$/) && method === 'patch') {
    const id = path.split('/')[1];
    const viewerId = getViewerId(config);
    const updated = casesMockStore.updateCase(id, body, viewerId);
    if (!updated) return Promise.reject({ response: { status: 404 } });
    persistDemoState();
    return Promise.resolve(mockResponse(config, updated));
  }

  // Users
  if (path === 'users/me' && method === 'get') {
    const viewerId = getViewerId(config);
    const user = getDemoUserById(viewerId) || DEFAULT_DEMO_USER;
    return Promise.resolve(mockResponse(config, user));
  }
  if (path === 'users/me' && method === 'put') {
    return Promise.resolve(mockResponse(config, getDemoUserById(getViewerId(config)) || DEFAULT_DEMO_USER));
  }
  if (path === 'users/me' && method === 'delete') {
    return Promise.resolve(mockResponse(config, { ok: true }));
  }

  // Auth
  if (path === 'auth/me' && method === 'get') {
    const viewerId = getViewerId(config);
    return Promise.resolve(mockResponse(config, getDemoUserById(viewerId) || DEFAULT_DEMO_USER));
  }

  console.warn(`[Mock API] Unhandled: ${method.toUpperCase()} ${path}`);
  return Promise.resolve(mockResponse(config, {}));
}
