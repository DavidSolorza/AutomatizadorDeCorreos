import { Shield } from 'lucide-react';
import { RulesEditor } from '@/components/rules/RulesEditor';

export function RulesPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">Reglas</h1>
        <p className="text-sm text-slate-500 mt-1">Automatiza clasificación y asignación de casos</p>
      </div>
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center">
            <Shield size={18} className="text-amber-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Reglas de automatización</h2>
            <p className="text-xs text-slate-500">También disponible en Configuración</p>
          </div>
        </div>
        <RulesEditor />
      </div>
    </div>
  );
}
