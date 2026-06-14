import { useDemoUserStore } from '@/store';
import { AdminExecutiveDashboard } from './AdminExecutiveDashboard';
import { AnalystKanbanDashboard } from './AnalystKanbanDashboard';

export function DashboardPage() {
  const { currentUser } = useDemoUserStore();
  const isAdmin = currentUser.role === 'admin';

  if (isAdmin) {
    return <AdminExecutiveDashboard />;
  }

  return <AnalystKanbanDashboard />;
}
