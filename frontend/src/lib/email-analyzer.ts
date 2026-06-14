import type { CaseCategory } from '@/types/cases';

export interface EmailAnalysis {
  ai_summary: string;
  action_items: string[];
  deadlines: string[];
  priority: 'urgente' | 'alto' | 'media' | 'bajo';
}

const CATEGORY_ACTIONS: Record<string, string[]> = {
  cotizaciones: [
    'Revisar documentación adjunta del cliente',
    'Preparar cotización con coberturas solicitadas',
    'Enviar propuesta con plazo y condiciones comerciales',
  ],
  renovaciones: [
    'Verificar vigencia y condiciones de la póliza actual',
    'Solicitar tarifas actualizadas al reasegurador',
    'Preparar propuesta de renovación para el cliente',
  ],
  emisiones: [
    'Validar documentos firmados y datos del contrato',
    'Registrar póliza(s) en el sistema core',
    'Enviar certificados de cobertura al cliente',
  ],
  cartera: [
    'Revisar listado de pólizas próximas a vencer',
    'Contactar clientes con cartera en riesgo',
    'Coordinar gestión de cobro o renovación',
  ],
  licitaciones: [
    'Revisar pliego y requisitos de participación',
    'Preparar documentación técnica y económica',
    'Registrar fechas clave del proceso licitatorio',
  ],
  colectivas: [
    'Validar nómina y coberturas del colectivo',
    'Calcular prima según número de asegurados',
    'Coordinar emisión o renovación del colectivo',
  ],
};

const URGENT_WORDS = ['urgente', 'inmediato', 'hoy', 'mañana', 'asap', 'prioritario', 'crítico', 'critico'];

function detectPriority(text: string): EmailAnalysis['priority'] {
  const lower = text.toLowerCase();
  if (URGENT_WORDS.some((w) => lower.includes(w))) return 'urgente';
  if (['importante', 'prioridad', 'plazo'].some((w) => lower.includes(w))) return 'alto';
  return 'media';
}

function detectDeadlines(text: string): string[] {
  const patterns = [
    /\b\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4}\b/g,
    /\b\d{1,2}\s+de\s+[a-zñ]+\s+(de\s+)?\d{2,4}\b/gi,
    /\b(hasta el|antes del|para el|vence|vencimiento)\s+[^.,\n]{4,40}/gi,
  ];
  const found: string[] = [];
  for (const pattern of patterns) {
    const matches = text.match(pattern);
    if (matches) {
      for (const m of matches) {
        const trimmed = m.trim();
        if (!found.includes(trimmed)) found.push(trimmed);
      }
    }
  }
  return found.slice(0, 5);
}

export function analyzeInsuranceEmail(
  sender: string,
  subject: string,
  body: string,
  category: CaseCategory = 'sin_clasificar',
): EmailAnalysis {
  const text = `${subject} ${body}`.trim();
  const lower = text.toLowerCase();

  let cat = category;
  if (cat === 'sin_clasificar') {
    if (lower.includes('cotiz')) cat = 'cotizaciones';
    else if (lower.includes('renov')) cat = 'renovaciones';
    else if (lower.includes('emisi') || lower.includes('contrato firmado')) cat = 'emisiones';
    else if (lower.includes('cartera') || lower.includes('venc')) cat = 'cartera';
    else if (lower.includes('licit')) cat = 'licitaciones';
    else if (lower.includes('colectiv')) cat = 'colectivas';
  }

  const senderLabel = sender ? sender.split('@')[0] : 'remitente';
  const ai_summary = [
    `Correo de ${senderLabel} sobre "${subject || 'gestión operativa'}".`,
    `Clasificado como ${cat.replace('_', ' ')}.`,
    'Requiere atención del analista asignado según el flujo operativo.',
  ].join(' ');

  const actions = [...(CATEGORY_ACTIONS[cat] || [
    'Leer y clasificar el correo completo',
    'Identificar documentos o datos faltantes',
    'Responder al cliente con siguiente paso operativo',
  ])];

  if (lower.includes('adjunt')) actions.unshift('Revisar archivos adjuntos mencionados en el correo');
  if (lower.includes('confirm') || lower.includes('proceder')) {
    actions.unshift('Confirmar autorización interna antes de proceder');
  }
  if (text.includes('?') || lower.includes('favor') || lower.includes('solicit')) {
    actions.push('Preparar respuesta a las solicitudes del cliente');
  }

  return {
    ai_summary,
    action_items: actions.slice(0, 6),
    deadlines: detectDeadlines(text),
    priority: detectPriority(text),
  };
}

export const PRIORITY_LABELS: Record<EmailAnalysis['priority'], string> = {
  urgente: 'Urgente',
  alto: 'Alta',
  media: 'Media',
  bajo: 'Baja',
};

export const PRIORITY_COLORS: Record<EmailAnalysis['priority'], string> = {
  urgente: 'bg-red-500/15 text-red-700 dark:text-red-300 border-red-300/50',
  alto: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-300/50',
  media: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-300/50',
  bajo: 'bg-slate-500/15 text-slate-600 dark:text-slate-300 border-slate-300/50',
};
