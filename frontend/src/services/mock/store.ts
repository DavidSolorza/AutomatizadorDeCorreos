import type { Email, Rule, Task, Notification, DailySummary } from '@/types';
import {
  MOCK_EMAILS,
  MOCK_TASKS,
  MOCK_RULES,
  MOCK_NOTIFICATIONS,
  MOCK_SUMMARIES,
  MOCK_GMAIL_ACCOUNTS,
  MOCK_ANALYZE,
  SEED_RULES,
} from './data';
import { MOCK_USER } from '@/config';

function clone<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

class MockStore {
  emails: Email[] = clone(MOCK_EMAILS);
  tasks: Task[] = clone(MOCK_TASKS);
  rules: Rule[] = clone(MOCK_RULES);
  notifications: Notification[] = clone(MOCK_NOTIFICATIONS);
  summaries: DailySummary[] = clone(MOCK_SUMMARIES);
  gmailAccounts = clone(MOCK_GMAIL_ACCOUNTS);
  user = clone(MOCK_USER);

  filterEmails(params: Record<string, unknown> = {}) {
    let items = [...this.emails];

    if (params.category) {
      items = items.filter((e) => e.category === params.category);
    }
    if (params.sender) {
      const s = String(params.sender).toLowerCase();
      items = items.filter(
        (e) =>
          e.sender.toLowerCase().includes(s) ||
          e.sender_name?.toLowerCase().includes(s),
      );
    }
    if (params.is_pinned === true || params.is_pinned === 'true') {
      items = items.filter((e) => e.is_pinned);
    }
    if (params.is_starred === true || params.is_starred === 'true') {
      items = items.filter((e) => e.is_starred);
    }
    if (params.is_archived === true || params.is_archived === 'true') {
      items = items.filter((e) => e.is_archived);
    }
    if (params.is_archived === false || params.is_archived === 'false') {
      items = items.filter((e) => !e.is_archived);
    }
    if (params.query) {
      const q = String(params.query).toLowerCase();
      items = items.filter(
        (e) =>
          e.subject?.toLowerCase().includes(q) ||
          e.sender.toLowerCase().includes(q) ||
          e.body_plain?.toLowerCase().includes(q),
      );
    }

    items.sort((a, b) => new Date(b.received_at).getTime() - new Date(a.received_at).getTime());

    const page = Number(params.page) || 1;
    const size = Number(params.size) || 20;
    const total = items.length;
    const pages = Math.max(1, Math.ceil(total / size));
    const start = (page - 1) * size;

    return { items: items.slice(start, start + size), total, page, size, pages };
  }

  filterTasks(params: Record<string, unknown> = {}) {
    let items = [...this.tasks];

    if (params.status) {
      items = items.filter((t) => t.status === params.status);
    }

    const page = Number(params.page) || 1;
    const size = Number(params.size) || 20;
    const total = items.length;
    const pages = Math.max(1, Math.ceil(total / size));
    const start = (page - 1) * size;

    return { items: items.slice(start, start + size), total, page, size, pages };
  }

  getEmail(id: string) {
    return this.emails.find((e) => e.id === id) ?? null;
  }

  updateEmail(id: string, data: Partial<Email>) {
    const idx = this.emails.findIndex((e) => e.id === id);
    if (idx === -1) return null;
    this.emails[idx] = { ...this.emails[idx], ...data };
    return this.emails[idx];
  }

  deleteEmail(id: string) {
    const idx = this.emails.findIndex((e) => e.id === id);
    if (idx === -1) return false;
    this.emails.splice(idx, 1);
    return true;
  }

  getEmailSummary(id: string) {
    const email = this.getEmail(id);
    if (!email) return null;

    const links: string[] = [];
    const text = `${email.body_plain || ''} ${email.body_html || ''}`;
    const urlRegex = /https?:\/\/[^\s]+/g;
    const found = text.match(urlRegex);
    if (found) links.push(...found);

    const importantWords: string[] = [];
    if (email.category === 'urgente') importantWords.push('URGENTE', 'parcial', 'examen');
    if (email.category === 'academicos') importantWords.push('tarea', 'entrega', 'proyecto');
    if (email.category === 'trabajo') importantWords.push('entrevista', 'empleo');

    const detectedDates: string[] = [];
    if (email.subject?.includes('mañana')) detectedDates.push('Mañana');
    if (email.body_plain?.includes('viernes')) detectedDates.push('Viernes');

    return {
      sender: email.sender,
      sender_name: email.sender_name,
      subject: email.subject,
      received_at: email.received_at,
      links,
      attachments: email.attachments || [],
      important_words: importantWords,
      detected_dates: detectedDates,
      is_urgent: email.category === 'urgente',
      priority: email.priority || 'medio',
    };
  }

  getAnalyze(id: string) {
    if (MOCK_ANALYZE[id]) return MOCK_ANALYZE[id];
    const email = this.getEmail(id);
    if (!email) return null;
    return {
      summary: `Correo de ${email.sender_name || email.sender} sobre "${email.subject}". Categoría: ${email.category || 'sin clasificar'}.`,
      action_items: ['Revisar el contenido del correo', 'Responder si es necesario'],
      deadlines: [],
      priority: email.priority || 'medio',
    };
  }

  detectTasks(emailId: string) {
    const email = this.getEmail(emailId);
    if (!email) return { detected: 0, tasks: [] };

    const existing = this.tasks.filter((t) => t.email_id === emailId);
    if (existing.length > 0) return { detected: 0, tasks: existing };

    const newTask: Task = {
      id: `task-auto-${Date.now()}`,
      email_id: emailId,
      user_id: MOCK_USER.id,
      title: `Tarea: ${email.subject?.slice(0, 50) || 'Sin asunto'}`,
      description: 'Detectada automáticamente del correo',
      due_date: null,
      status: 'pending',
      priority: email.priority || 'medio',
      source: 'email',
      tags: email.category || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.tasks.push(newTask);
    return { detected: 1, tasks: [newTask] };
  }

  seedRules() {
    const existingIds = new Set(this.rules.map((r) => r.id));
    const toAdd = SEED_RULES.filter((r) => !existingIds.has(r.id));
    this.rules.push(...toAdd);
    return { seeded: toAdd.length, total: this.rules.length };
  }
}

export const mockStore = new MockStore();
