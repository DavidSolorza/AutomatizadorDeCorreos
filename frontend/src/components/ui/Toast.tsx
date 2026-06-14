import { AnimatePresence, motion } from 'framer-motion';
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { useToastStore } from '@/store';
import { cn } from '@/lib/utils';

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const styles = {
  success: 'border-success/20 bg-bg-secondary',
  error: 'border-error/20 bg-bg-secondary',
  warning: 'border-warning/20 bg-bg-secondary',
  info: 'border-info/20 bg-bg-secondary',
};

const iconStyles = {
  success: 'text-success',
  error: 'text-error',
  warning: 'text-warning',
  info: 'text-info',
};

const accentBar = {
  success: 'bg-success',
  error: 'bg-error',
  warning: 'bg-warning',
  info: 'bg-info',
};

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon = icons[toast.type];
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className={cn(
                'pointer-events-auto relative flex items-start gap-3 w-80 p-4 rounded-2xl border shadow-lg overflow-hidden',
                styles[toast.type],
              )}
            >
              <div className={cn('absolute left-0 top-0 bottom-0 w-1', accentBar[toast.type])} />
              <Icon size={18} className={cn('shrink-0 mt-0.5 ml-1', iconStyles[toast.type])} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary">{toast.title}</p>
                {toast.message && (
                  <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">{toast.message}</p>
                )}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="shrink-0 p-1 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors"
              >
                <X size={14} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

type ToastType = 'success' | 'error' | 'warning' | 'info';

export function toast(type: ToastType, title: string, message?: string) {
  useToastStore.getState().addToast({ type, title, message });
}
