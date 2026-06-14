import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart3, Clock, CheckCircle2, AlertCircle, PauseCircle, TrendingUp } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { casesApi } from '@/services/api';
import { useDemoUserStore } from '@/store';
import { cn } from '@/lib/utils';
import { formatResponseTime } from '@/lib/case-utils';
import { CATEGORY_CHART_COLORS, CASE_CATEGORY_LABELS, type CaseCategory } from '@/types/cases';

type Period = 'daily' | 'weekly' | 'monthly';

const PERIOD_LABELS: Record<Period, string> = {
  daily: 'Diario',
  weekly: 'Semanal',
  monthly: 'Mensual',
};

export function MetricsPage() {
  const navigate = useNavigate();
  const { currentUser } = useDemoUserStore();
  const [period, setPeriod] = useState<Period>('daily');

  const { data: metrics, isLoading } = useQuery({
    queryKey: ['cases', 'metrics', period, currentUser.id],
    queryFn: () => casesApi.periodMetrics(period).then((r) => r.data),
  });

  const { data: dashboard } = useQuery({
    queryKey: ['cases', 'dashboard-metrics', currentUser.id],
    queryFn: () => casesApi.dashboard().then((r) => r.data),
  });

  const { data: allPeriods } = useQuery({
    queryKey: ['cases', 'metrics-all', currentUser.id],
    queryFn: async () => {
      const [daily, weekly, monthly] = await Promise.all([
        casesApi.periodMetrics('daily').then((r) => r.data),
        casesApi.periodMetrics('weekly').then((r) => r.data),
        casesApi.periodMetrics('monthly').then((r) => r.data),
      ]);
      return { daily, weekly, monthly };
    },
  });

  const chartData = allPeriods
    ? [
        { name: 'Hoy', atendidos: allPeriods.daily.cases_attended, pendientes: allPeriods.daily.cases_pending, represados: allPeriods.daily.cases_backlogged },
        { name: 'Semana', atendidos: allPeriods.weekly.cases_attended, pendientes: allPeriods.weekly.cases_pending, represados: allPeriods.weekly.cases_backlogged },
        { name: 'Mes', atendidos: allPeriods.monthly.cases_attended, pendientes: allPeriods.monthly.cases_pending, represados: allPeriods.monthly.cases_backlogged },
      ]
    : [];

  const categoryChart = dashboard
    ? Object.entries(dashboard.by_category).map(([key, value]) => ({
        key,
        name: (CASE_CATEGORY_LABELS[key as CaseCategory] || key).split(' ')[0],
        value,
        fill: CATEGORY_CHART_COLORS[key] || '#94A3B8',
      }))
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Métricas</h1>
          <p className="text-sm text-slate-500 mt-1">Indicadores de rendimiento — clic en cada tarjeta para ver detalle</p>
        </div>
        <div className="flex rounded-xl border border-slate-200 dark:border-slate-700 p-1 bg-slate-50 dark:bg-slate-900 shadow-sm">
          {(['daily', 'weekly', 'monthly'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                'px-4 py-2 text-sm font-semibold rounded-lg transition-all',
                period === p
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-700',
              )}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : metrics ? (
        <motion.div
          key={period}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3"
        >
          <MetricCard icon={Clock} label="Tiempo promedio" value={formatResponseTime(metrics.avg_response_time)} gradient="from-violet-500 to-purple-600" onClick={() => navigate('/cases?status=cerrado')} />
          <MetricCard icon={CheckCircle2} label="Atendidos" value={metrics.cases_attended} gradient="from-emerald-500 to-green-600" onClick={() => navigate('/cases?status=cerrado')} />
          <MetricCard icon={AlertCircle} label="Pendientes" value={metrics.cases_pending} gradient="from-amber-500 to-orange-600" onClick={() => navigate('/cases?status=pendiente_cliente')} />
          <MetricCard icon={PauseCircle} label="Represados" value={metrics.cases_backlogged} gradient="from-red-500 to-rose-600" onClick={() => navigate('/cases?status=bloqueado')} />
        </motion.div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-blue-500" /> Evolución por período
          </h3>
          {allPeriods ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="gAtendidos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gPendientes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gRepresados" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: '12px' }} />
                <Area type="monotone" dataKey="atendidos" stroke="#10B981" fill="url(#gAtendidos)" strokeWidth={2.5} name="Atendidos" />
                <Area type="monotone" dataKey="pendientes" stroke="#F59E0B" fill="url(#gPendientes)" strokeWidth={2.5} name="Pendientes" />
                <Area type="monotone" dataKey="represados" stroke="#EF4444" fill="url(#gRepresados)" strokeWidth={2.5} name="Represados" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <Skeleton className="h-64" />
          )}
        </Card>

        <Card>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 mb-4">
            <BarChart3 size={16} className="text-violet-500" /> Volumen por categoría
          </h3>
          {categoryChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={categoryChart} layout="vertical" barSize={18}>
                <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={70} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '10px', fontSize: '12px' }} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} name="Casos">
                  {categoryChart.map((entry) => (
                    <Cell
                      key={entry.key}
                      fill={entry.fill}
                      onClick={() => navigate(`/cases?category=${entry.key}`)}
                      style={{ cursor: 'pointer' }}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Skeleton className="h-64" />
          )}
        </Card>
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  gradient,
  onClick,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: number | string;
  gradient: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-xl p-4 text-left text-white shadow-lg bg-gradient-to-br',
        'hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all',
        gradient,
      )}
    >
      <Icon size={18} className="opacity-80 mb-2" />
      <p className="text-2xl font-bold tabular-nums">{value}</p>
      <p className="text-xs text-white/80 font-medium mt-0.5">{label}</p>
    </button>
  );
}
