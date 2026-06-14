import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Zap,
  BarChart3,
  LayoutGrid,
  Search,
  X,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusKanbanBoard } from '@/components/kanban/StatusKanbanBoard';
import { casesApi } from '@/services/api';
import { useDemoUserStore } from '@/store';
import { cn } from '@/lib/utils';
import { getAnalystIcon } from '@/lib/icons';
import { ANALYST_PROFILES } from '@/config';
import { isClosedStatus } from '@/config/case-statuses';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const itemAnim = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 28 } },
};

export function AnalystKanbanDashboard() {
  const navigate = useNavigate();
  const { currentUser } = useDemoUserStore();
  const [kanbanSearch, setKanbanSearch] = useState('');

  const { data: allCases, isLoading } = useQuery({
    queryKey: ['cases', 'kanban', currentUser.id],
    queryFn: () =>
      casesApi.list({ size: 100, sort_by: 'received_at', sort_order: 'desc' }).then((r) => r.data),
  });

  const cases = allCases?.items || [];
  const profile = ANALYST_PROFILES[currentUser.id];
  const Icon = profile ? getAnalystIcon(profile.iconName) : null;
  const activeCount = cases.filter((c) => !isClosedStatus(c.status)).length;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-5">
      <motion.div variants={itemAnim} className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <LayoutGrid size={14} className="text-primary" />
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">
              Mi Tablero
            </span>
          </div>
          <h1 className="text-2xl font-semibold text-text-primary tracking-tight">
            Gestión Operativa
          </h1>
          <p className="text-sm text-text-secondary mt-1.5 max-w-xl">
            Tus casos trazados desde {currentUser.email}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => navigate('/metrics')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-bg-secondary border border-border text-sm font-medium text-text-primary hover:border-primary/30 hover:bg-bg-hover transition-all shadow-[var(--shadow-card)]"
          >
            <BarChart3 size={15} /> Métricas
          </button>
          <button
            type="button"
            onClick={() => navigate('/settings')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-[#1d4ed8] transition-all shadow-sm shadow-primary/15"
          >
            <Zap size={15} /> Nuevo correo
          </button>
        </div>
      </motion.div>

      {profile && Icon && (
        <motion.div variants={itemAnim}>
          <div className={cn('flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r text-white shadow-md', profile.gradient)}>
            <div className="h-11 w-11 rounded-xl bg-white/20 flex items-center justify-center">
              <Icon size={22} />
            </div>
            <div>
              <p className="font-bold">{currentUser.full_name} · {profile.title}</p>
              <p className="text-xs text-white/75 mt-0.5">
                {activeCount} casos activos asignados a ti
              </p>
            </div>
          </div>
        </motion.div>
      )}

      <motion.div variants={itemAnim}>
        <Card padding="sm" className="overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3 shrink-0">
            <div className="relative w-full max-w-md">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none"
              />
              <input
                type="text"
                value={kanbanSearch}
                onChange={(e) => setKanbanSearch(e.target.value)}
                placeholder="Buscar en tablero: asunto, remitente..."
                className={cn(
                  'w-full pl-9 pr-9 py-2 text-xs rounded-xl',
                  'border border-border bg-bg-primary text-text-primary',
                  'placeholder:text-text-secondary',
                  'focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary/40',
                  'transition-all duration-200',
                )}
              />
              {kanbanSearch && (
                <button
                  type="button"
                  onClick={() => setKanbanSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors"
                  aria-label="Limpiar búsqueda del tablero"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="kanban-board-container">
            {isLoading ? (
              <div className="flex gap-3 overflow-hidden h-[min(520px,calc(100dvh-18rem))]">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-full w-[260px] shrink-0 rounded-xl" />
                ))}
              </div>
            ) : (
              <StatusKanbanBoard
                cases={cases}
                analystFilter={currentUser.id}
                searchQuery={kanbanSearch}
              />
            )}
          </div>

          <p className="text-[11px] text-text-secondary mt-3 pt-3 border-t border-border flex items-center gap-1.5 shrink-0">
            <GripHint />
            Scroll en cada columna · Arrastra entre columnas · &quot;Cerrar caso&quot; para finalizar
          </p>
        </Card>
      </motion.div>
    </motion.div>
  );
}

function GripHint() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-secondary">
      <circle cx="9" cy="5" r="1" fill="currentColor" /><circle cx="9" cy="12" r="1" fill="currentColor" /><circle cx="9" cy="19" r="1" fill="currentColor" />
      <circle cx="15" cy="5" r="1" fill="currentColor" /><circle cx="15" cy="12" r="1" fill="currentColor" /><circle cx="15" cy="19" r="1" fill="currentColor" />
    </svg>
  );
}
