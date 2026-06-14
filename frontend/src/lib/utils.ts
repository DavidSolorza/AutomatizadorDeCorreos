import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string, options?: Intl.DateTimeFormatOptions): string {
  const d = new Date(date);
  if (options) {
    return d.toLocaleDateString('es-CO', options);
  }
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  }
  if (days === 1) return 'Ayer';
  if (days < 7) return d.toLocaleDateString('es-CO', { weekday: 'long' });
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

export function getCategoryColor(category: string | null): string {
  const colors: Record<string, string> = {
    universidad: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    academico: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
    profesor: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    trabajo: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    personal: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    pagos: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    urgente: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    reuniones: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
    no_deseado: 'bg-rose-100 text-rose-500 dark:bg-rose-900/20 dark:text-rose-400',
    publicidad: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  };
  return colors[category?.toLowerCase() ?? ''] || 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400';
}
