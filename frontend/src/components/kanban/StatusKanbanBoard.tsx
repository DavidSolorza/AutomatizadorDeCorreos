import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { KanbanCard } from './KanbanCard';
import { casesApi } from '@/services/api';
import { useDemoUserStore } from '@/store';
import { toast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';
import { matchesCaseSearch } from '@/lib/case-utils';
import { getKanbanColumnIcon } from '@/lib/icons';
import {
  KANBAN_COLUMNS,
  normalizeCaseStatus,
  isClosedStatus,
  type OperationalCase,
  type CaseStatus,
  type CaseListResponse,
} from '@/types/cases';

interface StatusKanbanBoardProps {
  cases: OperationalCase[];
  analystFilter?: string | null;
  searchQuery?: string;
}

export function StatusKanbanBoard({ cases, analystFilter, searchQuery = '' }: StatusKanbanBoardProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currentUser } = useDemoUserStore();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  const filtered = cases
    .filter((c) => (analystFilter ? c.assigned_to === analystFilter : true))
    .filter((c) => matchesCaseSearch(c, searchQuery));

  const isSearching = searchQuery.trim().length > 0;
  const activeCount = filtered.filter((c) => !isClosedStatus(c.status)).length;
  const closedCount = filtered.filter((c) => isClosedStatus(c.status)).length;

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: CaseStatus }) =>
      casesApi.update(id, { status }),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ['cases', 'kanban'] });
      const key = ['cases', 'kanban', currentUser.id] as const;
      const prev = queryClient.getQueryData<CaseListResponse>(key);
      if (prev?.items) {
        queryClient.setQueryData<CaseListResponse>(key, {
          ...prev,
          items: prev.items.map((c) =>
            c.id === id ? { ...c, status } : c,
          ),
        });
      }
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['cases', 'kanban', currentUser.id], ctx.prev);
      toast('error', 'No se pudo actualizar el caso');
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      if (vars.status === 'cerrado') {
        toast('success', 'Caso cerrado');
      }
    },
  });

  const moveCase = (caseId: string, newStatus: CaseStatus) => {
    const caseItem = cases.find((c) => c.id === caseId);
    if (!caseItem || normalizeCaseStatus(caseItem.status) === newStatus) return;
    updateMutation.mutate({ id: caseId, status: newStatus });
  };

  const handleDragStart = (e: React.DragEvent, caseId: string) => {
    e.dataTransfer.setData('text/plain', caseId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggingId(caseId);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDropTarget(null);
  };

  const handleDragOver = (e: React.DragEvent, columnKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTarget(columnKey);
  };

  const handleDrop = (e: React.DragEvent, defaultStatus: CaseStatus, columnKey: string) => {
    e.preventDefault();
    const caseId = e.dataTransfer.getData('text/plain');
    if (caseId) moveCase(caseId, defaultStatus);
    setDraggingId(null);
    setDropTarget(null);
    void columnKey;
  };

  const canEdit = (caseItem: OperationalCase) =>
    currentUser.role === 'admin' || caseItem.assigned_to === currentUser.id;

  const scrollBoard = (direction: 'left' | 'right') => {
    const el = document.getElementById('kanban-board-scroll');
    if (!el) return;
    el.scrollBy({ left: direction === 'left' ? -300 : 300, behavior: 'smooth' });
  };

  return (
    <div className="kanban-board">
      {/* Resumen compacto */}
      <div className="flex items-center justify-between gap-3 mb-3 px-0.5">
        <div className="flex items-center gap-3 text-xs text-text-secondary flex-wrap">
          {isSearching ? (
            <span>
              <strong className="text-text-primary">{filtered.length}</strong>
              {' '}resultado{filtered.length !== 1 ? 's' : ''} para &quot;{searchQuery.trim()}&quot;
            </span>
          ) : (
            <span><strong className="text-text-primary">{filtered.length}</strong> casos en vista</span>
          )}
          <span className="h-3 w-px bg-border" />
          <span><strong className="text-primary">{activeCount}</strong> activos</span>
          <span><strong className="text-success">{closedCount}</strong> cerrados</span>
        </div>
        <div className="hidden sm:flex items-center gap-1">
          <button
            type="button"
            onClick={() => scrollBoard('left')}
            className="p-1.5 rounded-lg border border-border bg-bg-secondary text-text-secondary hover:bg-bg-hover transition-colors"
            aria-label="Desplazar columnas a la izquierda"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => scrollBoard('right')}
            className="p-1.5 rounded-lg border border-border bg-bg-secondary text-text-secondary hover:bg-bg-hover transition-colors"
            aria-label="Desplazar columnas a la derecha"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Contenedor con altura fija: scroll horizontal entre columnas */}
      <div
        id="kanban-board-scroll"
        className="kanban-board-scroll flex gap-3 overflow-x-auto overflow-y-hidden pb-2 kanban-scroll -mx-1 px-1"
      >
        {KANBAN_COLUMNS.map((col) => {
          const columnCases = filtered.filter((c) =>
            col.statuses.includes(normalizeCaseStatus(c.status)),
          );
          const ColumnIcon = getKanbanColumnIcon(col.key);
          const isDropActive = dropTarget === col.key && draggingId;

          return (
            <div
              key={col.key}
              className="kanban-column flex flex-col w-[260px] min-w-[260px] max-w-[260px] shrink-0 h-full"
              onDragOver={(e) => handleDragOver(e, col.key)}
              onDragLeave={() => setDropTarget(null)}
              onDrop={(e) => handleDrop(e, col.defaultStatus, col.key)}
            >
              {/* Cabecera fija */}
              <div className={cn('kanban-column-header shrink-0 rounded-xl px-3 py-2.5 mb-2 border border-border/60', col.headerBg)}>
                <div className="flex items-center gap-2">
                  <div className={cn('h-7 w-7 rounded-lg flex items-center justify-center border border-border/50', col.headerBg)}>
                    <ColumnIcon size={14} className={col.headerText} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', col.dotColor)} />
                      <p className={cn('text-xs font-bold tracking-tight truncate', col.headerText)}>{col.label}</p>
                    </div>
                    <p className="text-[9px] text-text-secondary mt-0.5 truncate">{col.description}</p>
                  </div>
                  <span className={cn('text-sm font-bold tabular-nums shrink-0', col.headerText)}>
                    {columnCases.length}
                  </span>
                </div>
              </div>

              {/* Cuerpo con scroll vertical independiente */}
              <div
                className={cn(
                  'kanban-column-body flex-1 min-h-0 overflow-y-auto overflow-x-hidden kanban-scroll rounded-xl p-2 space-y-2',
                  col.dropBg,
                  isDropActive && 'ring-2 ring-primary/40 ring-offset-1 ring-offset-bg-primary',
                )}
              >
                {columnCases.length === 0 ? (
                  <div className={cn(
                    'flex flex-col items-center justify-center min-h-[120px] rounded-lg border-2 border-dashed transition-colors',
                    isDropActive ? 'border-primary bg-primary/5' : 'border-border',
                  )}>
                    <p className="text-[10px] text-text-secondary px-2 text-center">
                      {isDropActive
                        ? 'Soltar aquí'
                        : isSearching
                          ? 'Sin coincidencias'
                          : 'Sin casos'}
                    </p>
                  </div>
                ) : (
                  columnCases.map((c) => (
                    <div key={c.id} onDragEnd={handleDragEnd}>
                      <KanbanCard
                        caseItem={c}
                        columnStatus={col.defaultStatus}
                        isDragging={draggingId === c.id}
                        onDragStart={(e) => handleDragStart(e, c.id)}
                        onOpen={() => navigate(`/cases/${c.id}`)}
                        onClose={() => {
                          if (canEdit(c)) moveCase(c.id, 'cerrado');
                        }}
                      />
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-text-secondary mt-2 text-center sm:hidden">
        Desliza horizontalmente para ver todas las columnas
      </p>
    </div>
  );
}
