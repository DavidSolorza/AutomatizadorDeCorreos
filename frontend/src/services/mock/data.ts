import type { Email, Rule, Task, Notification, DailySummary, GmailAccount } from '@/types';
import { MOCK_USER } from '@/config';

const ACCOUNT_ID = 'acc-demo';
const now = new Date();

function daysAgo(n: number, hour = 10): string {
  const d = new Date(now);
  d.setDate(d.getDate() - n);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

function daysFromNow(n: number): string {
  const d = new Date(now);
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

export const MOCK_GMAIL_ACCOUNTS: GmailAccount[] = [
  {
    id: ACCOUNT_ID,
    user_id: MOCK_USER.id,
    email: 'estudiante@ucaldas.edu.co',
    provider: 'gmail',
    is_connected: true,
    gmail_user_id: 'gmail-demo-001',
    last_sync_at: daysAgo(0, 8),
    synced_on_connect: 18,
  },
];

export const MOCK_EMAILS: Email[] = [
  {
    id: 'email-01',
    account_id: ACCOUNT_ID,
    gmail_message_id: 'msg-001',
    thread_id: 'thread-01',
    sender: 'prof.calculo@ucaldas.edu.co',
    sender_name: 'Dr. Carlos Mendoza',
    recipient: MOCK_USER.email,
    subject: 'URGENTE: Parcial de Cálculo Diferencial — mañana 8:00 AM',
    body_plain: `Estimados estudiantes,

Les recuerdo que el parcial de Cálculo Diferencial se realizará MAÑANA jueves a las 8:00 AM en el salón 301 del bloque B.

Temas: Límites, derivadas y regla de la cadena.

Traer calculadora no programable y carné estudiantil.

Link de repaso: https://meet.google.com/abc-defg-hij

Saludos,
Dr. Carlos Mendoza
Departamento de Matemáticas`,
    body_html: null,
    received_at: daysAgo(0, 7),
    is_read: false,
    is_starred: true,
    is_archived: false,
    is_pinned: true,
    category: 'urgente',
    urgency_score: 0.95,
    priority: 'urgente',
    created_at: daysAgo(0, 7),
    attachments: [
      { id: 'att-01', email_id: 'email-01', filename: 'Guia_Parcial_Calculo.pdf', mime_type: 'application/pdf', size_bytes: 245760 },
    ],
  },
  {
    id: 'email-02',
    account_id: ACCOUNT_ID,
    gmail_message_id: 'msg-002',
    thread_id: 'thread-02',
    sender: 'registro@ucaldas.edu.co',
    sender_name: 'Registro Académico U. Caldas',
    recipient: MOCK_USER.email,
    subject: 'Confirmación de matrícula semestre 2026-1',
    body_plain: `Apreciada María García,

Su matrícula para el semestre 2026-1 ha sido confirmada exitosamente.

Cursos inscritos: 5
Créditos totales: 16

Puede consultar su horario en el portal estudiantil.

Atentamente,
Registro Académico`,
    body_html: null,
    received_at: daysAgo(1, 9),
    is_read: true,
    is_starred: false,
    is_archived: false,
    is_pinned: false,
    category: 'universidad',
    urgency_score: 0.3,
    priority: 'medio',
    created_at: daysAgo(1, 9),
  },
  {
    id: 'email-03',
    account_id: ACCOUNT_ID,
    gmail_message_id: 'msg-003',
    thread_id: 'thread-03',
    sender: 'biblioteca@ucaldas.edu.co',
    sender_name: 'Biblioteca Central',
    recipient: MOCK_USER.email,
    subject: 'Préstamo vence en 3 días — "Estructuras de Datos"',
    body_plain: `Hola María,

El libro "Estructuras de Datos en Python" vence el ${daysFromNow(3)}.

Renueva en línea o devuélvelo en mostrador principal.

Código: BIB-2026-4521`,
    body_html: null,
    received_at: daysAgo(2, 14),
    is_read: false,
    is_starred: false,
    is_archived: false,
    is_pinned: false,
    category: 'academicos',
    urgency_score: 0.6,
    priority: 'alto',
    created_at: daysAgo(2, 14),
  },
  {
    id: 'email-04',
    account_id: ACCOUNT_ID,
    gmail_message_id: 'msg-004',
    thread_id: 'thread-04',
    sender: 'rrhh@techstartup.co',
    sender_name: 'Laura Pérez — TechStartup',
    recipient: MOCK_USER.email,
    subject: 'Invitación a entrevista — Practicante de Desarrollo',
    body_plain: `Hola María,

Nos gustó tu perfil. ¿Podrías asistir a una entrevista el ${daysFromNow(5)} a las 3:00 PM?

Modalidad: presencial, oficina Cra 23 #45-67.

Confirma tu asistencia respondiendo este correo.

Saludos,
Laura Pérez
RRHH TechStartup`,
    body_html: null,
    received_at: daysAgo(1, 11),
    is_read: false,
    is_starred: true,
    is_archived: false,
    is_pinned: false,
    category: 'trabajo',
    urgency_score: 0.7,
    priority: 'alto',
    created_at: daysAgo(1, 11),
  },
  {
    id: 'email-05',
    account_id: ACCOUNT_ID,
    gmail_message_id: 'msg-005',
    thread_id: 'thread-05',
    sender: 'pagos@bancolombia.com.co',
    sender_name: 'Bancolombia',
    recipient: MOCK_USER.email,
    subject: 'Pago de matrícula procesado — $2.450.000 COP',
    body_plain: `Estimado cliente,

Confirmamos el pago de $2.450.000 COP por concepto de matrícula universitaria.

Referencia: PAY-2026-88421
Fecha: ${daysAgo(3).split('T')[0]}

Este es un comprobante automático.`,
    body_html: null,
    received_at: daysAgo(3, 16),
    is_read: true,
    is_starred: false,
    is_archived: false,
    is_pinned: false,
    category: 'pagos',
    urgency_score: 0.2,
    priority: 'bajo',
    created_at: daysAgo(3, 16),
  },
  {
    id: 'email-06',
    account_id: ACCOUNT_ID,
    gmail_message_id: 'msg-006',
    thread_id: 'thread-06',
    sender: 'proyecto@ucaldas.edu.co',
    sender_name: 'Ing. Ana Ruiz',
    recipient: MOCK_USER.email,
    subject: 'Reunión de proyecto — Viernes 2:00 PM (Google Meet)',
    body_plain: `Equipo,

Reunión de seguimiento del proyecto de Ingeniería de Software.

Fecha: Viernes ${daysFromNow(2)}
Hora: 2:00 PM
Link: https://meet.google.com/xyz-abcd-efg

Agenda:
1. Avance del sprint 3
2. Revisión de PRs pendientes
3. Planificación sprint 4

Ing. Ana Ruiz`,
    body_html: null,
    received_at: daysAgo(1, 15),
    is_read: true,
    is_starred: false,
    is_archived: false,
    is_pinned: false,
    category: 'reuniones',
    urgency_score: 0.5,
    priority: 'medio',
    created_at: daysAgo(1, 15),
  },
  {
    id: 'email-07',
    account_id: ACCOUNT_ID,
    gmail_message_id: 'msg-007',
    thread_id: 'thread-07',
    sender: 'mama.garcia@gmail.com',
    sender_name: 'Mamá 💕',
    recipient: MOCK_USER.email,
    subject: '¿Vienes el domingo a almorzar?',
    body_plain: `Hola mija,

Te extrañamos. ¿Puedes venir el domingo? Voy a hacer sancocho.

Abrazo,
Mamá`,
    body_html: null,
    received_at: daysAgo(0, 12),
    is_read: false,
    is_starred: false,
    is_archived: false,
    is_pinned: false,
    category: 'personal',
    urgency_score: 0.1,
    priority: 'bajo',
    created_at: daysAgo(0, 12),
  },
  {
    id: 'email-08',
    account_id: ACCOUNT_ID,
    gmail_message_id: 'msg-008',
    thread_id: 'thread-08',
    sender: 'noreply@spotify.com',
    sender_name: 'Spotify',
    recipient: MOCK_USER.email,
    subject: '🎵 50% OFF en Premium — ¡Solo hoy!',
    body_plain: `¡Oferta exclusiva!

Obtén 3 meses de Spotify Premium por solo $9.900/mes.

Haz clic aquí para activar tu descuento.

Cancela cuando quieras.`,
    body_html: null,
    received_at: daysAgo(0, 6),
    is_read: true,
    is_starred: false,
    is_archived: false,
    is_pinned: false,
    category: 'publicidad',
    urgency_score: 0.05,
    priority: 'bajo',
    created_at: daysAgo(0, 6),
  },
  {
    id: 'email-09',
    account_id: ACCOUNT_ID,
    gmail_message_id: 'msg-009',
    thread_id: 'thread-09',
    sender: 'spam@loteria-falsa.com',
    sender_name: 'Lotería Nacional',
    recipient: MOCK_USER.email,
    subject: '¡FELICIDADES! Ganaste $50.000.000 — Reclama ahora',
    body_plain: `Usted ha sido seleccionado como ganador del premio mayor.

Envíe sus datos bancarios para recibir el pago.

Este mensaje no requiere respuesta.`,
    body_html: null,
    received_at: daysAgo(0, 4),
    is_read: false,
    is_starred: false,
    is_archived: false,
    is_pinned: false,
    category: 'no_deseado',
    urgency_score: 0.01,
    priority: 'bajo',
    created_at: daysAgo(0, 4),
  },
  {
    id: 'email-10',
    account_id: ACCOUNT_ID,
    gmail_message_id: 'msg-010',
    thread_id: 'thread-10',
    sender: 'classroom@ucaldas.edu.co',
    sender_name: 'Google Classroom',
    recipient: MOCK_USER.email,
    subject: 'Nueva tarea: Entrega Proyecto Final — Base de Datos',
    body_plain: `Se ha publicado una nueva tarea en el curso Base de Datos II.

Título: Proyecto Final — Diseño ER y normalización
Fecha límite: ${daysFromNow(10)} 11:59 PM
Puntos: 30

Accede desde: https://classroom.google.com/c/abc123

Prof. Sandra López`,
    body_html: null,
    received_at: daysAgo(2, 8),
    is_read: false,
    is_starred: true,
    is_archived: false,
    is_pinned: true,
    category: 'academicos',
    urgency_score: 0.8,
    priority: 'alto',
    created_at: daysAgo(2, 8),
    attachments: [
      { id: 'att-02', email_id: 'email-10', filename: 'Rubrica_Proyecto_Final.pdf', mime_type: 'application/pdf', size_bytes: 89000 },
    ],
  },
  {
    id: 'email-11',
    account_id: ACCOUNT_ID,
    gmail_message_id: 'msg-011',
    thread_id: 'thread-11',
    sender: 'deportes@ucaldas.edu.co',
    sender_name: 'Bienestar Universitario',
    recipient: MOCK_USER.email,
    subject: 'Torneo interfacultades de fútbol — Inscripciones abiertas',
    body_plain: `¡Participa en el torneo interfacultades!

Inscripciones hasta el ${daysFromNow(7)}.
Categoría: femenina y mixta.

Más info en bienestar universitario, bloque C.`,
    body_html: null,
    received_at: daysAgo(4, 10),
    is_read: true,
    is_starred: false,
    is_archived: false,
    is_pinned: false,
    category: 'universidad',
    urgency_score: 0.2,
    priority: 'bajo',
    created_at: daysAgo(4, 10),
  },
  {
    id: 'email-12',
    account_id: ACCOUNT_ID,
    gmail_message_id: 'msg-012',
    thread_id: 'thread-12',
    sender: 'prof.calculo@ucaldas.edu.co',
    sender_name: 'Dr. Carlos Mendoza',
    recipient: MOCK_USER.email,
    subject: 'Material de clase — Integrales definidas',
    body_plain: `Adjunto las diapositivas de la clase de hoy sobre integrales definidas.

Repasar ejercicios 1-15 del capítulo 5.

Nos vemos el lunes.`,
    body_html: null,
    received_at: daysAgo(3, 11),
    is_read: true,
    is_starred: false,
    is_archived: false,
    is_pinned: false,
    category: 'academicos',
    urgency_score: 0.3,
    priority: 'medio',
    created_at: daysAgo(3, 11),
    attachments: [
      { id: 'att-03', email_id: 'email-12', filename: 'Clase_Integrales.pptx', mime_type: 'application/vnd.ms-powerpoint', size_bytes: 1200000 },
    ],
  },
  {
    id: 'email-13',
    account_id: ACCOUNT_ID,
    gmail_message_id: 'msg-013',
    thread_id: 'thread-13',
    sender: 'facturacion@netflix.com',
    sender_name: 'Netflix',
    recipient: MOCK_USER.email,
    subject: 'Tu factura de Netflix está lista',
    body_plain: `Hola María,

Tu plan Estándar se renovó por $18.900 COP.

Próximo cobro: ${daysFromNow(30)}.`,
    body_html: null,
    received_at: daysAgo(5, 9),
    is_read: true,
    is_starred: false,
    is_archived: true,
    is_pinned: false,
    category: 'pagos',
    urgency_score: 0.1,
    priority: 'bajo',
    created_at: daysAgo(5, 9),
  },
  {
    id: 'email-14',
    account_id: ACCOUNT_ID,
    gmail_message_id: 'msg-014',
    thread_id: 'thread-14',
    sender: 'promo@amazon.com',
    sender_name: 'Amazon',
    recipient: MOCK_USER.email,
    subject: 'Ofertas relámpago — Hasta 70% en tecnología',
    body_plain: `Las mejores ofertas del día en laptops, tablets y accesorios.

Solo por 24 horas. Envío gratis en pedidos +$100.000.`,
    body_html: null,
    received_at: daysAgo(1, 6),
    is_read: true,
    is_starred: false,
    is_archived: false,
    is_pinned: false,
    category: 'publicidad',
    urgency_score: 0.05,
    priority: 'bajo',
    created_at: daysAgo(1, 6),
  },
  {
    id: 'email-15',
    account_id: ACCOUNT_ID,
    gmail_message_id: 'msg-015',
    thread_id: 'thread-15',
    sender: 'soporte@ucaldas.edu.co',
    sender_name: 'TI Universidad de Caldas',
    recipient: MOCK_USER.email,
    subject: 'Mantenimiento programado — Portal estudiantil',
    body_plain: `Informamos que el portal estudiantil estará en mantenimiento el sábado de 10 PM a 2 AM.

Durante este periodo no podrá acceder a notas, horarios ni pagos en línea.`,
    body_html: null,
    received_at: daysAgo(2, 17),
    is_read: true,
    is_starred: false,
    is_archived: false,
    is_pinned: false,
    category: 'universidad',
    urgency_score: 0.4,
    priority: 'medio',
    created_at: daysAgo(2, 17),
  },
];

export const MOCK_TASKS: Task[] = [
  {
    id: 'task-01',
    email_id: 'email-01',
    user_id: MOCK_USER.id,
    title: 'Estudiar para parcial de Cálculo',
    description: 'Repasar límites, derivadas y regla de la cadena',
    due_date: daysFromNow(1),
    status: 'pending',
    priority: 'urgente',
    source: 'email',
    tags: 'calculo,parcial',
    created_at: daysAgo(0, 7),
    updated_at: daysAgo(0, 7),
  },
  {
    id: 'task-02',
    email_id: 'email-10',
    user_id: MOCK_USER.id,
    title: 'Entregar Proyecto Final BD',
    description: 'Diseño ER y normalización — 30 puntos',
    due_date: daysFromNow(10),
    status: 'in_progress',
    priority: 'alto',
    source: 'email',
    tags: 'bases-de-datos,proyecto',
    created_at: daysAgo(2, 8),
    updated_at: daysAgo(1, 10),
  },
  {
    id: 'task-03',
    email_id: 'email-03',
    user_id: MOCK_USER.id,
    title: 'Devolver libro de Biblioteca',
    description: 'Estructuras de Datos en Python — código BIB-2026-4521',
    due_date: daysFromNow(3),
    status: 'pending',
    priority: 'alto',
    source: 'email',
    tags: 'biblioteca',
    created_at: daysAgo(2, 14),
    updated_at: daysAgo(2, 14),
  },
  {
    id: 'task-04',
    email_id: 'email-04',
    user_id: MOCK_USER.id,
    title: 'Confirmar entrevista TechStartup',
    description: 'Practicante de Desarrollo — presencial',
    due_date: daysFromNow(5),
    status: 'pending',
    priority: 'alto',
    source: 'email',
    tags: 'trabajo,entrevista',
    created_at: daysAgo(1, 11),
    updated_at: daysAgo(1, 11),
  },
  {
    id: 'task-05',
    email_id: 'email-06',
    user_id: MOCK_USER.id,
    title: 'Preparar presentación sprint 3',
    description: 'Reunión de proyecto viernes 2 PM',
    due_date: daysFromNow(2),
    status: 'in_progress',
    priority: 'medio',
    source: 'email',
    tags: 'proyecto,reunion',
    created_at: daysAgo(1, 15),
    updated_at: daysAgo(0, 9),
  },
  {
    id: 'task-06',
    email_id: null,
    user_id: MOCK_USER.id,
    title: 'Comprar calculadora para parcial',
    description: 'Calculadora no programable',
    due_date: daysFromNow(0),
    status: 'done',
    priority: 'medio',
    source: 'manual',
    tags: 'compras',
    created_at: daysAgo(1, 18),
    updated_at: daysAgo(0, 10),
  },
];

export const MOCK_RULES: Rule[] = [
  {
    id: 'rule-01',
    user_id: MOCK_USER.id,
    name: 'Correos universitarios',
    description: 'Clasifica correos del dominio @ucaldas.edu.co',
    field: 'sender',
    operator: 'contains',
    value: '@ucaldas.edu.co',
    category: 'universidad',
    label: 'Universidad',
    is_active: true,
    priority: 'medio',
    created_at: daysAgo(30),
    updated_at: daysAgo(30),
  },
  {
    id: 'rule-02',
    user_id: MOCK_USER.id,
    name: 'Urgente — parcial/examen',
    description: 'Detecta palabras clave de urgencia académica',
    field: 'subject',
    operator: 'contains',
    value: 'URGENTE',
    category: 'urgente',
    label: 'Urgente',
    is_active: true,
    priority: 'urgente',
    created_at: daysAgo(30),
    updated_at: daysAgo(30),
  },
  {
    id: 'rule-03',
    user_id: MOCK_USER.id,
    name: 'Pagos y facturas',
    description: 'Correos de bancos y pagos',
    field: 'subject',
    operator: 'contains',
    value: 'pago',
    category: 'pagos',
    label: 'Pagos',
    is_active: true,
    priority: 'bajo',
    created_at: daysAgo(30),
    updated_at: daysAgo(30),
  },
  {
    id: 'rule-04',
    user_id: MOCK_USER.id,
    name: 'Spam / no deseado',
    description: 'Filtra correos de lotería y premios falsos',
    field: 'subject',
    operator: 'contains',
    value: 'ganaste',
    category: 'no_deseado',
    label: 'No deseado',
    is_active: true,
    priority: 'bajo',
    created_at: daysAgo(30),
    updated_at: daysAgo(30),
  },
  {
    id: 'rule-05',
    user_id: MOCK_USER.id,
    name: 'Google Classroom',
    description: 'Tareas y anuncios de Classroom',
    field: 'sender',
    operator: 'contains',
    value: 'classroom',
    category: 'academicos',
    label: 'Académicos',
    is_active: true,
    priority: 'alto',
    created_at: daysAgo(30),
    updated_at: daysAgo(30),
  },
];

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif-01',
    email_id: 'email-01',
    user_id: MOCK_USER.id,
    title: 'Correo urgente recibido',
    message: 'Parcial de Cálculo Diferencial — mañana 8:00 AM',
    notification_type: 'urgent_email',
    is_read: false,
    created_at: daysAgo(0, 7),
  },
  {
    id: 'notif-02',
    email_id: 'email-10',
    user_id: MOCK_USER.id,
    title: 'Nueva tarea académica',
    message: 'Proyecto Final Base de Datos — vence en 10 días',
    notification_type: 'task_deadline',
    is_read: false,
    created_at: daysAgo(2, 8),
  },
  {
    id: 'notif-03',
    email_id: 'email-04',
    user_id: MOCK_USER.id,
    title: 'Invitación laboral',
    message: 'Entrevista en TechStartup — confirma tu asistencia',
    notification_type: 'info',
    is_read: true,
    created_at: daysAgo(1, 11),
  },
  {
    id: 'notif-04',
    email_id: 'email-03',
    user_id: MOCK_USER.id,
    title: 'Recordatorio de biblioteca',
    message: 'Libro vence en 3 días',
    notification_type: 'reminder',
    is_read: false,
    created_at: daysAgo(2, 14),
  },
];

