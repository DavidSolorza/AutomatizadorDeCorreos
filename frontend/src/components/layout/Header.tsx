import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Bell, ChevronDown, Command } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useDemoUserStore, useUIStore } from '@/store';
import { DEMO_USERS } from '@/config';
import { cn, getInitials } from '@/lib/utils';
import { casesApi } from '@/services/api';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/cases': 'Gestión de Casos',
  '/analysts': 'Analistas',
  '/executive': 'Vista Gerencial',
  '/metrics': 'Métricas',
  '/history': 'Historial',
  '/settings': 'Configuración',
};

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, setCurrentUser } = useDemoUserStore();
  const { sidebarOpen } = useUIStore();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const { data: metrics } = useQuery({
    queryKey: ['cases', 'dashboard-metrics', currentUser.id],
    queryFn: () => casesApi.dashboard().then((r) => r.data),
  });

  const pageTitle =
    PAGE_TITLES[location.pathname] ||
    (location.pathname.startsWith('/cases/') ? 'Detalle del Caso' : 'AseEsta Ops');

  const handleUserChange = (userId: string) => {
    const user = DEMO_USERS.find((u) => u.id === userId);
    if (user) {
      setCurrentUser(user);
      setUserMenuOpen(false);
      queryClient.invalidateQueries();
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/cases?query=${encodeURIComponent(search.trim())}`);
    }
  };

  return (
    <header
      className={cn(
        'fixed top-0 right-0 z-30 h-16 bg-bg-secondary/90 backdrop-blur-lg',
        'border-b border-border',
        'flex items-center justify-between px-6 gap-6 transition-all duration-300',
        sidebarOpen ? 'left-64' : 'left-16',
      )}
    >
      {/* Contexto */}
      <div className="hidden md:block min-w-0 shrink-0">
        <h2 className="text-sm font-semibold text-text-primary truncate">{pageTitle}</h2>
        {metrics && (
          <p className="text-xs text-text-secondary mt-0.5">
            {metrics.pending > 0
              ? `${metrics.pending} casos pendientes · ${metrics.received_today} recibidos hoy`
              : `${metrics.received_today} casos recibidos hoy`}
          </p>
        )}
      </div>

      {/* Buscador */}
      <form onSubmit={handleSearch} className="flex-1 max-w-lg">
        <div className="relative group">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-primary transition-colors"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar casos, remitentes, asuntos..."
            className={cn(
              'w-full pl-10 pr-16 py-2.5 text-sm rounded-xl',
              'border border-border bg-bg-primary text-text-primary',
              'placeholder:text-text-secondary',
              'focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary/40',
              'transition-all duration-200',
            )}
          />
          <kbd className="hidden sm:inline-flex absolute right-3 top-1/2 -translate-y-1/2 items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-bg-tertiary border border-border text-[10px] text-text-secondary font-medium">
            <Command size={10} />K
          </kbd>
        </div>
      </form>

      {/* Acciones */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Notificaciones */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className={cn(
              'relative p-2.5 rounded-xl text-text-secondary',
              'hover:bg-bg-hover hover:text-text-primary transition-colors duration-200',
              notifOpen && 'bg-bg-hover text-text-primary',
            )}
            aria-label="Notificaciones"
          >
            <Bell size={18} />
            {metrics && metrics.pending > 0 && (
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-error ring-2 ring-bg-secondary" />
            )}
          </button>

          {notifOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-80 z-50 rounded-2xl border border-border bg-bg-secondary shadow-xl py-2 animate-fade-in">
                <div className="px-4 py-2 border-b border-border">
                  <p className="text-sm font-semibold text-text-primary">Notificaciones</p>
                </div>
                {metrics && metrics.pending > 0 ? (
                  <button
                    onClick={() => {
                      setNotifOpen(false);
                      navigate('/cases?status=pendiente_cliente');
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-bg-hover transition-colors"
                  >
                    <p className="text-sm font-medium text-text-primary">
                      {metrics.pending} casos pendientes
                    </p>
                    <p className="text-xs text-text-secondary mt-0.5">
                      Requieren atención del equipo
                    </p>
                  </button>
                ) : (
                  <p className="px-4 py-6 text-sm text-text-secondary text-center">
                    Sin notificaciones pendientes
                  </p>
                )}
                {metrics && metrics.critical > 0 && (
                  <button
                    onClick={() => {
                      setNotifOpen(false);
                      navigate('/cases');
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-bg-hover transition-colors border-t border-border"
                  >
                    <p className="text-sm font-medium text-error">
                      {metrics.critical} casos críticos
                    </p>
                    <p className="text-xs text-text-secondary mt-0.5">Revisar prioridad urgente</p>
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Usuario */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className={cn(
              'flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 rounded-xl',
              'hover:bg-bg-hover transition-colors duration-200',
              userMenuOpen && 'bg-bg-hover',
            )}
          >
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xs font-semibold text-white">
              {getInitials(currentUser.full_name)}
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-sm font-medium text-text-primary leading-tight">
                {currentUser.full_name}
              </p>
              <p className="text-[11px] text-text-secondary leading-none mt-0.5">
                {currentUser.role === 'admin' ? 'Administrador' : 'Analista'}
              </p>
            </div>
            <ChevronDown
              size={14}
              className={cn(
                'text-text-secondary transition-transform duration-200 hidden sm:block',
                userMenuOpen && 'rotate-180',
              )}
            />
          </button>

          {userMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-56 z-50 rounded-2xl border border-border bg-bg-secondary shadow-xl py-1.5 animate-fade-in">
                <p className="px-3 py-2 text-[10px] font-semibold text-text-secondary uppercase tracking-wider">
                  Sesión demo
                </p>
                {DEMO_USERS.map((user) => (
                  <button
                    key={user.id}
                    className={cn(
                      'flex items-center gap-3 w-full px-3 py-2.5 text-sm transition-colors duration-150',
                      user.id === currentUser.id
                        ? 'bg-primary/8 text-primary'
                        : 'text-text-primary hover:bg-bg-hover',
                    )}
                    onClick={() => handleUserChange(user.id)}
                  >
                    <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-[10px] font-semibold text-white">
                      {getInitials(user.full_name)}
                    </div>
                    <div className="text-left">
                      <p className="font-medium">{user.full_name}</p>
                      <p className="text-xs text-text-secondary">
                        {user.role === 'admin' ? 'Administrador' : 'Analista'}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
