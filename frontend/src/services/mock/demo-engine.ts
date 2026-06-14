import { ANALYST_MAILBOXES, ANALYST_IDS } from '@/config';
import { eventBus, Events } from '@/lib/event-bus';
import type { GmailAccount } from '@/types';
import { casesMockStore, resetCasesMockSeed } from './cases-store';
import { mockStore } from './store';
import { DEMO_INCOMING_EMAILS } from './demo-emails';
import {
  clearDemoState,
  loadDemoState,
  saveDemoState,
  type DemoPersistedState,
} from './demo-persistence';

/** Cuentas Gmail demo — un buzón por analista, todos conectados */
export function buildDemoGmailAccounts(): GmailAccount[] {
  const now = new Date().toISOString();
  return ANALYST_IDS.map((analystId) => ({
    id: `acc-${analystId}`,
    user_id: analystId,
    email: ANALYST_MAILBOXES[analystId].email,
    provider: 'gmail',
    is_connected: true,
    gmail_user_id: `gmail-demo-${analystId}`,
    last_sync_at: now,
    synced_on_connect: 12,
  }));
}

function addNotification(title: string, message: string, type = 'info') {
  const notif = {
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    email_id: '',
    user_id: 'admin',
    title,
    message,
    notification_type: type,
    is_read: false,
    created_at: new Date().toISOString(),
  };
  mockStore.notifications.unshift(notif);
  eventBus.emit(Events.NOTIFICATION_CREATED, notif);
}

let usedEmailKeys = new Set<string>();

export function persistDemoState(): void {
  const state: DemoPersistedState = {
    cases: casesMockStore.cases,
    history: casesMockStore.history,
    rules: casesMockStore.rules,
    notifications: mockStore.notifications,
    gmailAccounts: mockStore.gmailAccounts,
    usedEmailKeys: [...usedEmailKeys],
    initializedAt: loadDemoState()?.initializedAt || new Date().toISOString(),
  };
  saveDemoState(state);
}

export function resetDemoEngine(): void {
  clearDemoState();
  window.location.reload();
}