export const MOCK_SUMMARIES: DailySummary[] = [
  {
    id: 'summary-01',
    user_id: MOCK_USER.id,
    summary_date: daysAgo(0).split('T')[0],
    summary_text: 'Hoy recibiste 4 correos nuevos. Destacan: parcial de Cálculo mañana (URGENTE), invitación a entrevista laboral, y recordatorio de almuerzo familiar. Hay 2 correos de publicidad y 1 spam detectado.',
    email_count: 4,
    categories: 'urgente,trabajo,personal,publicidad,no_deseado',
    key_highlights: 'Parcial Cálculo mañana 8AM|Entrevista TechStartup|Proyecto BD en progreso',
    is_read: false,
    created_at: daysAgo(0, 8),
  },
  {
    id: 'summary-02',
    user_id: MOCK_USER.id,
    summary_date: daysAgo(1).split('T')[0],
    summary_text: 'Ayer: confirmación de matrícula, reunión de proyecto programada, y ofertas comerciales. 3 tareas pendientes detectadas automáticamente.',
    email_count: 6,
    categories: 'universidad,reuniones,trabajo,publicidad',
    key_highlights: 'Matrícula confirmada|Reunión proyecto viernes|3 tareas nuevas',
    is_read: true,
    created_at: daysAgo(1, 20),
  },
];

