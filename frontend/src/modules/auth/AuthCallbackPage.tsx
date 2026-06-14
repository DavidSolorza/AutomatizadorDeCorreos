import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { authApi } from '@/services/api';
import { useAuthStore } from '@/store';

export function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setUser } = useAuthStore();
  const [error, setError] = useState('');

  useEffect(() => {
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');

    if (accessToken && refreshToken) {
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);
      authApi.me().then(({ data }) => {
        setUser(data);
        navigate('/dashboard', { replace: true });
      }).catch(() => {
        setError('Error al obtener usuario');
      });
    } else if (searchParams.get('error')) {
      setError('Autenticación cancelada');
    } else {
      setError('No se recibieron tokens');
    }
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <div className="text-center">
          <p className="text-sm text-red-500 mb-4">{error}</p>
          <button onClick={() => navigate('/login')} className="text-sm text-neutral-600 dark:text-neutral-400 hover:underline">
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
      <div className="flex items-center gap-3 text-neutral-500">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">Iniciando sesión...</span>
      </div>
    </div>
  );
}
