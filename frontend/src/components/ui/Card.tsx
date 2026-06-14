import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  className?: string;
  children: ReactNode;
  hover?: boolean;
  onClick?: () => void;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingMap = {
  none: 'p-0',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export function Card({ className, children, hover, onClick, padding = 'md' }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-[14px] border border-border bg-bg-secondary',
        'shadow-[var(--shadow-card)]',
        paddingMap[padding],
        hover &&
          'cursor-pointer hover:border-border-default hover:shadow-[var(--shadow-card-hover)] transition-all duration-200',
        className,
      )}
    >
      {children}
    </div>
  );
}
