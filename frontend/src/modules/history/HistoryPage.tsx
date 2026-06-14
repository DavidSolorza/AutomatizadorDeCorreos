import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { History, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { casesApi } from '@/services/api';
import { useDemoUserStore } from '@/store';
import { formatDate } from '@/lib/utils';

export function HistoryPage() {
  const navigate = useNavigate();
  const { currentUser } = useDemoUserStore();

  const { data, isLoading } = useQuery({
    queryKey: ['cases', 'history-all', currentUser.id],
    queryFn: () => casesApi.history({ limit: 50 }).then((r) => r.data),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">Historial</h1>
        <p className="text-sm text-slate-500 mt-1">
          {currentUser.role === 'admin'
            ? 'Registro de eventos y acciones en todos los casos'
            : `Actividad de tus casos — ${currentUser.full_name}`}
        </p>
      </div>

      <Card className="!p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-14" />
            ))}
          </div>
        ) : !data?.items.length ? (
          <EmptyState icon={History} title="Sin eventos" description="No hay registros en el historial." />
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {data.items.map((entry, i) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02 }}
                onClick={() => navigate(`/cases/${entry.case_id}`)}
                className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 cursor-pointer transition-colors group"
              >
                <div className="h-9 w-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                  <History size={16} className="text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-900 dark:text-white">{entry.action}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {entry.performed_by_name} · Caso {entry.case_id}
                  </p>
                </div>
                <span className="text-xs text-slate-400 shrink-0 whitespace-nowrap">
                  {formatDate(entry.created_at, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
                <ArrowRight size={14} className="text-slate-300 group-hover:text-slate-500 transition-colors shrink-0" />
              </motion.div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
