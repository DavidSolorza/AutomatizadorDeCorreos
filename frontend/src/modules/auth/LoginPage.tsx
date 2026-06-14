import { Mail } from 'lucide-react';
import { useState } from 'react';

export function LoginPage() {
  const [comingSoon, setComingSoon] = useState<string | null>(null);

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white dark:bg-neutral-950">
      <div className="hidden lg:flex flex-col justify-center p-16 bg-neutral-50 dark:bg-neutral-900">
        <div className="max-w-md mx-auto">
          <div className="h-12 w-12 rounded-xl bg-neutral-900 dark:bg-white flex items-center justify-center mb-8">
            <Mail className="h-6 w-6 text-white dark:text-neutral-900" />
          </div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-3 tracking-tight">
            Email Classifier
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed">
            Gestiona y clasifica tus correos automáticamente. Conecta tu Gmail y organiza tu bandeja de entrada con reglas inteligentes.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="h-10 w-10 rounded-xl bg-neutral-900 dark:bg-white flex items-center justify-center">
              <Mail className="h-5 w-5 text-white dark:text-neutral-900" />
            </div>
            <span className="text-lg font-semibold text-neutral-900 dark:text-white">Email Classifier</span>
          </div>

          <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-1">Iniciar sesión</h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-8">Elige cómo quieres iniciar sesión</p>

          <button
            onClick={() => window.location.href = '/api/v1/auth/google/login'}
            className="w-full flex items-center justify-center gap-3 h-11 px-4 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors mb-6"
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-200">Continuar con Google</span>
          </button>

          <button
            onClick={() => setComingSoon('Microsoft')}
            className="w-full flex items-center justify-center gap-3 h-11 px-4 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors mb-3"
          >
            <svg width="20" height="20" viewBox="0 0 23 23">
              <rect x="1" y="1" width="10" height="10" fill="#F25022"/>
              <rect x="12" y="1" width="10" height="10" fill="#7FBA00"/>
              <rect x="1" y="12" width="10" height="10" fill="#00A4EF"/>
              <rect x="12" y="12" width="10" height="10" fill="#FFB900"/>
            </svg>
            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-200">Continuar con Microsoft</span>
          </button>

          <button
            onClick={() => setComingSoon('Outlook')}
            className="w-full flex items-center justify-center gap-3 h-11 px-4 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors mb-6"
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#0078D4" d="M24 7.5v9.75c0 .83-.67 1.5-1.5 1.5h-12c-.83 0-1.5-.67-1.5-1.5V7.5c0-.83.67-1.5 1.5-1.5h12c.83 0 1.5.67 1.5 1.5z"/>
              <path fill="#0078D4" d="M12 4.5v15H3c-.83 0-1.5-.67-1.5-1.5V6c0-.83.67-1.5 1.5-1.5h9z"/>
              <path fill="#fff" d="M6 9h3v6H6V9zm5 0h3v6h-3V9z"/>
              <path fill="#fff" d="M4.5 9H6v6H4.5V9zm10.5 0h1.5v6H15V9z"/>
            </svg>
            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-200">Continuar con Outlook</span>
          </button>

          {comingSoon && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setComingSoon(null)}>
              <div className="bg-white dark:bg-neutral-900 rounded-2xl p-8 max-w-sm mx-4 shadow-2xl text-center" onClick={(e) => e.stopPropagation()}>
                <div className="h-16 w-16 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-5">
                  {comingSoon === 'Microsoft' ? (
                    <svg width="28" height="28" viewBox="0 0 23 23">
                      <rect x="1" y="1" width="10" height="10" fill="#F25022"/>
                      <rect x="12" y="1" width="10" height="10" fill="#7FBA00"/>
                      <rect x="1" y="12" width="10" height="10" fill="#00A4EF"/>
                      <rect x="12" y="12" width="10" height="10" fill="#FFB900"/>
                    </svg>
                  ) : (
                    <svg width="28" height="28" viewBox="0 0 24 24">
                      <path fill="#0078D4" d="M24 7.5v9.75c0 .83-.67 1.5-1.5 1.5h-12c-.83 0-1.5-.67-1.5-1.5V7.5c0-.83.67-1.5 1.5-1.5h12c.83 0 1.5.67 1.5 1.5z"/>
                      <path fill="#0078D4" d="M12 4.5v15H3c-.83 0-1.5-.67-1.5-1.5V6c0-.83.67-1.5 1.5-1.5h9z"/>
                    </svg>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
                  {comingSoon === 'Microsoft' ? 'Microsoft Account' : 'Outlook'}
                </h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
                  Esta integración está en desarrollo. Pronto podrás conectar tu cuenta de {comingSoon === 'Microsoft' ? 'Microsoft' : 'Outlook'} para clasificar correos automáticamente.
                </p>
                <button
                  onClick={() => setComingSoon(null)}
                  className="w-full h-10 px-4 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
                >
                  Entendido
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
