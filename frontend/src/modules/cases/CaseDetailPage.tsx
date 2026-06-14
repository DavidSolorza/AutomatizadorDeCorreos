import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Clock,
  User,
  Mail,
  History,
  CheckCircle2,
  Sparkles,
  ListTodo,
  CalendarClock,
  AlertTriangle,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { casesApi } from '@/services/api';
import { useDemoUserStore } from '@/store';
import { toast } from '@/components/ui/Toast';
import { cn, formatDate } from '@/lib/utils';
import { PRIORITY_COLORS, PRIORITY_LABELS } from '@/lib/email-analyzer';
import {
  formatElapsed,
  formatResponseTime,
  getOpenTimeHours,
  getManagementTimeHours,
  getResolutionTimeHours,
} from '@/lib/case-utils';
import {
  CASE_CATEGORY_LABELS,
  CASE_STATUS_LABELS,
  CASE_STATUS_DEFINITIONS,
  getCategoryColor,
  getStatusColor,
  isClosedStatus,
  normalizeCaseStatus,
  type CaseStatus,
  type CasePriority,
} from '@/types/cases';
import { DEMO_USERS } from '@/config';

export function CaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useDemoUserStore();
  const backPath =
    (location.state as { from?: string } | null)?.from ||
    (currentUser.role === 'admin' ? '/cases' : '/dashboard');
  const queryClient = useQueryClient();

  const { data: caseItem, isLoading } = useQuery({
    queryKey: ['cases', id],
    queryFn: () => casesApi.get(id!).then((r) => r.data),
    enabled: !!id,
  });

  const { data: history } = useQuery({
    queryKey: ['cases', 'history', id],
    queryFn: () => casesApi.history({ case_id: id, limit: 20 }).then((r) => r.data),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => casesApi.update(id!, data),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      if (vars.status === 'cerrado') {
        toast('success', 'Caso cerrado', 'Regresando al tablero...');
        setTimeout(() => navigate(backPath), 800);
      } else {
        toast('success', 'Caso actualizado');
      }
    },
    onError: () => toast('error', 'No se pudo actualizar el caso'),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40" />
        <Skeleton className="h-64" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (!caseItem) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">Caso no encontrado</p>
        <Button variant="ghost" className="mt-4" onClick={() => navigate('/cases')}>
          Volver a casos
        </Button>
      </div>
    );
  }

  const canEdit =
    currentUser.role === 'admin' || caseItem.assigned_to === currentUser.id;

  const actionItems = caseItem.action_items ?? [];
  const deadlines = caseItem.deadlines ?? [];
  const priority = (caseItem.priority || 'media') as CasePriority;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <button
        onClick={() => navigate(backPath)}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
      >
        <ArrowLeft size={16} /> {currentUser.role === 'admin' ? 'Volver a casos' : 'Volver al tablero'}
      </button>

      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className={cn('inline-flex px-2.5 py-1 rounded-full text-xs font-medium border', getCategoryColor(caseItem.category))}>
              {CASE_CATEGORY_LABELS[caseItem.category]}
            </span>
            <span className={cn('inline-flex px-2.5 py-1 rounded-full text-xs font-medium', getStatusColor(caseItem.status))}>
              {CASE_STATUS_LABELS[caseItem.status]}
            </span>
            <span className={cn('inline-flex px-2.5 py-1 rounded-full text-xs font-medium border', PRIORITY_COLORS[priority])}>
              {PRIORITY_LABELS[priority]}
            </span>
          </div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white tracking-tight">
            {caseItem.subject || 'Sin asunto'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Caso #{caseItem.id} · Buzón {caseItem.source_mailbox || '—'} · Recibido{' '}
            {formatDate(caseItem.received_at, { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        {canEdit && (
          <div className="flex gap-2 flex-wrap items-center">
            {!isClosedStatus(caseItem.status) && (
              <Button
                onClick={() => updateMutation.mutate({ status: 'cerrado' })}
                loading={updateMutation.isPending}
                className="shadow-md shadow-emerald-600/20"
              >
                <CheckCircle2 size={16} /> Cerrar caso
              </Button>
            )}
            <Select
              value={normalizeCaseStatus(caseItem.status)}
              onChange={(v) => updateMutation.mutate({ status: v as CaseStatus })}
              options={CASE_STATUS_DEFINITIONS.map((s) => ({ value: s.id, label: s.label }))}
              className="w-52"
              size="sm"
            />
            {currentUser.role === 'admin' && (
              <Select
                value={caseItem.assigned_to}
                onChange={(v) => {
                  const analyst = DEMO_USERS.find((u) => u.id === v);
                  updateMutation.mutate({ assigned_to: v, assigned_name: analyst?.full_name });
                }}
                options={DEMO_USERS.filter((u) => u.role === 'analyst').map((u) => ({
                  value: u.id,
                  label: u.full_name,
                }))}
                className="w-36"
                size="sm"
              />
            )}
          </div>
        )}
      </div>

      {/* Resumen y tareas — lo primero que ve el analista */}
      <Card className="border-violet-200/60 dark:border-violet-800/40 bg-gradient-to-br from-violet-50/80 to-white dark:from-violet-950/20 dark:to-slate-900">
        <div className="flex items-start gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center shrink-0">
            <Sparkles size={18} className="text-violet-600 dark:text-violet-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Resumen del correo
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Extraído automáticamente al recibir el correo
            </p>
          </div>
        </div>

        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-5">
          {caseItem.ai_summary || 'Sin resumen disponible. El análisis se generará al sincronizar correos.'}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
              <ListTodo size={14} /> Tareas y acciones ({actionItems.length})
            </h3>
            {actionItems.length > 0 ? (
              <ol className="space-y-2">
                {actionItems.map((task, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-300"
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/50 text-[10px] font-bold text-violet-700 dark:text-violet-300">
                      {i + 1}
                    </span>
                    <span className="leading-snug pt-0.5">{task}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-slate-400 italic">No se detectaron tareas específicas.</p>
            )}
          </div>

          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
              <CalendarClock size={14} /> Fechas detectadas
            </h3>
            {deadlines.length > 0 ? (
              <ul className="space-y-2">
                {deadlines.map((d, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300"
                  >
                    <AlertTriangle size={14} className="text-amber-500 shrink-0" />
                    {d}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-400 italic">Sin fechas límite detectadas en el correo.</p>
            )}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
              <Mail size={16} /> Contenido del correo
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex gap-2">
                <span className="text-slate-400 w-20 shrink-0">De:</span>
                <span className="text-slate-900 dark:text-white">
                  {caseItem.sender_name ? `${caseItem.sender_name} <${caseItem.sender}>` : caseItem.sender}
                </span>
              </div>
              <div className="flex gap-2">
                <span className="text-slate-400 w-20 shrink-0">Asunto:</span>
                <span className="text-slate-900 dark:text-white">{caseItem.subject}</span>
              </div>
              <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-4">
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {caseItem.body}
                </p>
              </div>
            </div>
          </Card>

          {canEdit && (
            <Card>
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                Observaciones
              </h2>
              <textarea
                key={`${caseItem.id}-${caseItem.updated_at}`}
                defaultValue={caseItem.observations || ''}
                onBlur={(e) => {
                  if (e.target.value !== (caseItem.observations || '')) {
                    updateMutation.mutate({ observations: e.target.value });
                  }
                }}
                placeholder="Agregar notas operativas..."
                rows={3}
                className="w-full text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
              />
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Detalles</h2>
            <div className="space-y-4">
              <DetailRow icon={User} label="Responsable" value={caseItem.assigned_name} />
              <DetailRow icon={Clock} label="Tiempo transcurrido" value={formatElapsed(caseItem.received_at, caseItem.closed_at)} />
              <DetailRow icon={Clock} label="Tiempo abierto" value={formatResponseTime(getOpenTimeHours(caseItem))} />
              {caseItem.started_at && (
                <DetailRow
                  icon={Clock}
                  label="Tiempo en gestión"
                  value={formatResponseTime(getManagementTimeHours(caseItem))}
                />
              )}
              {caseItem.response_time != null && (
                <DetailRow icon={Clock} label="Resolución total" value={formatResponseTime(getResolutionTimeHours(caseItem) ?? caseItem.response_time)} />
              )}
              {caseItem.assigned_at && (
                <DetailRow
                  icon={Clock}
                  label="Asignado"
                  value={formatDate(caseItem.assigned_at, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                />
              )}
              {caseItem.closed_at && (
                <DetailRow icon={Clock} label="Cerrado" value={formatDate(caseItem.closed_at, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })} />
              )}
            </div>
          </Card>

          <Card>
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
              <History size={16} /> Historial
            </h2>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {(history?.items || []).map((entry) => (
                <div key={entry.id} className="relative pl-4 border-l-2 border-slate-200 dark:border-slate-700">
                  <p className="text-xs text-slate-700 dark:text-slate-300">{entry.action}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {entry.performed_by_name} · {formatDate(entry.created_at, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon size={16} className="text-slate-400 mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-sm font-medium text-slate-900 dark:text-white mt-0.5">{value}</p>
      </div>
    </div>
  );
}
