import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Briefcase,
  Users,
  BarChart3,
  History,
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
  ChevronUp,
} from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';
import { useUIStore, useDemoUserStore } from '@/store';
import { APP_NAME, DEMO_USERS } from '@/config';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { casesApi } from '@/services/api';

interface NavItem {
  label: string;
  icon: LucideIcon;
  path: string;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Casos', icon: Briefcase, path: '/cases' },
  { label: 'Analistas', icon: Users, path: '/analysts' },
  { label: 'Métricas', icon: BarChart3, path: '/metrics' },
  { label: 'Historial', icon: History, path: '/history' },
];

const bottomNavItems: NavItem[] = [
  { label: 'Configuración', icon: Settings, path: '/settings' },
];

export function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const { currentUser, setCurrentUser } = useDemoUserStore();
  const queryClient = useQueryClient();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const isAdmin = currentUser.role === 'admin';

  const { data: metrics } = useQuery({
    queryKey: ['cases', 'dashboard-metrics', currentUser.id],
    queryFn: () => casesApi.dashboard().then((r) => r.data),
    refetchInterval: 60000,
  });

  const visibleItems = navItems
    .map((item) =>
      item.path === '/analysts' && !isAdmin ? { ...item, label: 'Mi perfil' } : item,
    )
    .filter((item) => !item.adminOnly || isAdmin);

  const handleUserChange = (userId: string) => {
    const user = DEMO_USERS.find((u) => u.id === userId);
    if (user) {
      setCurrentUser(user);
      setUserMenuOpen(false);
      queryClient.invalidateQueries();
    }
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen flex flex-col transition-all duration-300 ease-out',
        'bg-sidebar border-r border-sidebar-hover/50',
        sidebarOpen ? 'w-64' : 'w-16',
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          'flex items-center h-16 px-4 border-b border-sidebar-hover/60 shrink-0',
          sidebarOpen ? 'justify-between' : 'justify-center',
        )}
      >
        {sidebarOpen && (
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
              <Shield size={18} className="text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white tracking-tight truncate">{APP_NAME}</p>
              <p className="text-[10px] text-slate-400 leading-none mt-0.5">Trazabilidad Operativa</p>
            </div>
          </div>
        )}
        {!sidebarOpen && (
          <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <Shield size={18} className="text-white" />
          </div>
        )}
        {sidebarOpen && (
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-sidebar-hover transition-colors duration-200"
            aria-label="Colapsar sidebar"
          >
            <ChevronLeft size={18} />
          </button>
        )}
      </div>

      {!sidebarOpen && (
        <button
          onClick={toggleSidebar}
          className="mx-auto mt-2 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-sidebar-hover transition-colors duration-200"
          aria-label="Expandir sidebar"
        >
          <ChevronRight size={18} />
        </button>
      )}

      {/* Navegación principal */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {sidebarOpen && (
          <p className="px-3 mb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
            Menú
          </p>
        )}
        {visibleItems.map((item) => {
          const label =
            item.path === '/dashboard' && !isAdmin ? 'Mi Tablero' : item.label;
          return (
          <NavLink
            key={item.path}
            to={item.path}
            title={!sidebarOpen ? label : undefined}
            className={({ isActive }) =>
              cn(
                'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-primary/15 text-white shadow-sm border border-primary/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-sidebar-hover',
                !sidebarOpen && 'justify-center px-2',
              )
            }
          >
            <item.icon
              size={18}
              className={cn('shrink-0 transition-colors duration-200', 'group-hover:text-slate-200')}
            />
            {sidebarOpen && <span className="flex-1 truncate">{label}</span>}
            {sidebarOpen && item.path === '/cases' && metrics && metrics.pending > 0 && (
              <span className="text-[10px] font-semibold bg-warning/90 text-white px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                {metrics.pending}
              </span>
            )}
          </NavLink>
          );
        })}

        <div className="my-3 border-t border-sidebar-hover/60" />

        {bottomNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            title={!sidebarOpen ? item.label : undefined}
            className={({ isActive }) =>
              cn(
                'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-primary/15 text-white border border-primary/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-sidebar-hover',
                !sidebarOpen && 'justify-center px-2',
              )
            }
          >
            <item.icon size={18} className="shrink-0" />
            {sidebarOpen && <span className="flex-1">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Selector de usuario */}
      <div className="p-3 border-t border-sidebar-hover/60 shrink-0">
        <div className="relative">
          <button
            onClick={() => sidebarOpen && setUserMenuOpen(!userMenuOpen)}
            className={cn(
              'flex items-center w-full gap-3 p-2.5 rounded-xl transition-all duration-200',
              'hover:bg-sidebar-hover',
              !sidebarOpen && 'justify-center',
            )}
            title={!sidebarOpen ? currentUser.full_name : undefined}
          >
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xs font-semibold text-white shrink-0 ring-2 ring-sidebar-hover">
              {getInitials(currentUser.full_name)}
            </div>
            {sidebarOpen && (
              <>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium text-white truncate">{currentUser.full_name}</p>
                  <p className="text-[11px] text-slate-400 truncate">
                    {isAdmin ? 'Administrador' : 'Analista'}
                  </p>
                </div>
                <ChevronUp
                  size={14}
                  className={cn(
                    'text-slate-400 transition-transform duration-200 shrink-0',
                    userMenuOpen && 'rotate-180',
                  )}
                />
              </>
            )}
          </button>

          {userMenuOpen && sidebarOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
              <div className="absolute bottom-full left-0 right-0 mb-2 z-50 rounded-xl border border-sidebar-hover bg-sidebar shadow-xl py-1.5 animate-fade-in">
                <p className="px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  Cambiar usuario
                </p>
                {DEMO_USERS.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleUserChange(user.id)}
                    className={cn(
                      'flex items-center gap-3 w-full px-3 py-2.5 text-sm transition-colors duration-150',
                      user.id === currentUser.id
                        ? 'bg-primary/20 text-white'
                        : 'text-slate-300 hover:bg-sidebar-hover hover:text-white',
                    )}
                  >
                    <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-[10px] font-semibold text-white">
                      {getInitials(user.full_name)}
                    </div>
                    <div className="text-left min-w-0">
                      <p className="font-medium truncate">{user.full_name}</p>
                      <p className="text-[11px] text-slate-400">
                        {user.role === 'admin' ? 'Administrador' : 'Analista'}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {sidebarOpen && (
          <div className="mt-2 px-2 flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
            <span className="text-[10px] text-slate-500">Sistema operativo</span>
          </div>
        )}
      </div>
    </aside>
  );
}
