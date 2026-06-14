import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Inbox,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Users,
  ArrowRight,
  AlertTriangle,
  Briefcase,
  BarChart3,
  ChevronUp,
  ChevronDown,
  Minus,
  Mail,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { casesApi } from '@/services/api';
import { cn, getInitials, formatDate } from '@/lib/utils';
import { formatResponseTime } from '@/lib/case-utils';
import { PLATFORM_MISSION, ANALYST_IDS, getDemoUserById } from '@/config';
import { AnalystMailboxFilter } from '@/components/dashboard/AnalystMailboxFilter';
import { isClosedStatus } from '@/config/case-statuses';
import { getStatusBadgeVariant } from '@/config/case-statuses';
import { Badge } from '@/components/ui/Badge';
import {
  getOperationStatus,
  getHealthStyle,
  computeKpiDeltas,
  getPriorityCases,
  buildOperationalAlerts,
  buildTrendData,
  getWorkloadBars,
  getStatusLabel,
  filterCasesByAnalyst,
  buildMetricsFromCases,
  type TrendGranularity,
  type KpiWithDelta,
} from '@/lib/executive-dashboard';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};
const itemAnim = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 320, damping: 30 } },
};

const TREND_LABELS: Record<TrendGranularity, string> = {
  daily: 'Diario',
  weekly: 'Semanal',
  monthly: 'Mensual',
};

