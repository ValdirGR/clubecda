'use client';

import { useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { LogIn, Loader2, Building2, User2, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/ui/Animations';

const schema = z.object({
  usuario: z.string().min(1, 'Usuário é obrigatório'),
  senha: z.string().min(1, 'Senha é obrigatória'),
});

type FormData = z.infer<typeof schema>;

const tipoOptions = [
  { value: 'EM', label: 'Empresa', icon: Building2 },
  { value: 'ES', label: 'Escritório', icon: Briefcase },
  { value: 'PR', label: 'Profissional', icon: User2 },
] as const;

export default function AreaRestritaPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [tipo, setTipo] = useState<string>('PR');
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  // Se já logado, redirecionar para o painel correto
  if (status === 'authenticated' && session?.user) {
    const role = session.user.role;
    if (role === 'empresa') router.push('/area-restrita/empresas');
    else if (role === 'escritorio') router.push('/area-restrita/escritorios');
    else if (role === 'profissional') router.push('/area-restrita/profissionais');
    else router.push('/');
    return null;
  }

  async function onSubmit(data: FormData) {
    setLoading(true);
    try {
      const result = await signIn('credentials', {
        redirect: false,
        usuario: data.usuario,
        senha: data.senha,
        tipo,
      });

      if (result?.error) {
        toast.error('Usuário ou senha inválidos.');
      } else {
        toast.success('Login realizado com sucesso!');
        // O redirect será feito pelo efeito acima
        router.refresh();
      }
    } catch {
      toast.error('Erro ao fazer login.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Área Restrita"
        subtitle="Acesse seu painel de controle"
      />

      <section className="py-16">
        <div className="max-w-md mx-auto px-4">
          <div className="glass rounded-xl p-8">
            {/* Tipo Selector */}
            <div className="flex rounded-lg overflow-hidden mb-8 bg-dark-800">
              {tipoOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setTipo(opt.value)}
                  className={cn(
                    'flex-1 py-3 text-xs font-semibold transition-all flex flex-col items-center gap-1',
                    tipo === opt.value
                      ? 'bg-brand-400 text-dark-900'
                      : 'text-dark-400 hover:text-white hover:bg-dark-700'
                  )}
                >
                  <opt.icon className="w-4 h-4" />
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="form-label">Usuário</label>
                <input
                  {...register('usuario')}
                  className="form-input"
                  placeholder="Seu usuário"
                  autoComplete="username"
                />
                {errors.usuario && (
                  <p className="text-red-400 text-xs mt-1">{errors.usuario.message}</p>
                )}
              </div>

              <div>
                <label className="form-label">Senha</label>
                <input
                  {...register('senha')}
                  type="password"
                  className="form-input"
                  placeholder="Sua senha"
                  autoComplete="current-password"
                />
                {errors.senha && (
                  <p className="text-red-400 text-xs mt-1">{errors.senha.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full gap-2 py-3"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <LogIn className="w-4 h-4" />
                )}
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
            </form>

            <p className="text-xs text-dark-500 text-center mt-6">
              Não possui conta?{' '}
              <a
                href="/cadastro"
                className="text-brand-400 hover:text-brand-300 transition-colors"
              >
                Cadastre-se aqui
              </a>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
