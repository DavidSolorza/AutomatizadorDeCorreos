import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'secondary';
  dot?: boolean;
}

export function Badge({ children, className, variant = 'default', dot }: BadgeProps) {
  const variants = {
    default: 'bg-bg-tertiary text-text-secondary border-border',
    success: 'bg-success/10 text-[#047857] border-success/20',
    warning: 'bg-warning/10 text-[#b45309] border-warning/20',
    error: 'bg-error/10 text-[#b91c1c] border-error/20',
    info: 'bg-info/10 text-[#1d4ed8] border-info/20',
    secondary: 'bg-secondary/10 text-[#0f766e] border-secondary/20',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border',
        variants[variant],
        className,
      )}
    >
      {dot && (
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full',
            variant === 'success' && 'bg-success',
            variant === 'warning' && 'bg-warning',
            variant === 'error' && 'bg-error',
            variant === 'info' && 'bg-info',
            variant === 'secondary' && 'bg-secondary',
            variant === 'default' && 'bg-text-secondary',
          )}
        />
      )}
      {children}
    </span>
  );
}