export function AdminExecutiveDashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [trendPeriod, setTrendPeriod] = useState<TrendGranularity>('daily');
  const analystFromUrl = searchParams.get('analyst');
  const [analystFilter, setAnalystFilter] = useState<string | null>(
    analystFromUrl && ANALYST_IDS.includes(analystFromUrl as typeof ANALYST_IDS[number])
      ? analystFromUrl
      : null,
  );

  useEffect(() => {
    const urlAnalyst = searchParams.get('analyst');
    if (urlAnalyst && ANALYST_IDS.includes(urlAnalyst as typeof ANALYST_IDS[number])) {
      setAnalystFilter(urlAnalyst);
    } else if (!urlAnalyst) {
      setAnalystFilter(null);
    }
  }, [searchParams]);

  const handleAnalystFilter = (id: string | null) => {
    setAnalystFilter(id);
    const params = new URLSearchParams(searchParams);
    if (id) params.set('analyst', id);
    else params.delete('analyst');
    setSearchParams(params, { replace: true });
  };

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['cases', 'dashboard-metrics', 'admin'],
    queryFn: () => casesApi.dashboard().then((r) => r.data),
  });

  const { data: analysts, isLoading: analystsLoading } = useQuery({
    queryKey: ['cases', 'analysts', 'admin'],
    queryFn: () => casesApi.analysts().then((r) => r.data),
  });

  const { data: allCases, isLoading: casesLoading } = useQuery({
    queryKey: ['cases', 'executive-list', 'admin'],
    queryFn: () =>
      casesApi.list({ size: 200, sort_by: 'received_at', sort_order: 'desc' }).then((r) => r.data),
  });

  const isLoading = metricsLoading || analystsLoading || casesLoading;
  const cases = allCases?.items || [];

  const filteredCases = useMemo(
    () => filterCasesByAnalyst(cases, analystFilter),
    [cases, analystFilter],
  );

  const effectiveMetrics = useMemo(() => {
    if (!metrics) return null;
    return analystFilter ? buildMetricsFromCases(filteredCases) : metrics;
  }, [metrics, analystFilter, filteredCases]);

  const filteredAnalysts = useMemo(() => {
    if (!analysts) return [];
    if (!analystFilter) return analysts;
    return analysts.filter((a) => a.id === analystFilter);
  }, [analysts, analystFilter]);

  const activeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const id of ANALYST_IDS) {
      counts[id] = cases.filter((c) => c.assigned_to === id && !isClosedStatus(c.status)).length;
    }
    return counts;
  }, [cases]);

  const totalActive = cases.filter((c) => !isClosedStatus(c.status)).length;

  const operation = effectiveMetrics
    ? getOperationStatus(effectiveMetrics, filteredCases)
    : null;
  const healthStyle = operation ? getHealthStyle(operation.health) : null;
  const kpis = effectiveMetrics ? computeKpiDeltas(effectiveMetrics, filteredCases) : null;
  const priorityCases = getPriorityCases(filteredCases, 5);
  const alerts =
    effectiveMetrics && filteredAnalysts.length
      ? buildOperationalAlerts(effectiveMetrics, filteredAnalysts, filteredCases)
      : [];
  const workload = analysts ? getWorkloadBars(analysts) : [];
  const trendData = buildTrendData(filteredCases, trendPeriod);

  const recentCases = useMemo(
    () =>
      [...filteredCases]
        .sort((a, b) => new Date(b.received_at).getTime() - new Date(a.received_at).getTime())
        .slice(0, 5),
    [filteredCases],
  );

  const casesLink = analystFilter ? `/cases?assigned_to=${analystFilter}` : '/cases';
  const selectedAnalystName = analystFilter ? getDemoUserById(analystFilter)?.full_name : null;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
      {/* Header */}
      <motion.div variants={itemAnim} className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1">
            Dashboard Ejecutivo
          </p>
          <h1 className="text-2xl font-semibold text-text-primary tracking-tight">
            Visión Global de la Operación
          </h1>
          <p className="text-sm text-text-secondary mt-1.5 max-w-xl">
            {selectedAnalystName
              ? `Vista del buzón de ${selectedAnalystName} — correos trazados sin salir de Outlook.`
              : 'Estado operativo en un vistazo — todos los buzones consolidados.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => navigate(casesLink)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-bg-secondary border border-border text-sm font-medium text-text-primary hover:border-primary/30 transition-all"
          >
            <Briefcase size={15} /> Ver casos
          </button>
          <button
            type="button"
            onClick={() => navigate('/metrics')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-[#1d4ed8] transition-all shadow-sm shadow-primary/15"
          >
            <BarChart3 size={15} /> Análisis profundo
          </button>
        </div>
      </motion.div>

      {/* Filtro por analista / buzón */}
      <motion.div variants={itemAnim}>
        <Card padding="sm">
          <AnalystMailboxFilter
            value={analystFilter}
            onChange={handleAnalystFilter}
            activeCounts={activeCounts}
            totalActive={totalActive}
          />
        </Card>
      </motion.div>

      {/* Sección 1 — Estado general */}
      {isLoading ? (
        <Skeleton className="h-36 rounded-2xl" />
      ) : operation && healthStyle ? (
        <motion.div variants={itemAnim}>
          <div
            className={cn(
              'relative overflow-hidden rounded-2xl border p-6 lg:p-7',
              'bg-gradient-to-br shadow-[var(--shadow-card)]',
              healthStyle.gradient,
              healthStyle.border,
            )}
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="flex items-center gap-2 shrink-0 mt-1">
                  <span className={cn('h-3 w-3 rounded-full animate-pulse', healthStyle.dot)} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
                    Estado General de la Operación
                    {selectedAnalystName && (
                      <span className="normal-case font-medium text-primary"> · {selectedAnalystName}</span>
                    )}
                  </p>
                  <h2 className="text-xl lg:text-2xl font-bold text-text-primary tracking-tight">
                    {operation.label}
                  </h2>
                  <p className="text-sm text-text-secondary mt-2 max-w-lg leading-relaxed">
                    {operation.description}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-4 shrink-0">
                <OperationStat label="Activos" value={operation.activeCases} />
                <OperationStat label="Represados" value={operation.backloggedCases} accent="warning" />
                <OperationStat label="Críticos" value={operation.criticalCases} accent="error" />
                <OperationStat
                  label="T. respuesta"
                  value={formatResponseTime(operation.avgResponseTime)}
                  isText
                />
              </div>
            </div>
          </div>
        </motion.div>
      ) : null}

      {/* Sección 2 — KPIs ejecutivos */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : kpis ? (
        <motion.div variants={itemAnim} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <ExecutiveKpi
            icon={Inbox}
            label="Recibidos hoy"
            kpi={kpis.receivedToday}
            onClick={() => navigate(casesLink)}
          />
          <ExecutiveKpi
            icon={AlertCircle}
            label="Pendientes"
            kpi={kpis.pending}
            accent="warning"
            onClick={() => navigate(`${casesLink}${casesLink.includes('?') ? '&' : '?'}status=pendiente_cliente`)}
          />
          <ExecutiveKpi
            icon={CheckCircle2}
            label="Cerrados"
            kpi={kpis.closed}
            accent="success"
            onClick={() => navigate(`${casesLink}${casesLink.includes('?') ? '&' : '?'}status=cerrado`)}
          />
          <ExecutiveKpi
            icon={Clock}
            label="T. promedio atención"
            kpi={kpis.avgTime}
            accent="secondary"
            isText
            onClick={() => navigate('/metrics')}
          />
        </motion.div>
      ) : null}

      {/* Sección 3 + 6 — Carga + Alertas */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        <motion.div variants={itemAnim} className="xl:col-span-3">
          <Card className="h-full">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                  <Users size={16} className="text-primary" />
                  Distribución de Carga Operativa
                </h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  Activos, pendientes y cerrados por analista
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/analysts')}
                className="text-[11px] font-medium text-primary hover:underline flex items-center gap-1"
              >
                Detalle <ArrowRight size={10} />
              </button>
            </div>
            {isLoading ? (
              <Skeleton className="h-48" />
            ) : (
              <div className="space-y-5">
                {workload.map((row) => (
                  <button
                    key={row.id}
                    type="button"
                    onClick={() => {
                      handleAnalystFilter(row.id);
                    }}
                    className={cn(
                      'w-full text-left group rounded-xl p-2 -mx-2 transition-all',
                      analystFilter === row.id && 'bg-primary/5 ring-1 ring-primary/20',
                      analystFilter && analystFilter !== row.id && 'opacity-50 hover:opacity-80',
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-sm font-semibold text-text-primary group-hover:text-primary transition-colors"
                        >
                          {row.fullName}
                        </span>
                        {row.isOverloaded && (
                          <span className="text-[9px] font-bold uppercase tracking-wide text-warning bg-warning/10 px-1.5 py-0.5 rounded">
                            Sobrecarga
                          </span>
                        )}
                      </div>
                      <span className="text-lg font-bold tabular-nums" style={{ color: row.color }}>
                        {row.active}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-bg-tertiary overflow-hidden mb-2">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${row.pct}%`, backgroundColor: row.color }}
                      />
                    </div>
                    <div className="flex gap-4 text-[10px] text-text-secondary">
                      <span>Activos: <strong className="text-text-primary">{row.active}</strong></span>
                      <span>Pend.: <strong className="text-text-primary">{row.pending}</strong></span>
                      <span>Cerrados: <strong className="text-text-primary">{row.closed}</strong></span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Card>
        </motion.div>

        <motion.div variants={itemAnim} className="xl:col-span-2">
          <Card className="h-full">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-4">
              <AlertTriangle size={16} className="text-warning" />
              Alertas Operativas
            </h3>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12" />
                ))}
              </div>
            ) : alerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <CheckCircle2 size={28} className="text-success mb-2 opacity-80" />
                <p className="text-sm text-text-secondary">Sin alertas relevantes</p>
              </div>
            ) : (
              <div className="space-y-2">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={cn(
                      'flex items-start gap-3 p-3 rounded-xl border text-sm leading-snug',
                      alert.severity === 'critical'
                        ? 'bg-error/5 border-error/20 text-text-primary'
                        : 'bg-warning/5 border-warning/20 text-text-primary',
                    )}
                  >
                    <span className="shrink-0 mt-0.5">
                      {alert.severity === 'critical' ? '🔴' : '⚠️'}
                    </span>
                    <p>{alert.message}</p>
                  </div>
                ))}
              </div>
            )}
            <p className="text-[10px] text-text-secondary mt-4 pt-3 border-t border-border">
              {PLATFORM_MISSION}
            </p>
          </Card>
        </motion.div>
      </div>

      {/* Sección 4 + 5 — Prioritarios + Tendencia */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <motion.div variants={itemAnim}>
          <Card className="h-full">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-text-primary">
                  Casos que Requieren Atención
                </h3>
                <p className="text-xs text-text-secondary mt-0.5">Top 5 prioritarios</p>
              </div>
              <button
                type="button"
                onClick={() => navigate(casesLink)}
                className="text-[11px] font-medium text-primary hover:underline flex items-center gap-1"
              >
                Ver todos <ArrowRight size={10} />
              </button>
            </div>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : priorityCases.length === 0 ? (
              <p className="text-sm text-text-secondary text-center py-12">No hay casos urgentes</p>
            ) : (
              <div className="space-y-2">
                {priorityCases.map(({ caseItem, reason, elapsedLabel }) => (
                  <button
                    key={caseItem.id}
                    type="button"
                    onClick={() => navigate(`/cases/${caseItem.id}`)}
                    className="w-full text-left flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/30 hover:bg-bg-hover transition-all group"
                  >
                    <div className="h-9 w-9 rounded-full bg-bg-tertiary flex items-center justify-center text-[10px] font-bold text-text-secondary shrink-0">
                      {getInitials(caseItem.assigned_name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate group-hover:text-primary">
                        {caseItem.subject || 'Sin asunto'}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-[10px] text-text-secondary">{caseItem.assigned_name}</span>
                        <span className="text-[10px] text-text-secondary">·</span>
                        <span className="text-[10px] text-text-secondary">{elapsedLabel}</span>
                        <span className="text-[10px] text-warning font-medium">{reason}</span>
                      </div>
                    </div>
                    <Badge variant={getStatusBadgeVariant(caseItem.status)} className="shrink-0 text-[9px]">
                      {getStatusLabel(caseItem.status)}
                    </Badge>
                  </button>
                ))}
              </div>
            )}
          </Card>
        </motion.div>

        <motion.div variants={itemAnim}>
          <Card className="h-full">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                  <TrendingUp size={16} className="text-secondary" />
                  Tendencia Operativa
                </h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  Recibidos · Cerrados · Pendientes
                </p>
              </div>
              <div className="flex rounded-lg border border-border p-0.5 bg-bg-tertiary">
                {(['daily', 'weekly', 'monthly'] as TrendGranularity[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setTrendPeriod(p)}
                    className={cn(
                      'px-2.5 py-1 text-[10px] font-semibold rounded-md transition-all',
                      trendPeriod === p
                        ? 'bg-bg-secondary text-text-primary shadow-sm'
                        : 'text-text-secondary hover:text-text-primary',
                    )}
                  >
                    {TREND_LABELS[p]}
                  </button>
                ))}
              </div>
            </div>
            {isLoading ? (
              <Skeleton className="h-52" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={trendData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                  <defs>
                    <linearGradient id="receivedGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563EB" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="closedGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#14B8A6" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#14B8A6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '10px',
                      border: '1px solid var(--color-border)',
                      fontSize: '11px',
                      background: 'var(--color-bg-secondary)',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="received"
                    name="Recibidos"
                    stroke="#2563EB"
                    fill="url(#receivedGrad)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="closed"
                    name="Cerrados"
                    stroke="#14B8A6"
                    fill="url(#closedGrad)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="pending"
                    name="Pendientes"
                    stroke="#F59E0B"
                    fill="transparent"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </Card>
        </motion.div>
      </div>

      {/* Correos recientes por analista / todos */}
      <motion.div variants={itemAnim}>
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <Mail size={16} className="text-primary" />
                Correos capturados
                {selectedAnalystName && (
                  <span className="text-xs font-normal text-text-secondary">
                    — {selectedAnalystName}
                  </span>
                )}
              </h3>
              <p className="text-xs text-text-secondary mt-0.5">
                Últimos casos derivados del buzón{analystFilter ? ' del analista' : 's de todo el equipo'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate(casesLink)}
              className="text-[11px] font-medium text-primary hover:underline flex items-center gap-1 shrink-0"
            >
              Ver todos <ArrowRight size={10} />
            </button>
          </div>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-14" />
              ))}
            </div>
          ) : recentCases.length === 0 ? (
            <p className="text-sm text-text-secondary text-center py-8">
              No hay correos en esta vista
            </p>
          ) : (
            <div className="space-y-1.5">
              {recentCases.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => navigate(`/cases/${c.id}`)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/30 hover:bg-bg-hover transition-all text-left group"
                >
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Mail size={14} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate group-hover:text-primary">
                      {c.subject || 'Sin asunto'}
                    </p>
                    <p className="text-[10px] text-text-secondary mt-0.5 truncate">
                      {c.sender_name || c.sender}
                      {' · '}
                      {c.assigned_name}
                      {c.source_mailbox && (
                        <span className="hidden sm:inline"> · {c.source_mailbox}</span>
                      )}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] text-text-secondary whitespace-nowrap">
                      {formatDate(c.received_at, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <Badge variant={getStatusBadgeVariant(c.status)} className="text-[9px] mt-1">
                      {getStatusLabel(c.status)}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          )}
        </Card>
      </motion.div>
    </motion.div>
  );
}

function OperationStat({
  label,
  value,
  accent,
  isText,
}: {
  label: string;
  value: number | string;
  accent?: 'warning' | 'error';
  isText?: boolean;
}) {
  return (
    <div className="rounded-xl bg-bg-secondary/80 border border-border/60 px-4 py-3 text-center min-w-[88px]">
      <p
        className={cn(
          'font-bold tabular-nums text-text-primary',
          isText ? 'text-base' : 'text-xl',
          accent === 'warning' && 'text-warning',
          accent === 'error' && 'text-error',
        )}
      >
        {value}
      </p>
      <p className="text-[10px] text-text-secondary font-medium mt-0.5">{label}</p>
    </div>
  );
}

function ExecutiveKpi({
  icon: Icon,
  label,
  kpi,
  accent = 'primary',
  isText,
  onClick,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  kpi: KpiWithDelta;
  accent?: 'primary' | 'warning' | 'success' | 'secondary';
  isText?: boolean;
  onClick?: () => void;
}) {
  const accentMap = {
    primary: 'text-primary bg-primary/10',
    warning: 'text-warning bg-warning/10',
    success: 'text-success bg-success/10',
    secondary: 'text-secondary bg-secondary/10',
  };

  const delta = kpi.delta;
  const isGood =
    delta === null || delta === 0
      ? null
      : kpi.isPositiveGood
        ? delta > 0
        : delta < 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-2xl p-5 text-left border border-border bg-bg-secondary',
        'hover:border-primary/25 hover:shadow-[var(--shadow-card-hover)] transition-all duration-200',
      )}
    >
      <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center mb-4', accentMap[accent])}>
        <Icon size={18} />
      </div>
      <p className={cn('font-semibold tabular-nums text-text-primary', isText ? 'text-lg' : 'text-2xl')}>
        {kpi.value}
      </p>
      <p className="text-xs text-text-secondary font-medium mt-0.5">{label}</p>
      {delta !== null && (
        <div className="flex items-center gap-1 mt-2">
          {delta === 0 ? (
            <Minus size={12} className="text-text-secondary" />
          ) : isGood ? (
            <ChevronUp size={12} className="text-success" />
          ) : (
            <ChevronDown size={12} className="text-error" />
          )}
          <span
            className={cn(
              'text-[10px] font-medium',
              delta === 0
                ? 'text-text-secondary'
                : isGood
                  ? 'text-success'
                  : 'text-error',
            )}
          >
            {kpi.deltaLabel}
          </span>
        </div>
      )}
    </button>
  );
}
