import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Calendar as CalendarIcon,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { emailsApi, tasksApi } from '@/services/api';
import { cn, formatDate, getCategoryColor } from '@/lib/utils';
import type { Email, Task } from '@/types';

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export function CalendarPage() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const { data: tasksData } = useQuery({
    queryKey: ['tasks', 'calendar'],
    queryFn: () => tasksApi.list({ size: 200 }).then(r => r.data),
  });

  const { data: emailsData } = useQuery({
    queryKey: ['emails', 'calendar'],
    queryFn: () => emailsApi.list({ size: 500 }).then(r => r.data),
  });

  const tasks: Task[] = tasksData?.items || [];
  const emails: Email[] = emailsData?.items || [];

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const task of tasks) {
      if (task.due_date) {
        const dateKey = task.due_date.split('T')[0];
        if (!map[dateKey]) map[dateKey] = [];
        map[dateKey].push(task);
      }
    }
    return map;
  }, [tasks]);

  const emailsByDate = useMemo(() => {
    const map: Record<string, Email[]> = {};
    for (const email of emails) {
      const dateKey = email.received_at.split('T')[0];
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(email);
    }
    return map;
  }, [emails]);

  const selectedDateItems = selectedDate ? {
    tasks: tasksByDate[selectedDate] || [],
    emails: emailsByDate[selectedDate] || [],
  } : null;

  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push({ day: prevMonthDays - firstDay + 1 + i, muted: true });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    calendarDays.push({ day: i, muted: false, dateKey, tasks: tasksByDate[dateKey] || [], emails: emailsByDate[dateKey] || [] });
  }
  while (calendarDays.length % 7 !== 0) {
    calendarDays.push({ day: calendarDays.length - firstDay - daysInMonth + 1, muted: true });
  }

  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white tracking-tight">Calendario</h1>
        <p className="text-sm text-neutral-500 mt-1">{tasks.length} tareas · {emails.length} correos</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                <ChevronLeft size={18} className="text-neutral-500" />
              </button>
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                {MONTHS[month]} {year}
              </h2>
              <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                <ChevronRight size={18} className="text-neutral-500" />
              </button>
            </div>

            <div className="grid grid-cols-7 mb-2">
              {DAYS.map(d => (
                <div key={d} className="text-center text-xs font-medium text-neutral-500 py-2">{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {calendarDays.map((day, idx) => {
                const isToday = day.dateKey === todayKey;
                const isSelected = day.dateKey === selectedDate;
                return (
                  <div
                    key={idx}
                    onClick={() => day.dateKey && setSelectedDate(day.dateKey)}
                    className={cn(
                      'min-h-[80px] p-1.5 border border-transparent hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer relative',
                      day.muted && 'opacity-30',
                      isSelected && 'bg-neutral-100 dark:bg-neutral-800 rounded-lg',
                    )}
                  >
                    <span className={cn(
                      'inline-flex items-center justify-center h-7 w-7 text-xs rounded-full',
                      isToday ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-semibold' : 'text-neutral-700 dark:text-neutral-300'
                    )}>
                      {day.day}
                    </span>
                    {day.tasks && day.tasks.length > 0 && (
                      <div className="mt-1 space-y-0.5">
                        {day.tasks.slice(0, 1).map(t => (
                          <div key={t.id} className={cn(
                            'text-[9px] px-1 py-0.5 rounded truncate font-medium',
                            t.priority === 'urgente' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                            t.priority === 'alto' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                            t.status === 'in_progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                            'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                          )}>
                            {t.title.slice(0, 16)}
                          </div>
                        ))}
                      </div>
                    )}
                    {day.emails && day.emails.length > 0 && !day.tasks?.length && (
                      <div className="flex justify-center gap-0.5 mt-1">
                        {day.emails.slice(0, 4).map((e: Email) => (
                          <div key={e.id} className={cn(
                            'h-1.5 w-1.5 rounded-full',
                            e.category === 'urgente' ? 'bg-red-500' :
                            e.category === 'universidad' ? 'bg-blue-500' :
                            e.category ? 'bg-neutral-400' : 'bg-neutral-300 dark:bg-neutral-600'
                          )} />
                        ))}
                        {day.emails.length > 4 && (
                          <span className="text-[8px] text-neutral-400 ml-0.5">+{day.emails.length - 4}</span>
                        )}
                      </div>
                    )}
                    {day.emails && day.emails.length > 0 && day.tasks && day.tasks.length > 0 && (
                      <div className="flex items-center justify-center gap-1 mt-0.5">
                        <span className="text-[8px] text-neutral-400">{day.tasks.length}t · {day.emails.length}e</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        <div>
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-4">
              {selectedDate ? formatDate(selectedDate, { day: 'numeric', month: 'long', year: 'numeric' }) : 'Selecciona un día'}
            </h3>
            {selectedDateItems ? (
              <div className="space-y-3">
                {selectedDateItems.tasks.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Tareas</h4>
                    <div className="space-y-1.5">
                      {selectedDateItems.tasks.map(task => (
                        <div key={task.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer" onClick={() => { if (task.email_id) navigate(`/emails/${task.email_id}`); }}>
                          <div className={cn(
                            'h-2 w-2 rounded-full shrink-0',
                            task.priority === 'urgente' ? 'bg-red-500' : task.priority === 'alto' ? 'bg-orange-500' : task.status === 'in_progress' ? 'bg-blue-500' : task.status === 'done' ? 'bg-emerald-500' : 'bg-amber-500'
                          )} />
                          <span className="text-xs text-neutral-700 dark:text-neutral-300 truncate">{task.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {selectedDateItems.emails.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <CalendarIcon size={12} /> Correos ({selectedDateItems.emails.length})
                    </h4>
                    <div className="space-y-1.5">
                      {selectedDateItems.emails.slice(0, 10).map(email => (
                        <div key={email.id} className="flex items-start gap-2 p-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer group" onClick={() => navigate(`/emails/${email.id}`)}>
                          <div className={cn(
                            'h-7 w-7 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5',
                            email.category === 'urgente' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                            email.category === 'universidad' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                            'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300'
                          )}>
                            {(email.sender_name || email.sender).charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300 truncate">{email.sender_name || email.sender.split('@')[0]}</span>
                              <span className="text-[10px] text-neutral-400 shrink-0">{formatDate(email.received_at)}</span>
                            </div>
                            <p className="text-[11px] text-neutral-500 truncate">{email.subject || 'Sin asunto'}</p>
                            {email.category && (
                              <Badge className={cn('text-[9px] px-1 py-0 mt-0.5', getCategoryColor(email.category))}>{email.category}</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                      {selectedDateItems.emails.length > 10 && (
                        <p className="text-xs text-neutral-400 text-center pt-1">+{selectedDateItems.emails.length - 10} correos más</p>
                      )}
                    </div>
                  </div>
                )}
                {selectedDateItems.tasks.length === 0 && selectedDateItems.emails.length === 0 && (
                  <p className="text-xs text-neutral-400 text-center py-8">Sin eventos en este día</p>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center py-12 text-neutral-400">
                <CalendarIcon size={32} className="mb-2 text-neutral-300 dark:text-neutral-600" />
                <p className="text-xs">Haz clic en un día para ver detalles</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
