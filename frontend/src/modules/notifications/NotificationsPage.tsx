import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck, Sparkles, ChevronDown, ChevronUp, RotateCw, Mail, Clock, Calendar, Brain, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { notificationsApi, summaryApi } from '@/services/api';
import { cn, formatDate } from '@/lib/utils';
import type { Notification, DailySummary } from '@/types';

function SummaryCard({ summary, onRead }: { summary: DailySummary; onRead: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);

  const dateLabel = (() => {
    const d = new Date(summary.summary_date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'Hoy';
    if (d.toDateString() === yesterday.toDateString()) return 'Ayer';
    return d.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });
  })();

  const highlights = summary.key_highlights?.split('|').map((h) => h.trim()).filter(Boolean) || [];

  return (
    <Card
      className={cn(
        'overflow-hidden transition-all duration-200',
        !summary.is_read ? 'border-purple-300 dark:border-purple-700 ring-1 ring-purple-200 dark:ring-purple-800/50' : '',
      )}
    >
      <div className="p-4 max-w-full overflow-hidden">
        <div className="flex items-start gap-3">
          <div className={cn(
            'p-2 rounded-xl shrink-0',
            !summary.is_read ? 'bg-purple-100 dark:bg-purple-900/30' : 'bg-neutral-100 dark:bg-neutral-800',
          )}>
            <Brain size={18} className={!summary.is_read ? 'text-purple-600 dark:text-purple-400' : 'text-neutral-400'} />
          </div>
          <div className="flex-1 min-w-0 max-w-full">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={cn(
                'text-sm font-semibold truncate max-w-full',
                !summary.is_read ? 'text-neutral-900 dark:text-white' : 'text-neutral-600 dark:text-neutral-400',
              )}>
                Resumen {dateLabel}
              </span>
              {!summary.is_read && <span className="h-2 w-2 rounded-full bg-purple-500 shrink-0" />}
              <Badge variant="info" className="text-[10px] shrink-0 ml-auto">{summary.email_count} correos</Badge>
            </div>

            <p className={cn(
              'text-sm leading-relaxed break-words max-w-full',
              !summary.is_read ? 'text-neutral-700 dark:text-neutral-300' : 'text-neutral-500 dark:text-neutral-400',
            )}>
              {summary.summary_text}
            </p>

            {highlights.length > 0 && (
              <div className="mt-3 space-y-1 max-w-full">
                {highlights.map((h, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs max-w-full">
                    <span className="h-1.5 w-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                    <span className="text-neutral-600 dark:text-neutral-400 break-words">{h}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 mt-3 text-[11px] text-neutral-400">
              <span className="flex items-center gap-1">
                <Calendar size={11} />
                {dateLabel}
              </span>
              {summary.categories && (
                <span className="flex items-center gap-1 truncate max-w-full">
                  <Mail size={11} />
                  <span className="truncate">{summary.categories}</span>
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1 shrink-0">
            {!summary.is_read && (
              <Button variant="ghost" size="sm" className="text-[10px] h-7 px-2 whitespace-nowrap" onClick={() => onRead(summary.id)}>
                <CheckCircle2 size={12} className="mr-1" /> Leído
              </Button>
            )}
            {highlights.length > 0 && (
              <Button variant="ghost" size="sm" className="text-[10px] h-7 px-2" onClick={() => setExpanded(!expanded)}>
                {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

export function NotificationsPage() {
  const queryClient = useQueryClient();
  const [generating, setGenerating] = useState(false);

  const { data: notifData, isLoading: notifLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.list(),
  });

  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ['daily-summaries'],
    queryFn: () => summaryApi.list(30),
  });

  const notifications: Notification[] = notifData?.data?.items || [];
  const unreadCount = notifData?.data?.unread_count || 0;
  const summaries: DailySummary[] = summaryData?.data || [];

  const markNotifRead = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllRead = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markSummaryRead = useMutation({
    mutationFn: (id: string) => summaryApi.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['daily-summaries'] }),
  });

  const handleGenerateToday = useCallback(async () => {
    setGenerating(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      await summaryApi.generateDaily(today);
      queryClient.invalidateQueries({ queryKey: ['daily-summaries'] });
    } catch {}
    setGenerating(false);
  }, [queryClient]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'urgent': return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default: return <Bell className="h-5 w-5 text-blue-500" />;
    }
  };

  const isLoading = notifLoading || summaryLoading;

  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white tracking-tight">Resumen diario</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Resúmenes automáticos de tus correos para que no tengas que abrir uno por uno
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={() => markAllRead.mutate()}>
              <CheckCheck size={16} />
            </Button>
          )}
          <Button variant="secondary" size="sm" onClick={handleGenerateToday} loading={generating} className="whitespace-nowrap">
            <Sparkles size={14} /> Resumir hoy
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : (
        <div className="space-y-3">
          {summaries.length === 0 ? (
            <Card>
              <div className="flex flex-col items-center py-16 text-neutral-400">
                <Brain className="h-12 w-12 mb-4 text-purple-300 dark:text-purple-600" />
                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-300">Sin resúmenes aún</p>
                <p className="text-xs mt-1 mb-6 text-center max-w-sm">
                  Presiona "Resumir hoy" para generar un resumen con IA de todos los correos que te llegaron hoy.
                </p>
                <Button onClick={handleGenerateToday} loading={generating}>
                  <Sparkles size={14} /> Generar resumen de hoy
                </Button>
              </div>
            </Card>
          ) : (
            <>
              {summaries.map((summary) => (
                <SummaryCard
                  key={summary.id}
                  summary={summary}
                  onRead={(id) => markSummaryRead.mutate(id)}
                />
              ))}
            </>
          )}

          {/* Traditional notifications */}
          {notifications.length > 0 && (
            <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800">
              <h2 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Bell size={14} />
                Notificaciones
                {unreadCount > 0 && (
                  <span className="text-xs font-normal text-neutral-400">({unreadCount} sin leer)</span>
                )}
              </h2>
              <div className="space-y-2">
                {notifications.map((notif) => (
                  <Card
                    key={notif.id}
                    className={cn(
                      'flex items-start gap-3 p-3',
                      !notif.is_read && 'border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-950/20'
                    )}
                    onClick={() => { if (!notif.is_read) markNotifRead.mutate(notif.id); }}
                    hover
                  >
                    <div className="mt-0.5">{getIcon(notif.notification_type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={cn('text-sm truncate max-w-full', !notif.is_read ? 'font-semibold text-neutral-900 dark:text-white' : 'text-neutral-600 dark:text-neutral-400')}>
                          {notif.title}
                        </span>
                        {!notif.is_read && <div className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />}
                      </div>
                      {notif.message && (
                        <p className="text-xs text-neutral-500 mt-0.5 truncate max-w-full">{notif.message}</p>
                      )}
                      <p className="text-[11px] text-neutral-400 mt-1">
                        <Clock size={10} className="inline mr-1" />
                        {formatDate(notif.created_at)}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
