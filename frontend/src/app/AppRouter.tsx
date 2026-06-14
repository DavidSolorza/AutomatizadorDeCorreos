import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { DashboardPage } from '@/modules/dashboard/DashboardPage';
import { CasesPage } from '@/modules/cases/CasesPage';
import { CaseDetailPage } from '@/modules/cases/CaseDetailPage';
import { AnalystsPage } from '@/modules/analysts/AnalystsPage';
import { MetricsPage } from '@/modules/metrics/MetricsPage';
import { HistoryPage } from '@/modules/history/HistoryPage';
import { SettingsPage } from '@/modules/settings/SettingsPage';
export function AppRouter() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="cases" element={<CasesPage />} />
          <Route path="cases/:id" element={<CaseDetailPage />} />
          <Route path="analysts" element={<AnalystsPage />} />
          <Route path="metrics" element={<MetricsPage />} />
          <Route path="executive" element={<Navigate to="/dashboard" replace />} />
          <Route path="kanban" element={<Navigate to="/dashboard" replace />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="settings" element={<SettingsPage />} />
          {/* Legacy routes → redirect */}
          <Route path="emails" element={<Navigate to="/cases" replace />} />
          <Route path="emails/*" element={<Navigate to="/cases" replace />} />
          <Route path="organizer" element={<Navigate to="/cases" replace />} />
          <Route path="calendar" element={<Navigate to="/dashboard" replace />} />
          <Route path="rules" element={<Navigate to="/settings" replace />} />
          <Route path="notifications" element={<Navigate to="/dashboard" replace />} />
          <Route path="login" element={<Navigate to="/dashboard" replace />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </HashRouter>
  );
}