function pickDemoEmails(count: number, analystId?: string) {
  let pool = DEMO_INCOMING_EMAILS.filter((e) => !usedEmailKeys.has(e.key));
  if (analystId) {
    const forAnalyst = pool.filter((e) => e.mailboxAnalystId === analystId);
    if (forAnalyst.length >= count) pool = forAnalyst;
  }
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

export function processDemoIncomingEmail(
  template: (typeof DEMO_INCOMING_EMAILS)[number],
): ReturnType<typeof casesMockStore.simulateIncomingEmail> {
  const newCase = casesMockStore.simulateIncomingEmail({
    sender: template.sender,
    sender_name: template.sender_name,
    subject: template.subject,
    body: template.body,
  });

  usedEmailKeys.add(template.key);

  addNotification(
    'Correo capturado',
    `«${template.subject.slice(0, 50)}…» → Caso asignado a ${newCase.assigned_name}`,
    'info',
  );

  eventBus.emit(Events.EMAIL_CREATED, {
    id: newCase.id,
    subject: newCase.subject,
    assigned_to: newCase.assigned_to,
    assigned_name: newCase.assigned_name,
  });

  persistDemoState();
  return newCase;
}

/** Sincroniza un buzón demo: procesa 1–3 correos como si vinieran de Gmail/Outlook */
export function processDemoMailboxSync(accountId: string): {
  synced: number;
  message: string;
  accountEmail: string;
} {
  const account = mockStore.gmailAccounts.find((a) => a.id === accountId);
  if (!account) {
    return { synced: 0, message: 'Cuenta no encontrada', accountEmail: '' };
  }

  eventBus.emit(Events.SYNC_STARTED, { account_id: accountId });

  const analystId = ANALYST_IDS.find((id) => account.email === ANALYST_MAILBOXES[id].email);
  const batchSize = 1 + Math.floor(Math.random() * 2);
  const templates = pickDemoEmails(batchSize, analystId);

  if (templates.length === 0) {
    const resetKeys = DEMO_INCOMING_EMAILS.map((e) => e.key);
    resetKeys.forEach((k) => usedEmailKeys.delete(k));
    const retry = pickDemoEmails(batchSize, analystId);
    for (const t of retry) processDemoIncomingEmail(t);
    account.last_sync_at = new Date().toISOString();
    persistDemoState();
    eventBus.emit(Events.SYNC_COMPLETED, { synced: retry.length, account_id: accountId });
    return {
      synced: retry.length,
      message: `Demo: ${retry.length} correo(s) procesados desde ${account.email}`,
      accountEmail: account.email,
    };
  }

  for (const t of templates) {
    processDemoIncomingEmail(t);
  }

  account.last_sync_at = new Date().toISOString();
  account.is_connected = true;
  persistDemoState();

  eventBus.emit(Events.SYNC_COMPLETED, {
    synced: templates.length,
    account_id: accountId,
    email: account.email,
  });

  addNotification(
    'Sincronización completada',
    `${templates.length} correo(s) capturados desde ${account.email} y convertidos en casos`,
    'success',
  );

  return {
    synced: templates.length,
    message: `Demo: ${templates.length} correo(s) procesados desde ${account.email}`,
    accountEmail: account.email,
  };
}

/** Sincroniza todos los buzones demo */
export function processDemoFullSync(): number {
  let total = 0;
  for (const account of mockStore.gmailAccounts) {
    if (account.is_connected) {
      const r = processDemoMailboxSync(account.id);
      total += r.synced;
    }
  }
  return total;
}

export function connectAllDemoMailboxes(): GmailAccount[] {
  mockStore.gmailAccounts = buildDemoGmailAccounts();
  eventBus.emit(Events.GMAIL_CONNECTED, { accounts: mockStore.gmailAccounts });
  addNotification(
    'Buzones conectados (demo)',
    'Paula, Cristina y Marcela — captura activa sin mover correos de Outlook',
    'success',
  );
  persistDemoState();
  return mockStore.gmailAccounts;
}

function restoreFreshSeed() {
  resetCasesMockSeed();
  usedEmailKeys = new Set();
}

export function initDemoEngine(): void {
  const saved = loadDemoState();

  if (saved?.cases?.length) {
    casesMockStore.cases = saved.cases;
    casesMockStore.history = saved.history || [];
    if (saved.rules?.length) casesMockStore.rules = saved.rules;
    if (saved.notifications?.length) mockStore.notifications = saved.notifications;
    if (saved.gmailAccounts?.length) mockStore.gmailAccounts = saved.gmailAccounts;
    usedEmailKeys = new Set(saved.usedEmailKeys || []);
  } else {
    restoreFreshSeed();
    mockStore.gmailAccounts = buildDemoGmailAccounts();
    persistDemoState();
  }

  if (mockStore.gmailAccounts.length === 0) {
    mockStore.gmailAccounts = buildDemoGmailAccounts();
  }
}

export function simulateCustomEmail(data: {
  sender: string;
  sender_name?: string;
  subject: string;
  body: string;
}) {
  const newCase = casesMockStore.simulateIncomingEmail(data);
  addNotification(
    'Correo capturado',
    `«${data.subject.slice(0, 50)}…» → Caso asignado a ${newCase.assigned_name}`,
    'info',
  );
  eventBus.emit(Events.EMAIL_CREATED, {
    id: newCase.id,
    subject: newCase.subject,
    assigned_to: newCase.assigned_to,
    assigned_name: newCase.assigned_name,
  });
  persistDemoState();
  return newCase;
}

/** Simula N correos aleatorios del pool demo */
export function simulateRandomDemoEmails(count = 2): number {
  const templates = pickDemoEmails(count);
  for (const t of templates) processDemoIncomingEmail(t);
  return templates.length;
}

/** Simula actividad inicial al abrir la demo por primera vez en la sesión */
export function runDemoWelcomeSync(): void {
  const sessionKey = 'aseesta-demo-welcome-sync';
  if (sessionStorage.getItem(sessionKey)) return;
  sessionStorage.setItem(sessionKey, '1');

  setTimeout(() => {
    const account = mockStore.gmailAccounts.find((a) => a.id === 'acc-paula');
    if (account) {
      processDemoMailboxSync(account.id);
    }
  }, 2500);
}
