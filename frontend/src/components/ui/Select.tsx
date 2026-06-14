import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  size?: 'sm' | 'md';
}

export function Select({ value, options, onChange, placeholder, className, size = 'md' }: SelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center gap-2 w-full rounded-xl border border-border',
          'bg-bg-secondary text-left transition-all duration-200',
          'hover:border-border-default hover:bg-bg-primary',
          'focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary/40',
          size === 'sm' ? 'px-3 py-2 text-sm' : 'px-3.5 py-2.5 text-sm',
        )}
      >
        <span className="flex-1 truncate text-text-primary">
          {selected?.label || placeholder || 'Seleccionar'}
        </span>
        <ChevronDown
          size={14}
          className={cn('text-text-secondary transition-transform duration-200 shrink-0', open && 'rotate-180')}
        />
      </button>
      {open && (
        <div className="absolute z-50 mt-1.5 w-full min-w-[160px] rounded-xl border border-border bg-bg-secondary shadow-lg py-1 animate-fade-in">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={cn(
                'flex items-center gap-2 w-full px-3 py-2 text-sm text-left transition-colors duration-150',
                opt.value === value
                  ? 'bg-primary/8 text-primary font-medium'
                  : 'text-text-primary hover:bg-bg-hover',
              )}
            >
              <span className="flex-1">{opt.label}</span>
              {opt.value === value && <Check size={14} className="text-primary shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
