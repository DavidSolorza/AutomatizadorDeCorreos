import { Mail, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAnalystIcon } from '@/lib/icons';
import {
  ANALYST_IDS,
  ANALYST_MAILBOXES,
  ANALYST_PROFILES,
  getDemoUserById,
} from '@/config';

interface AnalystMailboxFilterProps {
  value: string | null;
  onChange: (analystId: string | null) => void;
  activeCounts?: Record<string, number>;
  totalActive?: number;
  className?: string;
}

export function AnalystMailboxFilter({
  value,
  onChange,
  activeCounts = {},
  totalActive = 0,
  className,
}: AnalystMailboxFilterProps) {
  const selectedMailbox = value ? ANALYST_MAILBOXES[value] : null;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2 overflow-x-auto pb-1 kanban-scroll">
        <button
          type="button"
          onClick={() => onChange(null)}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border shrink-0',
            value === null
              ? 'bg-sidebar text-white border-sidebar shadow-sm'
              : 'bg-bg-tertiary text-text-secondary border-border hover:bg-bg-hover',
          )}
        >
          <Users size={13} />
          Todos
          {totalActive > 0 && (
            <span
              className={cn(
                'text-[10px] px-1.5 py-0.5 rounded-full min-w-[18px] text-center',
                value === null ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary',
              )}
            >
              {totalActive}
            </span>
          )}
        </button>

        {ANALYST_IDS.map((id) => {
          const profile = ANALYST_PROFILES[id];
          const user = getDemoUserById(id)!;
          const mailbox = ANALYST_MAILBOXES[id];
          const Icon = getAnalystIcon(profile.iconName);
          const count = activeCounts[id] ?? 0;

          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              title={mailbox.email}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border shrink-0',
                value === id
                  ? 'border-primary bg-primary/8 text-primary shadow-sm'
                  : 'border-border bg-bg-tertiary text-text-secondary hover:bg-bg-hover',
              )}
            >
              <Icon size={13} />
              {user.full_name}
              {count > 0 && (
                <span
                  className={cn(
                    'text-[10px] px-1.5 py-0.5 rounded-full min-w-[18px] text-center',
                    value === id ? 'bg-primary text-white' : 'bg-bg-secondary text-text-secondary',
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2 text-[11px] text-text-secondary px-0.5">
        <Mail size={12} className="shrink-0" />
        {selectedMailbox ? (
          <span>
            Buzón: <strong className="text-text-primary">{selectedMailbox.email}</strong>
            <span className="hidden sm:inline"> · {selectedMailbox.label}</span>
          </span>
        ) : (
          <span>
            Mostrando <strong className="text-text-primary">todos los buzones</strong> consolidados
          </span>
        )}
      </div>
    </div>
  );
}
