import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, disabled, ...props }, ref) => {
    const base =
      'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
    const variants = {
      primary:
        'bg-primary text-white hover:bg-[#1d4ed8] focus:ring-primary/30 shadow-sm shadow-primary/10',
      secondary:
        'bg-bg-tertiary text-text-primary hover:bg-bg-hover focus:ring-border border border-border',
      outline:
        'bg-bg-secondary text-text-primary border border-border hover:bg-bg-hover hover:border-border-default focus:ring-primary/20',
      ghost: 'text-text-secondary hover:bg-bg-hover hover:text-text-primary focus:ring-border',
      danger: 'bg-error text-white hover:bg-[#dc2626] focus:ring-error/30 shadow-sm',
    };
    const sizes = {
      sm: 'h-8 px-3.5 text-xs gap-1.5',
      md: 'h-10 px-4 text-sm gap-2',
      lg: 'h-11 px-5 text-sm gap-2.5',
    };

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  },
);
