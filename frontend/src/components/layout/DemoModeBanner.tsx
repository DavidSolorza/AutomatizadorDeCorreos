import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Sparkles, RefreshCw, RotateCcw, Mail } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/Toast';
import {
  simulateRandomDemoEmails,
  processDemoFullSync,
  resetDemoEngine,
} from '@/services/mock/demo-engine';
import { cn } from '@/lib/utils';

export function DemoModeBanner() {
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState<'simulate' | 'sync' | 'reset' | null>(null);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['cases'] });
    queryClient.invalidateQueries({ queryKey: ['gmail-accounts'] });
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
    queryClient.invalidateQueries({ queryKey: ['case-metrics'] });
  };

  const handleSimulate = async () => {
    setBusy('simulate');
    try {
      const count = simulateRandomDemoEmails(2);
      refresh();
      toast('success', 'Correos demo procesados', `${count} correo(s) capturados, clasificados y asignados`);
    } finally {
      setBusy(null);
    }
  };

  const handleSyncAll = async () => {
    setBusy('sync');
    try {
      const total = processDemoFullSync();
      refresh();
      toast('success', 'Sincronización demo', `${total} correo(s) desde los 3 buzones`);
    } finally {
      setBusy(null);
    }
  };

  const handleReset = () => {
    if (!window.confirm('¿Restaurar datos demo? Se borrarán cambios locales y se recargará la página.')) return;
    setBusy('reset');
    resetDemoEngine();
  };

  return (
    <div
      className={cn(
        'sticky top-16 z-30 border-b border-violet-200/60 dark:border-violet-800/40',
        'bg-gradient-to-r from-violet-50 via-indigo-50 to-blue-50',
        'dark:from-violet-950/50 dark:via-indigo-950/40 dark:to-blue-950/30',
      )}
    >
      <div className="px-6 lg:px-8 py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-start sm:items-center gap-2 min-w-0">
          <Sparkles size={16} className="text-violet-600 shrink-0 mt-0.5 sm:mt-0" />
          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-snug">
            <span className="font-semibold text-violet-700 dark:text-violet-300">Modo demo</span>
            {' — '}
            Correos, clasificación, asignación y casos se simulan en el navegador (sin backend).
            En producción: <code className="text-[10px] sm:text-xs text-violet-600 dark:text-violet-400">VITE_USE_MOCK=false</code>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button
            variant="secondary"
            size="sm"
            loading={busy === 'simulate'}
            onClick={handleSimulate}
            className="h-8 text-xs"
          >
            <Mail size={13} /> Simular correos
          </Button>
          <Button
            variant="secondary"
            size="sm"
            loading={busy === 'sync'}
            onClick={handleSyncAll}
            className="h-8 text-xs"
          >
            <RefreshCw size={13} /> Sync buzones
          </Button>
          <Button
            variant="ghost"
            size="sm"
            loading={busy === 'reset'}
            onClick={handleReset}
            className="h-8 text-xs text-slate-500"
          >
            <RotateCcw size={13} /> Restaurar
          </Button>
        </div>
      </div>
    </div>
  );
}
