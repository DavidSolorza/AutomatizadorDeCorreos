import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Sparkles, Shield, User, ToggleLeft, ToggleRight } from 'lucide-react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { rulesApi } from '@/services/api';
import { ruleSchema, type RuleForm } from '@/types/schemas';
import type { Rule } from '@/types';
import { CASE_CATEGORY_LABELS, type CaseCategory } from '@/types/cases';
import { DEMO_USERS } from '@/config';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/Toast';

const PRIORITY_LABELS: Record<string, string> = {
  urgente: 'Urgente',
  alto: 'Alta',
  medio: 'Media',
  bajo: 'Baja',
};

const PRIORITY_COLORS: Record<string, string> = {
  urgente: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-200',
  alto: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200',
  medio: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200',
  bajo: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200',
};

const FIELD_LABELS: Record<string, string> = {
  domain: 'Dominio del remitente',
  sender: 'Correo remitente',
  sender_name: 'Nombre remitente',
  subject: 'Asunto',
  body_plain: 'Contenido del correo',
  recipient: 'Destinatario',
};

const OPERATOR_LABELS: Record<string, string> = {
  contains: 'contiene',
  not_contains: 'no contiene',
  equals: 'es igual a',
  starts_with: 'empieza con',
  ends_with: 'termina con',
  regex: 'coincide con regex',
};

const ANALYSTS = DEMO_USERS.filter((u) => u.role === 'analyst');

const INSURANCE_CATEGORIES = Object.keys(CASE_CATEGORY_LABELS) as CaseCategory[];

function getAnalystName(id: string | null | undefined): string | null {
  if (!id) return null;
  return DEMO_USERS.find((u) => u.id === id)?.full_name ?? id;
}

interface RulesEditorProps {
  canEdit?: boolean;
}

