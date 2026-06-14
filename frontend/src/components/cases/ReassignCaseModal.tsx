import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { UserRound, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { DEMO_USERS, ANALYST_PROFILES } from '@/config';
import { cn } from '@/lib/utils';

const ANALYSTS = DEMO_USERS.filter((u) => u.role === 'analyst');

export interface ReassignCaseTarget {
  caseId: string;
  subject: string;
  assignedTo: string;
  assignedName: string;
}

interface ReassignCaseModalProps {
  target: ReassignCaseTarget | null;
  loading?: boolean;
  onClose: () => void;
  onConfirm: (caseId: string, analystId: string, analystName: string) => void;
}

export function ReassignCaseModal({ target, loading, onClose, onConfirm }: ReassignCaseModalProps) {
  const [selectedId, setSelectedId] = useState('');

  useEffect(() => {
    if (!target) {
      setSelectedId('');
      return;
    }
    const other = ANALYSTS.find((a) => a.id !== target.assignedTo);
    setSelectedId(other?.id || '');
  }, [target]);

  const selectedAnalyst = ANALYSTS.find((a) => a.id === selectedId);
  const isSameAssignee = !!target && selectedId === target.assignedTo;

  return (
    <AnimatePresence>
      {target && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-corporate/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 4 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative w-full max-w-md bg-bg-secondary rounded-2xl border border-border shadow-2xl p-6"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-4 mb-5">
              <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center">
                <UserRound size={20} className="text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-text-primary tracking-tight">
                  Reasignar caso
                </h3>
                <p className="text-xs text-text-secondary mt-0.5">Elige el analista responsable</p>
              </div>
            </div>

            <p className="text-sm text-text-primary mb-1 line-clamp-2 font-medium">
              {target.subject || 'Sin asunto'}
            </p>
            <p className="text-xs text-text-secondary mb-6">
              Responsable actual:{' '}
              <span className="font-medium text-text-primary">{target.assignedName}</span>
            </p>

            <label className="block text-sm font-medium text-text-primary mb-2">
              Reasignar a
            </label>
            <Select
              value={selectedId}
              onChange={setSelectedId}
              placeholder="Seleccionar analista"
              options={ANALYSTS.map((a) => ({
                value: a.id,
                label: a.full_name,
              }))}
              className="w-full mb-4"
            />

            {selectedAnalyst && (
              <div className="mb-5 p-4 rounded-xl bg-bg-primary border border-border">
                <p className="text-xs text-text-secondary">Especialidad</p>
                <p className="text-sm font-medium text-text-primary mt-0.5">
                  {ANALYST_PROFILES[selectedAnalyst.id]?.title || 'Analista operativo'}
                </p>
              </div>
            )}

            {isSameAssignee && (
              <p className="text-xs text-warning mb-4">
                Selecciona un analista distinto al responsable actual.
              </p>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>
                Cancelar
              </Button>
              <Button
                size="sm"
                loading={loading}
                disabled={!selectedId || isSameAssignee}
                onClick={() => {
                  if (selectedAnalyst) {
                    onConfirm(target.caseId, selectedAnalyst.id, selectedAnalyst.full_name);
                  }
                }}
                className={cn(!selectedId || isSameAssignee ? 'opacity-50' : '')}
              >
                Reasignar
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
