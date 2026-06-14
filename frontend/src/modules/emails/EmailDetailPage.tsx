import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Trash2, Paperclip, Calendar, User, Tag, Sparkles, Loader2, CheckCircle2, Clock, Pin, Archive, Download, ListTodo, AlertTriangle, ExternalLink, Link as LinkIcon, Video, FileText, BookOpen } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { emailsApi, tasksApi } from '@/services/api';
import { formatDate, getCategoryColor, cn } from '@/lib/utils';
import { EmailViewer } from '@/components/email/EmailViewer';
import type { Email, EmailSummary } from '@/types';

interface AnalyzeResult {
  summary: string;
  action_items: string[];
  deadlines: string[];
  priority: string;
}

const LINK_ICONS: Record<string, React.ReactNode> = {
  meet: <Video size={14} />,
  classroom: <BookOpen size={14} />,
  zoom: <Video size={14} />,
  pdf: <FileText size={14} />,
};

const LINK_LABELS: Record<string, string> = {
  meet: 'Meet',
  classroom: 'Classroom',
  zoom: 'Zoom',
  pdf: 'PDF',
};

const LINK_COLORS: Record<string, string> = {
  meet: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
  classroom: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
  zoom: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
  pdf: 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400',
};

export function EmailDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['email', id],
    queryFn: () => emailsApi.get(id!),
    enabled: !!id,
  });

  const email: Email | null = data?.data;

  const { data: summaryData } = useQuery({
    queryKey: ['email-summary', id],
    queryFn: () => emailsApi.summary(id!),
    enabled: !!id && !!data?.data,
    retry: false,
  });

  const summary: EmailSummary | null = summaryData?.data;

  const { data: analyzeData, isLoading: isAnalyzing } = useQuery({
    queryKey: ['email-analyze', id],
    queryFn: () => emailsApi.analyze(id!),
    enabled: !!id && !!data?.data,
    retry: false,
  });

  const analyzeResult: AnalyzeResult | null = analyzeData?.data;

  const deleteMutation = useMutation({
    mutationFn: () => emailsApi.delete(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emails'] });
      navigate('/emails');
    },
  });

  const toggleReadMutation = useMutation({
    mutationFn: () => emailsApi.update(id!, { is_read: !email?.is_read }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['email', id] }),
  });

  const togglePinMutation = useMutation({
    mutationFn: () => emailsApi.update(id!, { is_pinned: !email?.is_pinned }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['email', id] }),
  });

  const archiveMutation = useMutation({
    mutationFn: () => emailsApi.archive(id!),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['email', id] }); navigate('/emails'); },
  });

  const detectTasksMutation = useMutation({
    mutationFn: () => tasksApi.detect(id!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-32" />
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3">
            <Card className="p-6">
              <Skeleton className="h-6 w-3/4 mb-4" />
              <Skeleton className="h-4 w-1/2 mb-6" />
              <Skeleton className="h-3 w-full mb-2" />
              <Skeleton className="h-3 w-5/6 mb-2" />
              <Skeleton className="h-3 w-4/6" />
            </Card>
          </div>
          <div className="lg:col-span-2">
            <Card className="p-6">
              <Skeleton className="h-4 w-24 mb-4" />
              <Skeleton className="h-3 w-full mb-2" />
              <Skeleton className="h-3 w-3/4" />
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!email) {
    return (
      <div className="flex flex-col items-center py-20 text-neutral-400">
        <AlertTriangle size={24} className="mb-3" />
        <p className="text-sm font-medium">Correo no encontrado</p>
        <Button variant="ghost" className="mt-4" onClick={() => navigate('/emails')}>Volver</Button>
      </div>
    );
  }

  const priorityColor = (p: string) => {
    if (p === 'urgente') return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    if (p === 'alto') return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
    if (p === 'bajo') return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
  };

  const priorityLabel = (p: string) => {
    if (p === 'urgente') return 'Urgente';
    if (p === 'alto') return 'Alta prioridad';
    if (p === 'bajo') return 'Baja prioridad';
    return 'Media prioridad';
  };

  return (
    <div className="max-w-full overflow-hidden">
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <Button variant="ghost" size="sm" onClick={() => navigate('/emails')} className="shrink-0">
          <ArrowLeft size={16} />
        </Button>
        <div className="flex-1 min-w-0" />
        <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
          <Button variant="ghost" size="sm" onClick={() => toggleReadMutation.mutate()} className="text-xs whitespace-nowrap">
            {email.is_read ? 'No leído' : 'Leído'}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => togglePinMutation.mutate()} className={cn('text-xs whitespace-nowrap', email.is_pinned ? 'text-amber-500' : '')}>
            <Pin size={14} className="sm:mr-1" />
            <span className="hidden sm:inline">{email.is_pinned ? 'Fijado' : 'Fijar'}</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => archiveMutation.mutate()} className="text-xs whitespace-nowrap">
            <Archive size={14} className="sm:mr-1" />
            <span className="hidden sm:inline">Archivar</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => detectTasksMutation.mutate()} disabled={detectTasksMutation.isPending} className="text-xs whitespace-nowrap">
            <ListTodo size={14} className="sm:mr-1" />
            {detectTasksMutation.isPending ? '...' : <span className="hidden sm:inline">Tareas</span>}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate()} className="text-red-500 text-xs whitespace-nowrap">
            <Trash2 size={14} className="sm:mr-1" />
            <span className="hidden sm:inline">Eliminar</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 min-w-0 max-w-full space-y-4">
          <Card className="p-0 overflow-hidden">
            <div className="p-4 sm:p-6 overflow-hidden max-w-full">
              {summary && (
                <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-4 mb-6 border border-neutral-100 dark:border-neutral-700/50">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles size={14} className="text-purple-500" />
                    <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Resumen rápido</span>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                      <User size={12} /> {summary.sender_name || summary.sender}
                    </span>
                    <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                      <Calendar size={12} /> {formatDate(summary.received_at)}
                    </span>
                    {summary.is_urgent && (
                      <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-medium">
                        <AlertTriangle size={12} /> Urgente
                      </span>
                    )}
                    <span className={cn('flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium', priorityColor(summary.priority))}>
                      {priorityLabel(summary.priority)}
                    </span>
                  </div>
                  {summary.important_words.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {summary.important_words.map((w, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-[11px] font-medium">{w}</span>
                      ))}
                    </div>
                  )}
                  {summary.detected_dates.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {summary.detected_dates.map((d, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[11px] font-medium flex items-center gap-1">
                          <Clock size={10} /> {d}
                        </span>
                      ))}
                    </div>
                  )}
                  {summary.links.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {summary.links.slice(0, 5).map((link, i) => {
                        let type = 'generic';
                        let icon = <LinkIcon size={10} />;
                        if (link.includes('meet.google')) { type = 'meet'; icon = <Video size={10} />; }
                        else if (link.includes('classroom.google')) { type = 'classroom'; icon = <BookOpen size={10} />; }
                        else if (link.includes('zoom.us')) { type = 'zoom'; icon = <Video size={10} />; }
                        else if (link.includes('.pdf')) { type = 'pdf'; icon = <FileText size={10} />; }
                        return (
                          <a key={i} href={link} target="_blank" rel="noopener noreferrer"
                            className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors', LINK_COLORS[type] || 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400')}>
                            {icon} {LINK_LABELS[type] || link.replace(/^https?:\/\//, '').slice(0, 20)}
                            <ExternalLink size={8} />
                          </a>
                        );
                      })}
                    </div>
                  )}
                  {summary.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {summary.attachments.map((att, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[11px] font-medium flex items-center gap-1">
                          <Download size={10} /> {att.filename}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <EmailViewer email={email} />
            </div>

            {email.attachments && email.attachments.length > 0 && (
              <div className="border-t border-neutral-100 dark:border-neutral-800 px-6 py-4">
                <div className="flex items-center gap-2 mb-3">
                  <Paperclip size={14} className="text-neutral-400" />
                  <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    {email.attachments.length} {email.attachments.length === 1 ? 'adjunto' : 'adjuntos'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {email.attachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors cursor-default"
                    >
                      <Paperclip size={12} />
                      <span className="font-medium truncate max-w-[160px] sm:max-w-[250px]">{att.filename}</span>
                      {att.size_bytes && <span className="text-neutral-400">({(att.size_bytes / 1024).toFixed(1)} KB)</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-4 min-w-0 max-w-full">
          <Card className="lg:sticky lg:top-6 overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                <Sparkles size={16} className="text-purple-500" />
                Resumen IA
              </h2>
              <Button variant="ghost" size="sm" onClick={() => detectTasksMutation.mutate()} disabled={detectTasksMutation.isPending} className="text-xs">
                <ListTodo size={14} className="mr-1" />
                {detectTasksMutation.isPending ? '...' : 'Detectar tareas'}
              </Button>
            </div>

            {isAnalyzing ? (
              <div className="flex flex-col items-center py-12 text-neutral-400">
                <Loader2 size={24} className="animate-spin mb-3" />
                <p className="text-xs">Analizando correo con IA...</p>
              </div>
            ) : analyzeResult ? (
              <div className="space-y-4">
                <div>
                  <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-medium', priorityColor(analyzeResult.priority))}>
                    {priorityLabel(analyzeResult.priority)}
                  </span>
                </div>

                <div>
                  <h3 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Resumen</h3>
                  <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">{analyzeResult.summary}</p>
                </div>

                {analyzeResult.action_items.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <CheckCircle2 size={12} /> Acciones requeridas
                    </h3>
                    <ul className="space-y-1">
                      {analyzeResult.action_items.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                          <span className="h-1.5 w-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {analyzeResult.deadlines.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Clock size={12} /> Fechas límite
                    </h3>
                    <ul className="space-y-1">
                      {analyzeResult.deadlines.map((d, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                          {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center py-12 text-neutral-400">
                <Sparkles size={24} className="mb-3" />
                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-300">No se pudo analizar</p>
                <p className="text-xs mt-1 text-center">Reintenta abriendo el correo de nuevo.</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
