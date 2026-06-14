import type { OperationalCase, CaseStatus, CaseCategory } from '@/types/cases';
import { ANALYST_MAILBOXES } from '@/config';
import { normalizeCaseStatus } from '@/config/case-statuses';
import { assignAnalystForCategory } from '@/config';

const TARGET_ACTIVE: Record<string, number> = {
  paula: 45,
  cristina: 12,
  marcela: 18,
};

const ACTIVE_STATUSES: CaseStatus[] = [
  'nuevo',
  'asignado',
  'en_proceso',
  'pendiente_cliente',
  'pendiente_documentacion',
  'en_revision_bogota',
  'requiere_autorizacion',
  'bloqueado',
];

const SUBJECTS: Record<CaseCategory, string[]> = {
  cotizaciones: ['Cotización póliza empresarial', 'Solicitud cotización flota'],
  renovaciones: ['Renovación póliza colectiva', 'Propuesta renovación anual'],
  emisiones: ['Emisión póliza automóviles', 'Solicitud emisión certificado'],
  cartera: ['Alerta cartera vencimientos', 'Gestión cobro cartera'],
  licitaciones: ['Licitación seguros patrimoniales', 'Invitación proceso licitatorio'],
  colectivas: ['Colectiva automóviles 120 unidades', 'Renovación colectiva vida'],
  sin_clasificar: ['Consulta seguros empresariales'],
};

function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 3600000).toISOString();
}

function makeSyntheticCase(
  id: string,
  analystId: string,
  analystName: string,
  category: CaseCategory,
  status: CaseStatus,
  hoursBack: number,
): OperationalCase {
  const received = hoursAgo(hoursBack);
  const mailbox = ANALYST_MAILBOXES[analystId]?.email || `${analystId}@aseesta.com`;
  const subjects = SUBJECTS[category];
  const subject = subjects[parseInt(id.slice(-2), 10) % subjects.length];

  return {
    id,
    sender: `cliente${id.slice(-3)}@empresa.com`,
    sender_name: `Cliente ${id.slice(-3)}`,
    subject,
    body: `Correo capturado desde ${mailbox}. Gestión operativa trazada en plataforma.`,
    received_at: received,
    assigned_at: received,
    started_at: ['en_proceso', 'pendiente_cliente', 'pendiente_documentacion', 'bloqueado'].includes(status)
      ? hoursAgo(hoursBack - 2)
      : null,
    assigned_to: analystId,
    assigned_name: analystName,
    source_mailbox: mailbox,
    status,
    category,
    closed_at: null,
    response_time: null,
    observations: null,
    email_id: null,
    ai_summary: `Caso operativo de ${category.replace('_', ' ')} capturado desde buzón ${mailbox}.`,
    action_items: ['Revisar correo en Outlook', 'Actualizar estado en plataforma'],
    deadlines: [],
    priority: status === 'bloqueado' ? 'urgente' : 'media',
    created_at: received,
    updated_at: received,
  };
}

/** Genera casos sintéticos para demostrar desequilibrio de carga operativa */
export function seedWorkloadDemoCases(existing: OperationalCase[]): OperationalCase[] {
  const result: OperationalCase[] = existing.map((c) => ({
    ...c,
    status: normalizeCaseStatus(c.status),
    assigned_at: c.assigned_at || c.received_at,
    source_mailbox:
      c.source_mailbox ||
      ANALYST_MAILBOXES[c.assigned_to]?.email ||
      `${c.assigned_to}@aseesta.com`,
  }));

  for (const [analystId, target] of Object.entries(TARGET_ACTIVE)) {
    const analyst = assignAnalystForCategory('cotizaciones');
    void analyst;
    const name =
      analystId === 'paula' ? 'Paula' : analystId === 'cristina' ? 'Cristina' : 'Marcela';
    const currentActive = result.filter(
      (c) => c.assigned_to === analystId && c.status !== 'cerrado',
    ).length;
    const needed = Math.max(0, target - currentActive);

    const categories: CaseCategory[] =
      analystId === 'paula'
        ? ['cotizaciones', 'cartera']
        : analystId === 'cristina'
          ? ['renovaciones', 'licitaciones']
          : ['emisiones', 'colectivas'];

    for (let i = 0; i < needed; i++) {
      const status = ACTIVE_STATUSES[i % ACTIVE_STATUSES.length];
      const category = categories[i % categories.length];
      result.push(
        makeSyntheticCase(
          `case-syn-${analystId}-${i}`,
          analystId,
          name,
          category,
          status,
          4 + i * 3,
        ),
      );
    }
  }

  return result;
}
