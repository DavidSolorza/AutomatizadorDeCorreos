import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { registerSchema, type RegisterForm } from '@/types/schemas';
import { authApi } from '@/services/api';
import { useState } from 'react';

export function RegisterPage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    setError('');
    try {
      await authApi.register(data);
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al registrar');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-neutral-50 dark:bg-neutral-950">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-10 justify-center">
          <div className="h-10 w-10 rounded-xl bg-neutral-900 dark:bg-white flex items-center justify-center">
            <UserPlus className="h-5 w-5 text-white dark:text-neutral-900" />
          </div>
          <span className="text-lg font-semibold text-neutral-900 dark:text-white">Crear cuenta</span>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <Input label="Nombre completo" placeholder="Tu nombre" {...register('full_name')} error={errors.full_name?.message} />
          <Input label="Email" type="email" placeholder="tu@email.com" {...register('email')} error={errors.email?.message} />
          <Input label="Contraseña" type="password" placeholder="••••••••" {...register('password')} error={errors.password?.message} />

          <Button type="submit" loading={isSubmitting} className="w-full">
            {isSubmitting ? 'Creando...' : 'Crear cuenta'}
            {!isSubmitting && <ArrowRight size={16} />}
          </Button>
        </form>

        <p className="mt-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-neutral-900 dark:text-white font-medium hover:underline">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
