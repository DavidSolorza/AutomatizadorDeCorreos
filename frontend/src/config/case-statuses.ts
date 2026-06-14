/**
 * Estados operativos configurables.
 * Fuente única de verdad — extensible en futuras versiones.
 */

export const CASE_STATUS_DEFINITIONS = [
  { id: 'nuevo', label: 'Nuevo', description: 'Correo capturado, caso creado' },
  { id: 'asignado', label: 'Asignado', description: 'Responsable definido' },
  { id: 'en_proceso', label: 'En Proceso', description: 'Gestión activa en curso' },
  { id: 'pendiente_cliente', label: 'Pendiente Cliente', description: 'Esperando respuesta del cliente' },
  { id: 'pendiente_documentacion', label: 'Pendiente Documentación', description: 'Faltan documentos' },
  { id: 'en_revision_bogota', label: 'En Revisión Bogotá', description: 'Escalado a sede central' },
  { id: 'requiere_autorizacion', label: 'Requiere Autorización', description: 'Pendiente aprobación interna' },
  { id: 'bloqueado', label: 'Bloqueado', description: 'Caso represado o detenido' },
  { id: 'cerrado', label: 'Cerrado', description: 'Caso finalizado' },
] as const;

export type CaseStatus = (typeof CASE_STATUS_DEFINITIONS)[number]['id'];

/** Compatibilidad con estados anteriores del demo */
export const LEGACY_STATUS_MAP: Record<string, CaseStatus> = {
  recibido: 'nuevo',
  pendiente: 'pendiente_cliente',
  represado: 'bloqueado',
};

export function normalizeCaseStatus(status: string): CaseStatus {
  if (CASE_STATUS_DEFINITIONS.some((s) => s.id === status)) {
    return status as CaseStatus;
  }
  return LEGACY_STATUS_MAP[status] || 'nuevo';
}

export const CASE_STATUS_LABELS: Record<CaseStatus, string> = Object.fromEntries(
  CASE_STATUS_DEFINITIONS.map((s) => [s.id, s.label]),
) as Record<CaseStatus, string>;

export const STATUS_COLORS: Record<CaseStatus, string> = {
  nuevo: 'bg-info/10 text-[#1d4ed8] border-info/20',
  asignado: 'bg-primary/10 text-[#1d4ed8] border-primary/20',
  en_proceso: 'bg-primary/10 text-primary border-primary/20',
  pendiente_cliente: 'bg-warning/10 text-[#b45309] border-warning/20',
  pendiente_documentacion: 'bg-warning/10 text-[#b45309] border-warning/20',
  en_revision_bogota: 'bg-warning/10 text-[#b45309] border-warning/20',
  requiere_autorizacion: 'bg-warning/10 text-[#b45309] border-warning/20',
  bloqueado: 'bg-error/10 text-[#b91c1c] border-error/20',
  cerrado: 'bg-success/10 text-[#047857] border-success/20',
};

export const STATUS_BADGE_VARIANT: Record<CaseStatus, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
  nuevo: 'info',
  asignado: 'info',
  en_proceso: 'info',
  pendiente_cliente: 'warning',
  pendiente_documentacion: 'warning',
  en_revision_bogota: 'warning',
  requiere_autorizacion: 'warning',
  bloqueado: 'error',
  cerrado: 'success',
};

export function getStatusBadgeVariant(status: string): 'success' | 'warning' | 'error' | 'info' | 'default' {
  return STATUS_BADGE_VARIANT[normalizeCaseStatus(status)] || 'default';
}

export const CLOSED_STATUSES: CaseStatus[] = ['cerrado'];

export const PENDING_STATUSES: CaseStatus[] = [
  'pendiente_cliente',
  'pendiente_documentacion',
  'en_revision_bogota',
  'requiere_autorizacion',
];

export const ACTIVE_STATUSES: CaseStatus[] = CASE_STATUS_DEFINITIONS
  .map((s) => s.id)
  .filter((id) => id !== 'cerrado');

export function isClosedStatus(status: string): boolean {
  return normalizeCaseStatus(status) === 'cerrado';
}

export function getStatusColor(status: string): string {
  return STATUS_COLORS[normalizeCaseStatus(status)] || STATUS_COLORS.nuevo;
}

/** Columnas Kanban agrupadas — el correo sigue en Outlook, aquí solo trazamos el caso */
export const KANBAN_COLUMNS: {
  key: string;
  label: string;
  description: string;
  defaultStatus: CaseStatus;
  statuses: CaseStatus[];
  headerBg: string;
  headerText: string;
  dotColor: string;
  dropBg: string;
}[] = [
  {
    key: 'entrada',
    label: 'Entrada',
    description: 'Nuevo y asignado',
    defaultStatus: 'nuevo',
    statuses: ['nuevo', 'asignado'],
    headerBg: 'bg-bg-tertiary',
    headerText: 'text-text-primary',
    dotColor: 'bg-text-secondary',
    dropBg: 'bg-bg-primary',
  },
  {
    key: 'gestion',
    label: 'En Gestión',
    description: 'Trabajo activo',
    defaultStatus: 'en_proceso',
    statuses: ['en_proceso'],
    headerBg: 'bg-primary/8',
    headerText: 'text-primary',
    dotColor: 'bg-primary',
    dropBg: 'bg-primary/5',
  },
  {
    key: 'pendientes',
    label: 'Pendientes',
    description: 'Cliente, docs, Bogotá, autorización',
    defaultStatus: 'pendiente_cliente',
    statuses: ['pendiente_cliente', 'pendiente_documentacion', 'en_revision_bogota', 'requiere_autorizacion'],
    headerBg: 'bg-warning/10',
    headerText: 'text-[#b45309]',
    dotColor: 'bg-warning',
    dropBg: 'bg-warning/5',
  },
  {
    key: 'bloqueado',
    label: 'Bloqueado',
    description: 'Represado / escalado',
    defaultStatus: 'bloqueado',
    statuses: ['bloqueado'],
    headerBg: 'bg-error/10',
    headerText: 'text-[#b91c1c]',
    dotColor: 'bg-error',
    dropBg: 'bg-error/5',
  },
  {
    key: 'cerrado',
    label: 'Cerrado',
    description: 'Caso finalizado',
    defaultStatus: 'cerrado',
    statuses: ['cerrado'],
    headerBg: 'bg-success/10',
    headerText: 'text-[#047857]',
    dotColor: 'bg-success',
    dropBg: 'bg-success/5',
  },
];

export function kanbanColumnForStatus(status: string) {
  const normalized = normalizeCaseStatus(status);
  return KANBAN_COLUMNS.find((col) => col.statuses.includes(normalized));
}