export function RulesEditor({ canEdit = true }: RulesEditorProps) {
  const queryClient = useQueryClient();
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [showForm, setShowForm] = useState(false);

  const { data: rules, isLoading } = useQuery({
    queryKey: ['rules'],
    queryFn: () => rulesApi.list(),
  });

  const rulesList: Rule[] = rules?.data || [];

  const deleteMutation = useMutation({
    mutationFn: (id: string) => rulesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rules'] });
      toast('success', 'Regla eliminada');
    },
    onError: () => toast('error', 'No se pudo eliminar la regla'),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      rulesApi.update(id, { is_active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rules'] }),
    onError: () => toast('error', 'No se pudo actualizar la regla'),
  });

  const seedMutation = useMutation({
    mutationFn: () => rulesApi.seed(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rules'] });
      toast('success', 'Reglas de seguros cargadas');
    },
    onError: () => toast('error', 'Error al cargar reglas predeterminadas'),
  });

  const openCreate = () => {
    setEditingRule(null);
    setShowForm(true);
  };

  const openEdit = (rule: Rule) => {
    setEditingRule(rule);
    setShowForm(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs text-slate-500">
          Define condiciones y asigna automáticamente categoría y analista responsable.
        </p>
        {canEdit && (
          <div className="flex gap-2">
            {rulesList.length === 0 && (
              <Button variant="secondary" size="sm" onClick={() => seedMutation.mutate()} loading={seedMutation.isPending}>
                <Sparkles size={14} /> Cargar reglas base
              </Button>
            )}
            <Button size="sm" onClick={openCreate}>
              <Plus size={14} /> Nueva regla
            </Button>
          </div>
        )}
      </div>

      {showForm && canEdit && (
        <RuleFormCard
          rule={editingRule}
          onClose={() => { setShowForm(false); setEditingRule(null); }}
          onSuccess={() => {
            setShowForm(false);
            setEditingRule(null);
            queryClient.invalidateQueries({ queryKey: ['rules'] });
            toast('success', editingRule ? 'Regla actualizada' : 'Regla creada');
          }}
        />
      )}

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : rulesList.length === 0 ? (
        <div className="py-10 text-center text-slate-400">
          <Shield className="h-10 w-10 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Sin reglas configuradas</p>
          <p className="text-xs mt-1 mb-4">Crea una regla o carga las predeterminadas de seguros</p>
          {canEdit && (
            <Button size="sm" onClick={openCreate}>
              <Plus size={14} /> Crear primera regla
            </Button>
          )}
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800 -mx-5">
          {rulesList.map((rule) => (
            <div key={rule.id} className="flex items-start gap-3 px-5 py-3.5 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
              {canEdit ? (
                <button
                  type="button"
                  onClick={() => toggleMutation.mutate({ id: rule.id, is_active: !rule.is_active })}
                  className="mt-0.5 text-slate-400 hover:text-blue-600 transition-colors"
                  title={rule.is_active ? 'Desactivar' : 'Activar'}
                >
                  {rule.is_active ? <ToggleRight size={20} className="text-emerald-500" /> : <ToggleLeft size={20} />}
                </button>
              ) : (
                <div className="mt-0.5 w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700" />
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{rule.name}</p>
                  <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium border', PRIORITY_COLORS[rule.priority] || PRIORITY_COLORS.medio)}>
                    {PRIORITY_LABELS[rule.priority] || 'Media'}
                  </span>
                  {!rule.is_active && <Badge variant="default">Inactiva</Badge>}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Si <span className="font-medium text-slate-700 dark:text-slate-300">{FIELD_LABELS[rule.field] || rule.field}</span>{' '}
                  {OPERATOR_LABELS[rule.operator] || rule.operator}{' '}
                  <span className="font-mono text-violet-600 dark:text-violet-400">"{rule.value}"</span>
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  {rule.category && (
                    <Badge variant="info">
                      {CASE_CATEGORY_LABELS[rule.category as CaseCategory] || rule.category}
                    </Badge>
                  )}
                  {rule.assigned_to && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                      <User size={11} />
                      Asignar a <strong className="text-slate-700 dark:text-slate-300">{getAnalystName(rule.assigned_to)}</strong>
                    </span>
                  )}
                </div>
              </div>

              {canEdit && (
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(rule)}>
                    <Pencil size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-600"
                    onClick={() => deleteMutation.mutate(rule.id)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RuleFormCard({
  rule,
  onClose,
  onSuccess,
}: {
  rule: Rule | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RuleForm>({
    resolver: zodResolver(ruleSchema),
    defaultValues: rule
      ? {
          name: rule.name,
          description: rule.description || '',
          field: rule.field as RuleForm['field'],
          operator: rule.operator as RuleForm['operator'],
          value: rule.value,
          category: rule.category || '',
          assigned_to: rule.assigned_to || '',
          priority: rule.priority as RuleForm['priority'],
          is_active: rule.is_active,
        }
      : {
          name: '',
          field: 'subject',
          operator: 'contains',
          value: '',
          category: 'cotizaciones',
          assigned_to: 'paula',
          priority: 'medio',
          is_active: true,
        },
  });

  const onSubmit: SubmitHandler<RuleForm> = async (data) => {
    setError('');
    const payload = {
      ...data,
      category: data.category || undefined,
      assigned_to: data.assigned_to || undefined,
      description: data.description || undefined,
    };
    try {
      if (rule) {
        await rulesApi.update(rule.id, payload);
      } else {
        await rulesApi.create(payload);
      }
      onSuccess();
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(detail || 'Error al guardar regla');
    }
  };

  return (
    <Card className="border-violet-200/60 dark:border-violet-800/40 bg-violet-50/30 dark:bg-violet-950/10">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
          {rule ? 'Editar regla' : 'Nueva regla de automatización'}
        </h3>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-sm text-red-600">{error}</div>
        )}

        <Input label="Nombre de la regla" placeholder="Ej: Cotizaciones → Paula" {...register('name')} error={errors.name?.message} />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Campo</label>
            <select {...register('field')} className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm dark:bg-slate-800 dark:border-slate-700">
              <option value="subject">Asunto</option>
              <option value="body_plain">Contenido</option>
              <option value="sender">Correo remitente</option>
              <option value="sender_name">Nombre remitente</option>
              <option value="domain">Dominio remitente</option>
              <option value="recipient">Destinatario</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Operador</label>
            <select {...register('operator')} className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm dark:bg-slate-800 dark:border-slate-700">
              <option value="contains">Contiene</option>
              <option value="not_contains">No contiene</option>
              <option value="equals">Es igual a</option>
              <option value="starts_with">Empieza con</option>
              <option value="ends_with">Termina con</option>
              <option value="regex">Expresión regular</option>
            </select>
          </div>
          <Input label="Valor a buscar" placeholder='Ej: cotización' {...register('value')} error={errors.value?.message} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Categoría del caso</label>
            <select {...register('category')} className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm dark:bg-slate-800 dark:border-slate-700">
              <option value="">Sin categoría</option>
              {INSURANCE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{CASE_CATEGORY_LABELS[cat]}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Asignar a analista</label>
            <select {...register('assigned_to')} className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm dark:bg-slate-800 dark:border-slate-700">
              <option value="">Automático por categoría</option>
              {ANALYSTS.map((a) => (
                <option key={a.id} value={a.id}>{a.full_name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Prioridad del correo</label>
            <select {...register('priority')} className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm dark:bg-slate-800 dark:border-slate-700">
              <option value="urgente">Urgente</option>
              <option value="alto">Alta</option>
              <option value="medio">Media</option>
              <option value="bajo">Baja</option>
            </select>
          </div>
        </div>

        <Input label="Descripción (opcional)" placeholder="Ej: Toda cotización va directo a Paula" {...register('description')} />

        {rule && (
          <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
            <input type="checkbox" {...register('is_active')} className="rounded border-slate-300" />
            Regla activa
          </label>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>Cancelar</Button>
          <Button type="submit" size="sm" loading={isSubmitting}>
            {rule ? 'Guardar cambios' : 'Crear regla'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
