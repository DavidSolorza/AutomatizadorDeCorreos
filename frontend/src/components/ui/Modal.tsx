import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { useModalStore } from '@/store';
import { Button } from './Button';
import { cn } from '@/lib/utils';

export function Modal() {
  const { isOpen, title, message, confirmLabel, cancelLabel, variant, onConfirm, closeModal } =
    useModalStore();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-corporate/50 backdrop-blur-sm"
            onClick={closeModal}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 4 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative w-full max-w-md bg-bg-secondary rounded-2xl border border-border shadow-2xl p-6"
          >
            <div className="flex items-start gap-4">
              {variant === 'danger' && (
                <div className="h-10 w-10 rounded-xl bg-error/10 flex items-center justify-center shrink-0">
                  <AlertTriangle size={20} className="text-error" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-text-primary tracking-tight">{title}</h3>
                <p className="text-sm text-text-secondary mt-2 leading-relaxed">{message}</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="ghost" size="sm" onClick={closeModal}>
                {cancelLabel}
              </Button>
              <Button
                variant={variant === 'danger' ? 'danger' : 'primary'}
                size="sm"
                className={cn(variant !== 'danger' && '')}
                onClick={() => {
                  onConfirm?.();
                  closeModal();
                }}
              >
                {confirmLabel}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
