import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Mail, Moon, Sun, Shield, Zap, RefreshCw, Plus, Link2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { gmailApi, casesApi } from '@/services/api';
import { useDemoUserStore, useUIStore } from '@/store';
import { USE_MOCK, APP_NAME, ANALYST_MAILBOXES, PLATFORM_MISSION } from '@/config';
import { toast } from '@/components/ui/Toast';
import { RulesEditor } from '@/components/rules/RulesEditor';
import { cn } from '@/lib/utils';

export function SettingsPage() {
  const { currentUser } = useDemoUserStore();
  const { theme, setTheme } = useUIStore();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const [simulateForm, setSimulateForm] = useState({
    sender: 'cliente@empresa.com',
    sender_name: 'Cliente Demo',
    subject: 'Solicitud de cotización póliza empresarial',
    body: 'Estimados, solicitamos cotización para póliza empresarial. Quedamos atentos.',
  });

  const { data: accounts, isLoading: accountsLoading } = useQuery({
    queryKey: ['gmail-accounts'],
    queryFn: () => gmailApi.accounts(),
  });

  const connected = (accounts?.data || []).filter((a: { is_connected: boolean }) => a.is_connected);

  const syncMutation = useMutation({
    mutationFn: (accountId: string) => gmailApi.sync(accountId),
    onSuccess: (data) => {
      const synced = data?.data?.synced || 0;
      toast('success', 'Sincronización completada', `${synced} correo(s) capturados y procesados como casos`);
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['case-metrics'] });
    },
    onError: () => toast('error', 'Error al sincronizar'),
  });

  const syncAllMutation = useMutation({
    mutationFn: () => gmailApi.demoSyncAll(),
    onSuccess: (data) => {
      const synced = data?.data?.synced || 0;
      toast('success', 'Sync completo (demo)', `${synced} correo(s) desde Paula, Cristina y Marcela`);
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['case-metrics'] });
    },
    onError: () => toast('error', 'Error al sincronizar buzones'),
  });

  const demoConnectMutation = useMutation({
    mutationFn: () => gmailApi.demoConnect(),
    onSuccess: () => {
      toast('success', 'Buzones conectados', 'Paula, Cristina y Marcela — captura demo activa');
      queryClient.invalidateQueries({ queryKey: ['gmail-accounts'] });
    },
    onError: () => toast('error', 'Error al conectar buzones demo'),
  });

  const simulateMutation = useMutation({
    mutationFn: () => casesApi.simulate(simulateForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['case-metrics'] });
      toast('success', 'Correo simulado', 'Se creó un nuevo caso con resumen, tareas e historial automático');
    },
    onError: () => toast('error', 'Error al simular correo'),
  });

  const connectMutation = useMutation({
    mutationFn: () => gmailApi.getAuthUrl(),
    onSuccess: (res) => {
      const url = res.data?.auth_url;
      if (url && url !== '#') {
        window.location.href = url;
      } else {
        toast('error', 'No se pudo obtener la URL de autorización');
      }
    },
    onError: () => toast('error', 'Error al conectar con Gmail'),
  });

  useEffect(() => {
    const gmailStatus = searchParams.get('gmail');
    if (!gmailStatus) return;

    if (gmailStatus === 'connected') {
      const email = searchParams.get('email') || 'Gmail';
      const synced = searchParams.get('synced');
      toast(
        'success',
        'Gmail conectado',
        synced ? `${email} · ${synced} correos sincronizados` : email,
      );
      queryClient.invalidateQueries({ queryKey: ['gmail-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['cases'] });
    } else if (gmailStatus === 'error') {
      toast('error', 'Error al conectar Gmail', searchParams.get('msg') || 'Intenta de nuevo');
    }

    searchParams.delete('gmail');
    searchParams.delete('email');
    searchParams.delete('synced');
    searchParams.delete('msg');
    setSearchParams(searchParams, { replace: true });
  }, [searchParams, setSearchParams, queryClient]);

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">Configuración</h1>
        <p className="text-sm text-slate-500 mt-1">Conexiones multi-buzón, reglas y preferencias</p>
        <p className="text-xs text-slate-400 mt-2 max-w-2xl">{PLATFORM_MISSION}</p>
      </div>

      <Card>
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center">
            <Mail size={18} className="text-indigo-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Buzones de analistas</h2>
            <p className="text-xs text-slate-500">Captura sin mover correos — cada analista sigue en Outlook</p>
          </div>
        </div>
        <div className="space-y-2">
          {Object.entries(ANALYST_MAILBOXES).map(([id, box]) => (
            <div
              key={id}
              className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800"
            >
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">{box.label}</p>
                <p className="text-xs text-slate-500">{box.email}</p>
              </div>
              <span className="text-[10px] font-medium px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                {USE_MOCK ? 'Demo conectado' : 'Pendiente OAuth'}
              </span>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-slate-400 mt-3">
          Futuro: integración Outlook vía Microsoft Graph API · consolidación en tablero central
        </p>
      </Card>

      <Card>
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center">
            <Mail size={18} className="text-blue-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              {USE_MOCK ? 'Captura de correos (demo)' : 'Conexión Gmail'}
            </h2>
            <p className="text-xs text-slate-500">
              {USE_MOCK
                ? 'Simula Outlook/Gmail: captura → clasificación → asignación → caso con resumen IA'
                : 'Sincronización de correos para crear casos trazables'}
            </p>
          </div>
          {USE_MOCK && connected.length > 0 && (
            <Button
              variant="secondary"
              size="sm"
              loading={syncAllMutation.isPending}
              onClick={() => syncAllMutation.mutate()}
            >
              <RefreshCw size={14} /> Sync todos
            </Button>
          )}
        </div>

        {accountsLoading ? (
          <Skeleton className="h-16" />
        ) : USE_MOCK && connected.length > 0 ? (
          <div className="space-y-2">
            {(accounts?.data || []).map((acc: { id: string; email: string; is_connected: boolean; last_sync_at: string | null }) => (
              <div
                key={acc.id}
                className="flex items-center justify-between p-3 rounded-lg bg-emerald-50/80 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{acc.email}</p>
                    <p className="text-xs text-slate-500">
                      Conectado (demo)
                      {acc.last_sync_at && ` · Última sync ${new Date(acc.last_sync_at).toLocaleString('es-CO', { hour: '2-digit', minute: '2-digit' })}`}
                    </p>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  loading={syncMutation.isPending}
                  onClick={() => syncMutation.mutate(acc.id)}
                >
                  <RefreshCw size={14} /> Sincronizar
                </Button>
              </div>
            ))}
            <p className="text-[11px] text-slate-400 pt-1">
              Cada sync captura 1–3 correos del pool demo, los clasifica por reglas y los asigna al analista correspondiente.
            </p>
          </div>
        ) : connected.length > 0 ? (
          <div className="flex items-center justify-between p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40">
            <div className="flex items-center gap-3">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  {connected[0].email}
                </p>
                <p className="text-xs text-slate-500">Conectado · Sincronización automática activa</p>
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              loading={syncMutation.isPending}
              onClick={() => syncMutation.mutate(connected[0].id)}
            >
              <RefreshCw size={14} /> Sincronizar
            </Button>
          </div>
        ) : (
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {USE_MOCK
                ? 'Conecta los buzones demo de Paula, Cristina y Marcela para simular la captura automática de correos.'
                : 'Conecta Gmail para que los correos entrantes se conviertan en casos con resumen y tareas automáticas.'}
            </p>
            {USE_MOCK ? (
              <Button
                onClick={() => demoConnectMutation.mutate()}
                loading={demoConnectMutation.isPending}
                className="shadow-md shadow-violet-600/20"
              >
                <Link2 size={14} /> Conectar buzones demo (3 analistas)
              </Button>
            ) : (
              <Button
                onClick={() => connectMutation.mutate()}
                loading={connectMutation.isPending}
                className="shadow-md shadow-blue-600/20"
              >
                <Link2 size={14} /> Conectar cuenta Gmail
              </Button>
            )}
          </div>
        )}
      </Card>

      <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-violet-50 dark:bg-violet-950/40 flex items-center justify-center">
              <Zap size={18} className="text-violet-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Simular correo entrante</h2>
              <p className="text-xs text-slate-500">Prueba la captura y clasificación automática</p>
            </div>
          </div>
          <div className="space-y-3">
            <Input
              label="Remitente"
              value={simulateForm.sender}
              onChange={(e) => setSimulateForm((s) => ({ ...s, sender: e.target.value }))}
            />
            <Input
              label="Nombre"
              value={simulateForm.sender_name}
              onChange={(e) => setSimulateForm((s) => ({ ...s, sender_name: e.target.value }))}
            />
            <Input
              label="Asunto"
              value={simulateForm.subject}
              onChange={(e) => setSimulateForm((s) => ({ ...s, subject: e.target.value }))}
            />
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Cuerpo</label>
              <textarea
                value={simulateForm.body}
                onChange={(e) => setSimulateForm((s) => ({ ...s, body: e.target.value }))}
                rows={3}
                className="w-full text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
              />
            </div>
            <Button onClick={() => simulateMutation.mutate()} loading={simulateMutation.isPending}>
              <Plus size={14} /> Simular ingreso de correo
            </Button>
          </div>
        </Card>

      <Card>
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center">
            <Shield size={18} className="text-amber-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Reglas de automatización</h2>
            <p className="text-xs text-slate-500">Clasifica correos y asigna analista automáticamente</p>
          </div>
        </div>
        <RulesEditor canEdit={currentUser.role === 'admin'} />
      </Card>

      <Card>
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Apariencia</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setTheme('light')}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all',
              theme === 'light'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50',
            )}
          >
            <Sun size={16} /> Claro
          </button>
          <button
            onClick={() => setTheme('dark')}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all',
              theme === 'dark'
                ? 'border-blue-500 bg-blue-950/40 text-blue-300'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50',
            )}
          >
            <Moon size={16} /> Oscuro
          </button>
        </div>
      </Card>

      <Card className="bg-slate-50 dark:bg-slate-900/50">
        <p className="text-xs text-slate-500">
          <strong className="text-slate-700 dark:text-slate-300">{APP_NAME}</strong> · Demo operativo
          · Usuario: {currentUser.full_name} · Autenticación desactivada para demostración
        </p>
      </Card>
    </div>
  );
}
