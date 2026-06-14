import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BarChart3,
  AlertTriangle,
  Users,
  Clock,
  TrendingUp,
  Scale,
  PauseCircle,
  Inbox,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from 'recharts';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { casesApi } from '@/services/api';
import { ANALYST_PROFILES, DEMO_USERS, PLATFORM_MISSION } from '@/config';
import { formatResponseTime } from '@/lib/case-utils';
import { cn } from '@/lib/utils';

export function ExecutivePage() {
  const navigate = useNavigate();

  const { data: metrics, isLoading } = useQuery({
    queryKey: ['cases', 'dashboard-metrics', 'admin'],
    queryFn: () => casesApi.dashboard().then((r) => r.data),
  });

  const { data: analysts } = useQuery({
    queryKey: ['cases', 'analysts', 'admin'],
    queryFn: () => casesApi.analysts().then((r) => r.data),
  });

  const workloadChart = analysts?.map((a) => ({
    name: a.name.split(' ')[0],
    fullName: a.name,
    activos: a.active_cases,
    enProceso: a.in_process_cases,
    pendientes: a.pending_cases,
    bloqueados: a.blocked_cases,
    color: ANALYST_PROFILES[a.id]?.color || '#64748b',
  })) || [];

  const maxActive = Math.max(...(analysts?.map((a) => a.active_cases) || [1]));
  const imbalance = analysts?.find((a) => a.active_cases >= maxActive * 0.7 && maxActive > 20);

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 size={14} className="text-violet-500" />
            <span className="text-xs font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wider">
              Vista Gerencial
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Supervisión Operativa
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">{PLATFORM_MISSION}</p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => navigate('/cases')}>
          Ver todos los casos
        </Button>
      </div>

      {imbalance && (
        <Card className="border-amber-200/60 dark:border-amber-800/40 bg-amber-50/50 dark:bg-amber-950/20">
          <div className="flex items-start gap-3">
            <Scale size={20} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                Desequilibrio de carga detectado
              </p>
              <p className="text-xs text-amber-700/80 dark:text-amber-300/80 mt-1">
                {imbalance.name} tiene {imbalance.active_cases} casos activos frente a un máximo de equipo de {maxActive}.
                Considera reasignar seguimiento operativo desde la vista de Casos.
              </p>
            </div>
          </div>
        </Card>
      )}

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard icon={Inbox} label="Casos abiertos" value={metrics ? metrics.pending + (metrics.blocked || 0) : 0} color="blue" />
          <KpiCard icon={PauseCircle} label="Bloqueados" value={metrics?.blocked || 0} color="red" />
          <KpiCard icon={AlertTriangle} label="Críticos" value={metrics?.critical || 0} color="amber" />
          <KpiCard icon={Clock} label="Tiempo prom. resolución" value={formatResponseTime(metrics?.avg_response_time ?? 0)} color="emerald" isText />
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
            <Users size={16} /> Distribución de carga por analista
          </h2>
          <p className="text-xs text-slate-500 mb-4">Casos activos consolidados desde múltiples buzones</p>
          {isLoading ? (
            <Skeleton className="h-64" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={workloadChart} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(v) => [v ?? 0, 'Activos']}
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName || ''}
                />
                <Bar dataKey="activos" radius={[6, 6, 0, 0]}>
                  {workloadChart.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
            <TrendingUp size={16} /> Detalle operativo por analista
          </h2>
          <p className="text-xs text-slate-500 mb-4">En proceso, pendientes, bloqueados y tiempo acumulado</p>
          <div className="space-y-3">
            {(analysts || []).map((a) => {
              const profile = ANALYST_PROFILES[a.id];
              const pct = maxActive ? Math.round((a.active_cases / maxActive) * 100) : 0;
              return (
                <div key={a.id} className="p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{a.name}</p>
                      <p className="text-[10px] text-slate-500">{DEMO_USERS.find((u) => u.id === a.id)?.email}</p>
                    </div>
                    <span className="text-lg font-bold tabular-nums" style={{ color: profile?.color }}>
                      {a.active_cases}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mb-2">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: profile?.color }}
                    />
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-[10px] text-slate-500">
                    <span>Proceso: <strong className="text-slate-700 dark:text-slate-300">{a.in_process_cases}</strong></span>
                    <span>Pend.: <strong className="text-slate-700 dark:text-slate-300">{a.pending_cases}</strong></span>
                    <span>Bloq.: <strong className="text-slate-700 dark:text-slate-300">{a.blocked_cases}</strong></span>
                    <span>Acum.: <strong className="text-slate-700 dark:text-slate-300">{a.accumulated_hours}h</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  color,
  isText,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: number | string;
  color: 'blue' | 'red' | 'amber' | 'emerald';
  isText?: boolean;
}) {
  const colors = {
    blue: 'bg-blue-50 dark:bg-blue-950/30 text-blue-600',
    red: 'bg-red-50 dark:bg-red-950/30 text-red-600',
    amber: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600',
    emerald: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600',
  };
  return (
    <Card className="!p-4">
      <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center mb-3', colors[color])}>
        <Icon size={18} />
      </div>
      <p className={cn('font-bold text-slate-900 dark:text-white tabular-nums', isText ? 'text-lg' : 'text-2xl')}>
        {value}
      </p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
    </Card>
  );
}
