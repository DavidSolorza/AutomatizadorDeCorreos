import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Briefcase, CheckCircle2, Clock, BarChart2, ArrowRight, UserCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { casesApi } from '@/services/api';
import { useDemoUserStore } from '@/store';
import { ANALYST_PROFILES } from '@/config';
import { getAnalystIcon } from '@/lib/icons';
import { cn } from '@/lib/utils';
import { formatResponseTime } from '@/lib/case-utils';
import { CASE_CATEGORY_LABELS } from '@/types/cases';
import type { AnalystStats } from '@/types/cases';

function AnalystCard({ analyst, index }: { analyst: AnalystStats; index: number }) {
  const navigate = useNavigate();
  const profile = ANALYST_PROFILES[analyst.id];
  const AnalystIcon = getAnalystIcon(profile?.iconName || 'Briefcase');

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
    >
      <Card
        className="h-full overflow-hidden !p-0 cursor-pointer hover:shadow-lg transition-shadow"
        onClick={() => navigate(`/cases?assigned_to=${analyst.id}`)}
      >
        <div className={cn('p-5 bg-gradient-to-r text-white', profile?.gradient || 'from-blue-500 to-blue-700')}>
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-xl bg-white/20 flex items-center justify-center">
              <AnalystIcon size={26} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold">{analyst.name}</h3>
              <p className="text-sm text-white/80">{profile?.title}</p>
              <p className="text-xs text-white/60 mt-0.5">{analyst.email}</p>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex flex-wrap gap-1.5">
            {profile?.specialties.map((s) => (
              <span
                key={s}
                className="text-[10px] px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium"
              >
                {CASE_CATEGORY_LABELS[s]}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); navigate(`/cases?assigned_to=${analyst.id}`); }}
              className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors text-left"
            >
              <Briefcase size={16} className="text-blue-600 mb-1" />
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{analyst.active_cases}</p>
              <p className="text-[11px] text-slate-500">Activos</p>
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); navigate(`/cases?assigned_to=${analyst.id}&status=cerrado`); }}
              className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors text-left"
            >
              <CheckCircle2 size={16} className="text-emerald-600 mb-1" />
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{analyst.closed_cases}</p>
              <p className="text-[11px] text-slate-500">Cerrados</p>
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-500">
            <span>Proceso: <strong className="text-slate-700 dark:text-slate-300">{analyst.in_process_cases}</strong></span>
            <span>Pend.: <strong className="text-slate-700 dark:text-slate-300">{analyst.pending_cases}</strong></span>
            <span>Bloq.: <strong className="text-slate-700 dark:text-slate-300">{analyst.blocked_cases}</strong></span>
          </div>

          <div className="flex items-center justify-between text-sm gap-2 flex-wrap">
            <span className="text-[11px] text-slate-500">
              Acumulado: <strong className="text-slate-700 dark:text-slate-300">{analyst.accumulated_hours}h</strong>
            </span>
            <span className="flex items-center gap-1.5 text-slate-500">
              <Clock size={14} /> Tiempo prom.
            </span>
            <span className="font-bold text-slate-900 dark:text-white">
              {formatResponseTime(analyst.avg_response_time)}
            </span>
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-500 mb-1.5">
              <span className="flex items-center gap-1"><BarChart2 size={12} /> Carga</span>
              <span className="font-bold">{analyst.workload}%</span>
            </div>
            <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  analyst.workload > 80 ? 'bg-red-500' : analyst.workload > 50 ? 'bg-amber-500' : 'bg-blue-600',
                )}
                style={{ width: `${Math.max(analyst.workload, 4)}%` }}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); navigate(`/dashboard?analyst=${analyst.id}`); }}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
          >
            Ver en tablero <ArrowRight size={12} />
          </button>
        </div>
      </Card>
    </motion.div>
  );
}

export function AnalystsPage() {
  const navigate = useNavigate();
  const { currentUser } = useDemoUserStore();
  const isAdmin = currentUser.role === 'admin';

  const { data: analysts, isLoading, isError, refetch } = useQuery({
    queryKey: ['cases', 'analysts', currentUser.id],
    queryFn: () => casesApi.analysts().then((r) => r.data),
  });

  const list = analysts || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          {isAdmin ? 'Equipo de Analistas' : 'Mi perfil operativo'}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {isAdmin
            ? 'Especialistas por tipo de gestión — asignación automática desde correos'
            : 'Tu carga de trabajo, especialidades y rendimiento'}
        </p>
      </div>

      {isLoading ? (
        <div className={cn('grid gap-5', isAdmin ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 max-w-md')}>
          {Array.from({ length: isAdmin ? 3 : 1 }).map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <EmptyState
          icon={UserCircle}
          title="Error al cargar analistas"
          description="No se pudieron obtener los datos. Intenta de nuevo."
          action={
            <button onClick={() => refetch()} className="text-sm text-blue-600 font-medium hover:underline">
              Reintentar
            </button>
          }
        />
      ) : list.length === 0 ? (
        <EmptyState
          icon={UserCircle}
          title="Sin analistas"
          description="No hay datos de analistas disponibles."
        />
      ) : (
        <div className={cn('grid gap-5', isAdmin ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 max-w-md')}>
          {list.map((analyst, i) => (
            <AnalystCard key={analyst.id} analyst={analyst} index={i} />
          ))}
        </div>
      )}

      {!isAdmin && list.length > 0 && (
        <Card className="bg-blue-50/50 dark:bg-blue-950/20 border-blue-200/50 dark:border-blue-800/30">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Tip:</strong> Ve al <button onClick={() => navigate('/dashboard')} className="underline font-semibold">Tablero</button> para gestionar tus casos con drag & drop y cerrarlos en un clic.
          </p>
        </Card>
      )}
    </div>
  );
}
