import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { ToastContainer } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';
import { useUIStore } from '@/store';
import { cn } from '@/lib/utils';
import { useSSE } from '@/hooks/useSSE';
import { eventBus, Events } from '@/lib/event-bus';
import { toast } from '@/components/ui/Toast';

export function DashboardLayout() {
  const { sidebarOpen } = useUIStore();
  const queryClient = useQueryClient();

  useSSE();

  useEffect(() => {
    const refreshCases = () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
    };

    const onEmailCreated = () => {
      refreshCases();
      toast('info', 'Nuevo correo', 'Se creó un caso operativo automáticamente');
    };

    const unsubEmail = eventBus.on(Events.EMAIL_CREATED, onEmailCreated);
    const unsubSync = eventBus.on(Events.SYNC_COMPLETED, refreshCases);

    return () => {
      unsubEmail();
      unsubSync();
    };
  }, [queryClient]);

  return (
    <div className="min-h-screen bg-bg-primary overflow-x-hidden">
      <Sidebar />
      <Header />
      <main
        className={cn(
          'transition-all duration-300 min-h-screen pt-16',
          sidebarOpen ? 'ml-64' : 'ml-16',
        )}
      >
        <div className="p-6 lg:p-8 max-w-[100%] mx-auto">
          <Outlet />
        </div>
      </main>
      <ToastContainer />
      <Modal />
    </div>
  );
}
