import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Sparkles, RefreshCw, RotateCcw, Mail } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/Toast';
import {
  simulateRandomDemoEmails,
  processDemoFullSync,
  resetDemoEngine,
} from '@/services/local-api';
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
        'sticky top-16 z-20 border-b border-violet-200/50 dark:border-violet-800/40',
        'bg-violet-50/95 dark:bg-violet-950/40 backdrop-blur-sm',
      )}
    >
      <div className="px-6 py-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-violet-600 px-2 py-1 text-xs font-semibold text-white shrink-0">
            <Sparkles size={12} />
            Demo
          </span>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Versión de demostración con datos de ejemplo.
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 ml-auto sm:ml-0">
          <Button
            variant="secondary"
            size="sm"
            loading={busy === 'simulate'}
            onClick={handleSimulate}
            className="h-7 px-2.5 text-xs gap-1.5"
          >
            <Mail size={12} /> Simular
          </Button>
          <Button
            variant="secondary"
            size="sm"
            loading={busy === 'sync'}
            onClick={handleSyncAll}
            className="h-7 px-2.5 text-xs gap-1.5"
          >
            <RefreshCw size={12} /> Sync
          </Button>
          <Button
            variant="ghost"
            size="sm"
            loading={busy === 'reset'}
            onClick={handleReset}
            className="h-7 px-2.5 text-xs gap-1.5 text-slate-500"
          >
            <RotateCcw size={12} /> Restaurar
          </Button>
        </div>
      </div>
    </div>
  );
}
