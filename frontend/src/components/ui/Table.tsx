import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface TableProps {
  children: ReactNode;
  className?: string;
}

export function Table({ children, className }: TableProps) {
  return (
    <div className="data-table-wrapper">
      <table className={cn('data-table text-sm', className)}>{children}</table>
    </div>
  );
}

export function TableHead({ children, className }: { children: ReactNode; className?: string }) {
  return <thead className={className}>{children}</thead>;
}

export function TableBody({ children, className }: { children: ReactNode; className?: string }) {
  return <tbody className={className}>{children}</tbody>;
}

export function TableRow({
  children,
  className,
  onClick,
  hover = true,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
}) {
  return (
    <tr
      onClick={onClick}
      className={cn(
        hover && 'cursor-pointer',
        className,
      )}
    >
      {children}
    </tr>
  );
}

export function TableHeader({
  children,
  className,
  onClick,
  sortable,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  sortable?: boolean;
}) {
  return (
    <th
      onClick={onClick}
      className={cn(
        'px-5 py-3.5 text-left text-[11px] font-semibold text-text-secondary uppercase tracking-wider',
        sortable && 'cursor-pointer hover:text-text-primary transition-colors select-none',
        className,
      )}
    >
      {children}
    </th>
  );
}

export function TableCell({
  children,
  className,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}) {
  return (
    <td className={cn('px-5 py-4 text-text-primary', className)} onClick={onClick}>
      {children}
    </td>
  );
}

export function TablePagination({
  page,
  pages,
  total,
  onPrevious,
  onNext,
  previousDisabled,
  nextDisabled,
}: {
  page: number;
  pages: number;
  total: number;
  onPrevious: () => void;
  onNext: () => void;
  previousDisabled?: boolean;
  nextDisabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-t border-border bg-bg-primary/50">
      <p className="text-xs text-text-secondary">
        Página {page} de {pages} · {total} registros
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={previousDisabled}
          onClick={onPrevious}
          className={cn(
            'h-8 px-3.5 text-xs font-medium rounded-lg border border-border transition-colors',
            'hover:bg-bg-hover disabled:opacity-40 disabled:cursor-not-allowed',
          )}
        >
          Anterior
        </button>
        <button
          type="button"
          disabled={nextDisabled}
          onClick={onNext}
          className={cn(
            'h-8 px-3.5 text-xs font-medium rounded-lg border border-border transition-colors',
            'hover:bg-bg-hover disabled:opacity-40 disabled:cursor-not-allowed',
          )}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
