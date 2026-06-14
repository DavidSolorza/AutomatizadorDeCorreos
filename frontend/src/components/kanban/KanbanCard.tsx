import { GripVertical, Clock, User, CheckCircle2, ExternalLink, ListTodo } from 'lucide-react';
import { cn, formatDate, getInitials } from '@/lib/utils';
import { formatElapsed } from '@/lib/case-utils';
import { CASE_CATEGORY_LABELS, getCategoryColor, type OperationalCase, type CaseStatus } from '@/types/cases';
import { ANALYST_PROFILES } from '@/config';

interface KanbanCardProps {
  caseItem: OperationalCase;
  columnStatus: CaseStatus;
  onOpen: () => void;
  onClose: () => void;
  onDragStart: (e: React.DragEvent) => void;
  isDragging?: boolean;
}

export function KanbanCard({
  caseItem,
  columnStatus,
  onOpen,
  onClose,
  onDragStart,
  isDragging,
}: KanbanCardProps) {
  const profile = ANALYST_PROFILES[caseItem.assigned_to];
  const isUrgent = caseItem.status === 'bloqueado' || caseItem.priority === 'urgente';
  const canClose = columnStatus !== 'cerrado';
  const taskCount = caseItem.action_items?.length ?? 0;

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className={cn(
        'group relative rounded-[14px] border bg-bg-secondary',
        'border-border shadow-[var(--shadow-card)]',
        'hover:shadow-[var(--shadow-card-hover)] hover:border-primary/30 transition-all duration-200 cursor-grab active:cursor-grabbing',
        isDragging && 'opacity-40 scale-[0.98]',
        isUrgent && 'ring-1 ring-error/25',
      )}
    >
      <div className="flex items-start gap-1 p-3 pb-2">
        <GripVertical size={14} className="text-border-default shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className={cn('inline-flex px-2 py-0.5 rounded-md text-[10px] font-semibold border', getCategoryColor(caseItem.category))}>
              {CASE_CATEGORY_LABELS[caseItem.category]}
            </span>
            <div
              className="h-6 w-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
              style={{ backgroundColor: profile?.color || '#64748b' }}
              title={caseItem.assigned_name}
            >
              {getInitials(caseItem.assigned_name)}
            </div>
          </div>

          <p className="text-sm font-semibold text-text-primary leading-snug line-clamp-2">
            {caseItem.subject || 'Sin asunto'}
          </p>

          <div className="flex items-center gap-1 mt-1.5 text-[11px] text-text-secondary">
            <User size={10} className="shrink-0" />
            <span className="truncate">{caseItem.sender_name || caseItem.sender.split('@')[0]}</span>
          </div>

          <div className="flex items-center justify-between mt-2 text-[10px] text-text-secondary">
            <span className="flex items-center gap-2">
              {formatDate(caseItem.received_at)}
              {taskCount > 0 && (
                <span className="inline-flex items-center gap-0.5 text-info font-medium">
                  <ListTodo size={9} />
                  {taskCount}
                </span>
              )}
            </span>
            <span className="flex items-center gap-0.5 font-medium tabular-nums">
              <Clock size={9} />
              {formatElapsed(caseItem.received_at, caseItem.closed_at)}
            </span>
          </div>
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="flex border-t border-border">
        {canClose && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="flex-1 flex items-center justify-center gap-1 py-2.5 text-[11px] font-semibold text-success hover:bg-success/5 transition-colors"
          >
            <CheckCircle2 size={13} />
            Cerrar caso
          </button>
        )}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onOpen(); }}
          className={cn(
            'flex items-center justify-center gap-1 py-2.5 text-[11px] font-medium text-text-secondary hover:text-primary hover:bg-bg-hover transition-colors',
            canClose ? 'flex-1 border-l border-border' : 'flex-1',
          )}
        >
          <ExternalLink size={12} />
          Ver detalle
        </button>
      </div>
    </div>
  );
}
