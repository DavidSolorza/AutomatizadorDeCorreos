import type { OperationalCase, CaseHistoryEntry } from '@/types/cases';
import type { Notification, GmailAccount } from '@/types';
import type { Rule } from '@/types';

const STORAGE_KEY = 'aseesta-demo-v1';

export interface DemoPersistedState {
  cases: OperationalCase[];
  history: CaseHistoryEntry[];
  rules?: Rule[];
  notifications?: Notification[];
  gmailAccounts?: GmailAccount[];
  usedEmailKeys?: string[];
  initializedAt?: string;
}

export function loadDemoState(): DemoPersistedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DemoPersistedState;
  } catch {
    return null;
  }
}

export function saveDemoState(state: DemoPersistedState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('[Demo] No se pudo persistir estado', e);
  }
}

export function clearDemoState(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function isDemoPersisted(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== null;
}
