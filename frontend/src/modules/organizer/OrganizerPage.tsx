import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Trash2, Clock, Calendar,
  Layers, CheckCircle2,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { emailsApi, tasksApi } from '@/services/api';
import { cn, formatDate } from '@/lib/utils';
import type { Task, Email } from '@/types';

const KANBAN_COLUMNS = [
  { id: 'pending', label: 'Pendiente', color: 'bg-amber-500', countColor: 'text-amber-600 dark:text-amber-400' },
  { id: 'in_progress', label: 'En proceso', color: 'bg-blue-500', countColor: 'text-blue-600 dark:text-blue-400' },
  { id: 'done', label: 'Hecho', color: 'bg-emerald-500', countColor: 'text-emerald-600 dark:text-emerald-400' },
  { id: 'urgent', label: 'Urgente', color: 'bg-red-500', countColor: 'text-red-600 dark:text-red-400' },
] as const;

export function OrganizerPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [expandedTask, setExpandedTask] = useState<string | null>(null);

  const { data: tasksData, isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', 'all'],
    queryFn: () => tasksApi.list({ size: 200 }).then(r => r.data),
    refetchInterval: 15000,
  });

  const { data: emailsData } = useQuery({
    queryKey: ['emails', 'kanban'],
    queryFn: () => emailsApi.list({ size: 500 }).then(r => r.data),
  });

  const updateTask = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => tasksApi.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks', 'all'] });
      const previousData = queryClient.getQueryData(['tasks', 'all']);
      queryClient.setQueryData(['tasks', 'all'], (old: any) => {
        if (!old?.items) return old;
        return {
          ...old,
          items: old.items.map((t: Task) =>
            t.id === id ? { ...t, ...data } : t
          ),
        };
      });
      return { previousData };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['tasks', 'all'], context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const deleteTask = useMutation({
    mutationFn: (id: string) => tasksApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const emails: Email[] = emailsData?.items || [];
  const tasks: Task[] = tasksData?.items || [];

  const getTasksByStatus = (status: string) => {
    if (status === 'urgent') {
      return tasks.filter(t => t.status === 'pending' && t.priority === 'urgente');
    }
    if (status === 'done') {
      return tasks.filter(t => t.status === 'done');
    }
    return tasks.filter(t => t.status === status && t.priority !== 'urgente');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white tracking-tight">Centro de tareas</h1>
          <p className="text-sm text-neutral-500 mt-1">{tasks.length} tareas · {emails.length} correos</p>
        </div>
        <div className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1">
          <button
            onClick={() => setView('kanban')}
            className={cn('px-3 py-1.5 text-xs font-medium rounded-md transition-all', view === 'kanban' ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300')}
          >
            Kanban
          </button>
          <button
            onClick={() => setView('list')}
            className={cn('px-3 py-1.5 text-xs font-medium rounded-md transition-all', view === 'list' ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300')}
          >
            Lista
          </button>
        </div>
      </div>

      {view === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {KANBAN_COLUMNS.map(column => {
            const colTasks = getTasksByStatus(column.id);
            return (
              <div key={column.id} className="bg-neutral-50 dark:bg-neutral-900/50 rounded-xl p-4 min-h-[300px]">
                <div className="flex items-center gap-2 mb-4">
                  <div className={cn('h-2.5 w-2.5 rounded-full shrink-0', column.color)} />
                  <span className="text-sm font-semibold text-neutral-900 dark:text-white">{column.label}</span>
                  <span className={cn('text-xs ml-auto font-medium', column.countColor)}>{colTasks.length}</span>
                </div>
                <AnimatePresence mode="popLayout">
                  {colTasks.map(task => (
<motion.div
  key={task.id}
  layout
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -10 }}
  className="mb-2"
>
                      <Card className="p-3 cursor-pointer hover:shadow-md transition-all group"
                        onClick={() => {
                          if (task.email_id) navigate(`/emails/${task.email_id}`);
                        }}
                      >
                        <div className="flex items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">{task.title}</p>
                            {task.description && (
                              <p className="text-xs text-neutral-500 mt-1 line-clamp-2">{task.description}</p>
                            )}
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteTask.mutate(task.id); }}
                            className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-red-500 transition-all shrink-0"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                          {task.priority === 'urgente' && (
                            <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-[10px]">Urgente</Badge>
                          )}
                          {task.priority === 'alto' && (
                            <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 text-[10px]">Alto</Badge>
                          )}
                          {task.tags && (
                            <Badge className="bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 text-[10px] max-w-[120px]"><span className="truncate">{task.tags}</span></Badge>
                          )}
                          {task.due_date && (
                            <span className="text-[10px] text-neutral-400 ml-auto flex items-center gap-1">
                              <Calendar size={10} />
                              {formatDate(task.due_date)}
                            </span>
                          )}
                          {task.source === 'auto_detect' && (
                            <span className="text-[10px] text-blue-500 ml-auto">auto</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 mt-2">
                          <select
                            value={task.status}
                            onChange={(e) => updateTask.mutate({ id: task.id, data: { status: e.target.value } })}
                            onClick={(e) => e.stopPropagation()}
                            className="text-[10px] bg-transparent border border-neutral-200 dark:border-neutral-700 rounded-md px-1.5 py-0.5 text-neutral-500 focus:outline-none cursor-pointer"
                          >
                            <option value="pending">Pendiente</option>
                            <option value="in_progress">En proceso</option>
                            <option value="done">Hecho</option>
                          </select>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                  {colTasks.length === 0 && (
                    <div className="flex flex-col items-center py-8 text-neutral-400">
                      <Layers size={24} className="mb-2 text-neutral-300 dark:text-neutral-600" />
                      <p className="text-xs">Vacío</p>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map(task => (
            <Card key={task.id} className="p-4 hover:shadow-md transition-all cursor-pointer" onClick={() => { if (task.email_id) navigate(`/emails/${task.email_id}`); }}>
              <div className="flex items-center gap-3">
                  <div className={cn(
                    'h-2.5 w-2.5 rounded-full shrink-0',
                    task.status === 'done' ? 'bg-emerald-500' : task.priority === 'urgente' ? 'bg-red-500' : task.priority === 'alto' ? 'bg-orange-500' : task.status === 'in_progress' ? 'bg-blue-500' : 'bg-amber-500'
                  )} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn('text-sm truncate max-w-full', task.status === 'done' ? 'line-through text-neutral-400' : 'font-medium text-neutral-900 dark:text-white')}>{task.title}</span>
                      {task.priority === 'urgente' && <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-[10px] shrink-0">Urgente</Badge>}
                      {task.priority === 'alto' && <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 text-[10px] shrink-0">Alto</Badge>}
                      {task.tags && <Badge className="bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 text-[10px] max-w-[120px] shrink-0"><span className="truncate">{task.tags}</span></Badge>}
                  </div>
                  {task.description && <p className="text-xs text-neutral-500 mt-0.5">{task.description}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <select
                    value={task.status}
                    onChange={(e) => updateTask.mutate({ id: task.id, data: { status: e.target.value } })}
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs bg-transparent border border-neutral-200 dark:border-neutral-700 rounded-md px-2 py-1 text-neutral-500 focus:outline-none cursor-pointer"
                  >
                    <option value="pending">Pendiente</option>
                    <option value="in_progress">En proceso</option>
                    <option value="done">Hecho</option>
                  </select>
                  <button onClick={(e) => { e.stopPropagation(); deleteTask.mutate(task.id); }} className="text-neutral-400 hover:text-red-500 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
          {tasks.length === 0 && !tasksLoading && (
            <div className="flex flex-col items-center py-24 text-neutral-400">
              <CheckCircle2 size={48} className="mb-4 text-neutral-300 dark:text-neutral-600" />
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-300">No hay tareas aún</p>
              <p className="text-xs mt-1">Las tareas se crean automáticamente al detectar palabras clave en los correos</p>
            </div>
          )}
          {tasksLoading && (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 bg-neutral-100 dark:bg-neutral-800 rounded-xl animate-pulse" />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
