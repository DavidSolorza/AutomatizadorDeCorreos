import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, ChevronLeft, ChevronRight, Mail, Star, X, Pin, Archive } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmailSkeleton } from '@/components/ui/Skeleton';
import { emailsApi } from '@/services/api';
import { formatDate, truncate, getCategoryColor, cn } from '@/lib/utils';
import { useEmailStore } from '@/store';
import type { Email } from '@/types';

export function EmailsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { selectedIds, toggleSelect, clearSelection } = useEmailStore();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const senderFilter = searchParams.get('sender') || '';
  const isPinned = searchParams.get('is_pinned');
  const isArchived = searchParams.get('is_archived');
  const isStarred = searchParams.get('is_starred');
  const categoryFilter = searchParams.get('category') || '';

  const activeFilters = useMemo(() => {
    const filters: { key: string; label: string; onClear: () => void }[] = [];
    if (senderFilter) filters.push({ key: 'sender', label: `De: ${senderFilter}`, onClear: () => { const p = new URLSearchParams(searchParams); p.delete('sender'); setSearchParams(p); } });
    if (isPinned) filters.push({ key: 'is_pinned', label: 'Fijados', onClear: () => { const p = new URLSearchParams(searchParams); p.delete('is_pinned'); setSearchParams(p); } });
    if (isStarred) filters.push({ key: 'is_starred', label: 'Destacados', onClear: () => { const p = new URLSearchParams(searchParams); p.delete('is_starred'); setSearchParams(p); } });
    if (isArchived === 'true') filters.push({ key: 'is_archived', label: 'Archivados', onClear: () => { const p = new URLSearchParams(searchParams); p.delete('is_archived'); setSearchParams(p); } });
    if (categoryFilter) filters.push({ key: 'category', label: `Categoría: ${categoryFilter}`, onClear: () => { const p = new URLSearchParams(searchParams); p.delete('category'); setSearchParams(p); } });
    return filters;
  }, [senderFilter, isPinned, isArchived, isStarred, categoryFilter, searchParams, setSearchParams]);

  const pageTitle = activeFilters.length > 0 ? activeFilters[0].label : 'Correos';

  const { data, isLoading } = useQuery({
    queryKey: ['emails', page, search, categoryFilter, senderFilter, isPinned, isArchived, isStarred],
    queryFn: () => emailsApi.list({
      page, size: 20,
      query: search || undefined,
      category: categoryFilter || undefined,
      sender: senderFilter || undefined,
      is_pinned: isPinned === 'true' || undefined,
      is_archived: isArchived === 'true' || (isArchived === 'false' ? false : undefined),
      is_starred: isStarred === 'true' || undefined,
    }),
  });

  const emails = data?.data?.items || [];
  const total = data?.data?.total || 0;
  const pages = data?.data?.pages || 1;

  const clearAll = () => {
    setSearchParams({});
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start sm:items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white tracking-tight truncate">{pageTitle}</h1>
          <p className="text-sm text-neutral-500 mt-1">{total} correos encontrados</p>
        </div>
        <div className="flex items-center gap-2">
          {activeFilters.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearAll}>
              <X size={14} /> Limpiar filtros
            </Button>
          )}
          {selectedIds.length > 0 && (
            <>
              <span className="text-sm text-neutral-500">{selectedIds.length} seleccionados</span>
              <Button variant="ghost" size="sm" onClick={clearSelection}>Limpiar</Button>
            </>
          )}
        </div>
      </div>

      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeFilters.map((f) => (
            <Badge key={f.key} className="flex items-center gap-1 pr-1 max-w-full">
              <span className="truncate max-w-[180px] sm:max-w-[300px]">{f.label}</span>
              <button onClick={f.onClear} className="ml-1 shrink-0 hover:text-neutral-900 dark:hover:text-white transition-colors">
                <X size={12} />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            placeholder='Buscar correos... (from:, has:attachment, category:, etc.)'
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full h-10 pl-10 pr-4 rounded-lg border border-neutral-200 bg-white text-sm dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-300 dark:focus:ring-neutral-600 transition-all"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => { setSearchParams(e.target.value ? { category: e.target.value } : {}); setPage(1); }}
          className="h-10 px-3 rounded-lg border border-neutral-200 bg-white text-sm dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-300"
        >
          <option value="">Todas las categorías</option>
          <option value="universidad">Universidad</option>
          <option value="urgente">Urgente</option>
          <option value="trabajo">Trabajo</option>
          <option value="personal">Personal</option>
          <option value="pagos">Pagos</option>
          <option value="reuniones">Reuniones</option>
          <option value="no_deseado">No deseados</option>
        </select>
      </div>

      {isLoading ? (
        <EmailSkeleton />
      ) : emails.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center py-20 text-neutral-400">
            <Mail className="h-12 w-12 mb-4" />
            <p className="text-sm font-medium text-neutral-600 dark:text-neutral-300">No hay correos</p>
            <p className="text-xs mt-1">
              {activeFilters.length > 0 ? 'Prueba quitando algunos filtros' : 'Conecta tu Gmail y sincroniza para ver tus correos aquí'}
            </p>
          </div>
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {emails.map((email: Email) => (
              <div
                key={email.id}
                onClick={() => navigate(`/emails/${email.id}`)}
                className={cn(
                  'flex items-start gap-3 p-3 sm:p-4 transition-colors cursor-pointer group',
                  'hover:bg-neutral-50 dark:hover:bg-neutral-800/50',
                  !email.is_read && 'bg-neutral-50/50 dark:bg-neutral-800/30',
                  selectedIds.includes(email.id) && 'bg-blue-50/50 dark:bg-blue-900/10'
                )}
              >
                <div className="flex items-center gap-1.5 pt-1 shrink-0">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(email.id)}
                    onChange={(e) => { e.stopPropagation(); toggleSelect(email.id); }}
                    className="h-4 w-4 rounded border-neutral-300 dark:border-neutral-600"
                  />
                  <button
                    onClick={(e) => { e.stopPropagation(); }}
                    className="text-neutral-300 hover:text-yellow-500 transition-colors"
                  >
                    <Star size={14} className={email.is_starred ? 'fill-yellow-500 text-yellow-500' : ''} />
                  </button>
                </div>

                <div className="h-9 w-9 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-xs font-medium text-neutral-600 dark:text-neutral-300 shrink-0 relative">
                  {(email.sender_name || email.sender).charAt(0).toUpperCase()}
                  {email.is_pinned && <Pin size={8} className="absolute -top-1 -right-1 text-amber-500 fill-amber-500" />}
                </div>

                <div className="flex-1 min-w-0 max-w-full">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn('text-sm truncate max-w-full', !email.is_read ? 'font-semibold text-neutral-900 dark:text-white' : 'text-neutral-700 dark:text-neutral-300')}>
                      {email.sender_name || email.sender.split('@')[0]}
                    </span>
                    {email.category && (
                      <Badge className={cn('text-[10px] px-1.5 py-0 shrink-0', getCategoryColor(email.category))}>
                        {email.category}
                      </Badge>
                    )}
                    {email.is_archived && <Archive size={12} className="text-neutral-400 shrink-0" />}
                  </div>
                  <p className={cn('text-sm truncate mt-0.5', !email.is_read ? 'font-medium text-neutral-900 dark:text-white' : 'text-neutral-600 dark:text-neutral-400')}>
                    {email.subject || 'Sin asunto'}
                  </p>
                  <p className="text-xs text-neutral-400 truncate mt-0.5">{truncate(email.body_plain || '', 100)}</p>
                </div>

                <div className="flex flex-col items-end gap-1 shrink-0 ml-1">
                  <span className="text-[11px] text-neutral-400 whitespace-nowrap">{formatDate(email.received_at)}</span>
                  {!email.is_read && <div className="h-2 w-2 rounded-full bg-blue-500" />}
                </div>
              </div>
            ))}
          </div>

          {pages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-neutral-100 dark:border-neutral-800">
              <span className="text-xs text-neutral-500">Página {page} de {pages}</span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                  <ChevronLeft size={16} />
                </Button>
                <Button variant="ghost" size="sm" disabled={page >= pages} onClick={() => setPage((p) => Math.min(pages, p + 1))}>
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