export const MOCK_ANALYZE: Record<string, { summary: string; action_items: string[]; deadlines: string[]; priority: string }> = {
  'email-01': {
    summary: 'El profesor recuerda el parcial de Cálculo Diferencial para mañana a las 8:00 AM. Debes llevar calculadora no programable y carné estudiantil. Temas: límites, derivadas y regla de la cadena.',
    action_items: ['Estudiar límites y derivadas', 'Llevar calculadora no programable', 'Llevar carné estudiantil', 'Revisar guía adjunta'],
    deadlines: ['Parcial: mañana 8:00 AM', 'Repaso Meet: hoy'],
    priority: 'urgente',
  },
  'email-10': {
    summary: 'Nueva tarea del curso Base de Datos II: Proyecto Final sobre diseño ER y normalización. Vale 30 puntos y vence en 10 días.',
    action_items: ['Diseñar diagrama ER', 'Aplicar normalización 3FN', 'Entregar en Classroom'],
    deadlines: [`Entrega: ${daysFromNow(10)} 11:59 PM`],
    priority: 'alto',
  },
  'email-04': {
    summary: 'TechStartup te invita a entrevista para el puesto de Practicante de Desarrollo. Es presencial en 5 días a las 3:00 PM.',
    action_items: ['Confirmar asistencia por correo', 'Preparar portafolio de proyectos', 'Investigar la empresa'],
    deadlines: [`Entrevista: ${daysFromNow(5)} 3:00 PM`],
    priority: 'alto',
  },
};

export const SEED_RULES: Rule[] = [
  {
    id: 'rule-seed-01',
    user_id: MOCK_USER.id,
    name: 'Reuniones Google Meet',
    description: 'Detecta invitaciones a reuniones virtuales',
    field: 'body',
    operator: 'contains',
    value: 'meet.google.com',
    category: 'reuniones',
    label: 'Reuniones',
    is_active: true,
    priority: 'medio',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'rule-seed-02',
    user_id: MOCK_USER.id,
    name: 'Ofertas comerciales',
    description: 'Publicidad y promociones',
    field: 'subject',
    operator: 'contains',
    value: 'OFF',
    category: 'publicidad',
    label: 'Publicidad',
    is_active: true,
    priority: 'bajo',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];
