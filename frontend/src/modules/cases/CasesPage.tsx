import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Briefcase, Search, ChevronUp, ChevronDown } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  Table,
  TableHead,
  TableBody,
  TableHeader,
  TableCell,
  TablePagination,
} from '@/components/ui/Table';
import { ReassignCaseModal, type ReassignCaseTarget } from '@/components/cases/ReassignCaseModal';
import { casesApi } from '@/services/api';
import { useDemoUserStore } from '@/store';
import { AnalystMailboxFilter } from '@/components/dashboard/AnalystMailboxFilter';
import { DEMO_USERS, ANALYST_IDS } from '@/config';
import { isClosedStatus } from '@/config/case-statuses';
import { toast } from '@/components/ui/Toast';
import { cn, formatDate } from '@/lib/utils';
import { formatElapsed } from '@/lib/case-utils';
import {
  CASE_CATEGORY_LABELS,
  CASE_STATUS_LABELS,
  getCategoryColor,
  getStatusBadgeVariant,
} from '@/types/cases';

export function CasesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser } = useDemoUserStore();
  const queryClient = useQueryClient();
  const [reassignTarget, setReassignTarget] = useState<ReassignCaseTarget | null>(null);

  const page = Number(searchParams.get('page') || 1);
  const status = searchParams.get('status') || '';
  const category = searchParams.get('category') || '';
  const assignedTo = searchParams.get('assigned_to') || '';
  const query = searchParams.get('query') || '';
  const sortBy = searchParams.get('sort_by') || 'received_at';
  const sortOrder = searchParams.get('sort_order') || 'desc';

  const [searchInput, setSearchInput] = useState(query);
  const isAdmin = currentUser.role === 'admin';

  const { data: allCasesForCounts } = useQuery({
    queryKey: ['cases', 'filter-counts', currentUser.id],
    queryFn: () => casesApi.list({ size: 200 }).then((r) => r.data),
    enabled: isAdmin,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['cases', 'list', currentUser.id, page, status, category, assignedTo, query, sortBy, sortOrder],
    queryFn: () =>
      casesApi
        .list({
          page,
          size: 10,
          status: status || undefined,
          category: category || undefined,
          assigned_to: assignedTo || undefined,
          query: query || undefined,
          sort_by: sortBy,
          sort_order: sortOrder,
        })
        .then((r) => r.data),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      casesApi.update(id, data),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      if (vars.data.assigned_to) {
        toast('success', 'Caso reasignado', `Nuevo responsable: ${vars.data.assigned_name}`);
        setReassignTarget(null);
      } else {
        toast('success', 'Caso actualizado');
      }
    },
    onError: () => toast('error', 'Error al actualizar el caso'),
  });

  useEffect(() => {
    setSearchInput(query);
  }, [query]);

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value && !(key === 'page' && Number(value) < 1)) params.set(key, value);
    else params.delete(key);
    if (key !== 'page') params.delete('page');
    setSearchParams(params);
  };

  const toggleSort = (field: string) => {
    if (sortBy === field) {
      updateParam('sort_order', sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      const params = new URLSearchParams(searchParams);
      params.set('sort_by', field);
      params.set('sort_order', 'desc');
      setSearchParams(params);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateParam('query', searchInput);
  };

  const openReassign = (c: { id: string; subject: string | null; assigned_to: string; assigned_name: string }) => {
    setReassignTarget({
      caseId: c.id,
      subject: c.subject || 'Sin asunto',
      assignedTo: c.assigned_to,
      assignedName: c.assigned_name,
    });
  };

  const confirmReassign = (caseId: string, analystId: string, analystName: string) => {
    updateMutation.mutate({
      id: caseId,
      data: { assigned_to: analystId, assigned_name: analystName },
    });
  };

  const SortIcon = ({ field }: { field: string }) =>
    sortBy === field ? (
      sortOrder === 'desc' ? <ChevronDown size={12} /> : <ChevronUp size={12} />
    ) : null;

  const countCases = allCasesForCounts?.items || [];
  const activeCounts = isAdmin
    ? Object.fromEntries(
        ANALYST_IDS.map((id) => [
          id,
          countCases.filter((c) => c.assigned_to === id && !isClosedStatus(c.status)).length,
        ]),
      )
    : {};
  const totalActive = countCases.filter((c) => !isClosedStatus(c.status)).length;

  const handleAnalystFilter = (analystId: string | null) => {
    updateParam('assigned_to', analystId || '');
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary tracking-tight">Casos</h1>
        <p className="text-sm text-text-secondary mt-1.5">
          {data
            ? `${data.total} casos${
                !isAdmin
                  ? ` de ${currentUser.full_name}`
                  : assignedTo
                    ? ` de ${DEMO_USERS.find((u) => u.id === assignedTo)?.full_name || 'analista'}`
                    : ' en todos los buzones'
              }`
            : isAdmin
              ? 'Gestión de operaciones derivadas de correos'
              : `Casos asignados a ${currentUser.full_name}`}
        </p>
      </div>

      {isAdmin && (
        <Card padding="sm">
          <AnalystMailboxFilter
            value={assignedTo || null}
            onChange={handleAnalystFilter}
            activeCounts={activeCounts}
            totalActive={totalActive}
          />
        </Card>
      )}

      <Card padding="sm">
        <div className="flex flex-col lg:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1 relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar por asunto, remitente..."
              className={cn(
                'w-full pl-10 pr-4 py-2.5 text-sm rounded-xl',
                'border border-border bg-bg-primary text-text-primary',
                'placeholder:text-text-secondary',
                'focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary/40',
                'transition-all duration-200',
              )}
            />
          </form>
          <div className="flex gap-3 flex-wrap">
            <Select
              value={status}
              onChange={(v) => updateParam('status', v)}
              placeholder="Estado"
              options={[
                { value: '', label: 'Todos los estados' },
                ...Object.entries(CASE_STATUS_LABELS).map(([k, v]) => ({ value: k, label: v })),
              ]}
              className="w-44"
              size="sm"
            />
            <Select
              value={category}
              onChange={(v) => updateParam('category', v)}
              placeholder="Categoría"
              options={[
                { value: '', label: 'Todas las categorías' },
                ...Object.entries(CASE_CATEGORY_LABELS)
                  .filter(([k]) => k !== 'sin_clasificar')
                  .map(([k, v]) => ({ value: k, label: v })),
              ]}
              className="w-48"
              size="sm"
            />
          </div>
        </div>
      </Card>

      <Card padding="none">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-xl" />
            ))}
          </div>
        ) : !data?.items.length ? (
          <EmptyState
            icon={Briefcase}
            title="No hay casos"
            description="No se encontraron casos con los filtros seleccionados."
          />
        ) : (
          <Table>
            <TableHead>
              <tr>
                {[
                  { key: 'received_at', label: 'Fecha ingreso' },
                  { key: 'sender', label: 'Remitente' },
                  { key: 'subject', label: 'Asunto' },
                  { key: 'category', label: 'Tipo' },
                  { key: 'assigned_to', label: 'Responsable' },
                  { key: 'status', label: 'Estado' },
                  { key: 'elapsed', label: 'Tiempo' },
                ].map((col) => (
                  <TableHeader
                    key={col.key}
                    sortable={['received_at', 'sender'].includes(col.key)}
                    onClick={() => ['received_at', 'sender'].includes(col.key) && toggleSort(col.key)}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      {['received_at', 'sender'].includes(col.key) && <SortIcon field={col.key} />}
                    </span>
                  </TableHeader>
                ))}
                {currentUser.role === 'admin' && (
                  <TableHeader className="text-right">Acciones</TableHeader>
                )}
              </tr>
            </TableHead>
            <TableBody>
              {data.items.map((c, i) => (
                <motion.tr
                  key={c.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => navigate(`/cases/${c.id}`, { state: { from: location.pathname + location.search } })}
                  className="cursor-pointer"
                >
                  <TableCell className="text-text-secondary whitespace-nowrap text-xs">
                    {formatDate(c.received_at, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </TableCell>
                  <TableCell>
                    <p className="font-medium text-text-primary truncate max-w-[140px]">
                      {c.sender_name || c.sender.split('@')[0]}
                    </p>
                    <p className="text-xs text-text-secondary truncate max-w-[140px]">{c.sender}</p>
                  </TableCell>
                  <TableCell className="max-w-[220px] truncate text-text-primary">
                    {c.subject || 'Sin asunto'}
                  </TableCell>
                  <TableCell>
                    <span className={cn('inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-medium border whitespace-nowrap', getCategoryColor(c.category))}>
                      {CASE_CATEGORY_LABELS[c.category]}
                    </span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-text-primary">
                    {c.assigned_name}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(c.status)} dot>
                      {CASE_STATUS_LABELS[c.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-text-secondary text-xs whitespace-nowrap tabular-nums">
                    {formatElapsed(c.received_at, c.closed_at)}
                  </TableCell>
                  {currentUser.role === 'admin' && (
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="sm" onClick={() => openReassign(c)}>
                        Reasignar
                      </Button>
                    </TableCell>
                  )}
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        )}

        {data && data.pages > 1 && (
          <TablePagination
            page={data.page}
            pages={data.pages}
            total={data.total}
            previousDisabled={page <= 1}
            nextDisabled={page >= data.pages}
            onPrevious={() => updateParam('page', String(page - 1))}
            onNext={() => updateParam('page', String(page + 1))}
          />
        )}
      </Card>

      <ReassignCaseModal
        target={reassignTarget}
        loading={updateMutation.isPending}
        onClose={() => setReassignTarget(null)}
        onConfirm={confirmReassign}
      />
    </div>
  );
}
