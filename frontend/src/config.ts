import type { CaseCategory } from '@/types/cases';
import type { DemoUser } from '@/types/cases';

export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export const APP_NAME = 'AseEsta Ops';

export interface AnalystProfile {
  id: string;
  title: string;
  specialties: CaseCategory[];
  color: string;
  gradient: string;
  /** Lucide icon name */
  iconName: 'Briefcase' | 'FileText' | 'ShieldCheck';
}

export const ANALYST_PROFILES: Record<string, AnalystProfile> = {
  paula: {
    id: 'paula',
    title: 'Comercial & Cartera',
    specialties: ['cotizaciones', 'cartera'],
    color: '#2563EB',
    gradient: 'from-primary to-[#1d4ed8]',
    iconName: 'Briefcase',
  },
  cristina: {
    id: 'cristina',
    title: 'Renovaciones & Licitaciones',
    specialties: ['renovaciones', 'licitaciones'],
    color: '#14B8A6',
    gradient: 'from-secondary to-[#0d9488]',
    iconName: 'FileText',
  },
  marcela: {
    id: 'marcela',
    title: 'Emisiones & Colectivas',
    specialties: ['emisiones', 'colectivas'],
    color: '#3B82F6',
    gradient: 'from-info to-primary',
    iconName: 'ShieldCheck',
  },
};

/** Asignación automática: categoría → analista especialista */
export const CATEGORY_TO_ANALYST: Record<CaseCategory, string> = {
  cotizaciones: 'paula',
  cartera: 'paula',
  renovaciones: 'cristina',
  licitaciones: 'cristina',
  emisiones: 'marcela',
  colectivas: 'marcela',
  sin_clasificar: 'paula',
};

export const DEMO_USERS: DemoUser[] = [
  {
    id: 'admin',
    email: 'admin@aseesta.com',
    full_name: 'Administrador',
    role: 'admin',
    is_active: true,
    is_superuser: true,
    created_at: '2026-01-01T08:00:00Z',
    updated_at: '2026-06-06T08:00:00Z',
    last_login: '2026-06-06T08:00:00Z',
  },
  {
    id: 'paula',
    email: 'paula@aseesta.com',
    full_name: 'Paula',
    role: 'analyst',
    is_active: true,
    is_superuser: false,
    created_at: '2026-01-15T08:00:00Z',
    updated_at: '2026-06-06T08:00:00Z',
    last_login: '2026-06-06T07:30:00Z',
  },
  {
    id: 'cristina',
    email: 'cristina@aseesta.com',
    full_name: 'Cristina',
    role: 'analyst',
    is_active: true,
    is_superuser: false,
    created_at: '2026-01-15T08:00:00Z',
    updated_at: '2026-06-06T08:00:00Z',
    last_login: '2026-06-06T07:45:00Z',
  },
  {
    id: 'marcela',
    email: 'marcela@aseesta.com',
    full_name: 'Marcela',
    role: 'analyst',
    is_active: true,
    is_superuser: false,
    created_at: '2026-01-15T08:00:00Z',
    updated_at: '2026-06-06T08:00:00Z',
    last_login: '2026-06-06T08:15:00Z',
  },
];

export const DEFAULT_DEMO_USER = DEMO_USERS[0];

/** @deprecated Use DEMO_USERS and useDemoUserStore */
export const MOCK_USER = DEFAULT_DEMO_USER;

export const ANALYST_IDS = ['paula', 'cristina', 'marcela'] as const;

/** Buzones de correo por analista — la plataforma captura sin mover correos de Outlook */
export const ANALYST_MAILBOXES: Record<string, { email: string; label: string }> = {
  paula: { email: 'paula@aseesta.com', label: 'Paula — Comercial & Cartera' },
  cristina: { email: 'cristina@aseesta.com', label: 'Cristina — Renovaciones & Licitaciones' },
  marcela: { email: 'marcela@aseesta.com', label: 'Marcela — Emisiones & Colectivas' },
};

export const PLATFORM_MISSION =
  'Capa de trazabilidad y gestión operativa. Las analistas siguen trabajando en su correo; aquí se consolidan y monitorean los casos.';

export function getDemoUserById(id: string): DemoUser | undefined {
  return DEMO_USERS.find((u) => u.id === id);
}

export function isAdmin(user: DemoUser): boolean {
  return user.role === 'admin' || user.is_superuser;
}

export function assignAnalystForCategory(category: CaseCategory): { id: string; name: string } {
  const analystId = CATEGORY_TO_ANALYST[category] || 'paula';
  const user = getDemoUserById(analystId)!;
  return { id: user.id, name: user.full_name };
}
