'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Send, Loader2 } from 'lucide-react';

const schema = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('E-mail inválido'),
  telefone: z.string().optional(),
  celular: z.string().optional(),
  assunto: z.string().min(3, 'Assunto é obrigatório'),
  mensagem: z.string().min(10, 'Mensagem deve ter pelo menos 10 caracteres'),
});

type FormData = z.infer<typeof schema>;

export default function ContatoForm() {
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    setLoading(true);
    try {
      const res = await fetch('/api/contato', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error('Erro ao enviar mensagem');

      toast.success('Mensagem enviada com sucesso!');
      reset();
    } catch {
      toast.error('Erro ao enviar mensagem. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="form-label">Nome *</label>
          <input {...register('nome')} className="form-input" placeholder="Seu nome completo" />
          {errors.nome && <p className="text-red-400 text-xs mt-1">{errors.nome.message}</p>}
        </div>
        <div>
          <label className="form-label">E-mail *</label>
          <input {...register('email')} type="email" className="form-input" placeholder="seu@email.com" />
          {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="form-label">Telefone</label>
          <input {...register('telefone')} className="form-input" placeholder="(11) 0000-0000" />
        </div>
        <div>
          <label className="form-label">Celular</label>
          <input {...register('celular')} className="form-input" placeholder="(11) 90000-0000" />
        </div>
      </div>

      <div>
        <label className="form-label">Assunto *</label>
        <input {...register('assunto')} className="form-input" placeholder="Assunto da mensagem" />
        {errors.assunto && <p className="text-red-400 text-xs mt-1">{errors.assunto.message}</p>}
      </div>

      <div>
        <label className="form-label">Mensagem *</label>
        <textarea
          {...register('mensagem')}
          rows={6}
          className="form-input resize-none"
          placeholder="Sua mensagem..."
        />
        {errors.mensagem && <p className="text-red-400 text-xs mt-1">{errors.mensagem.message}</p>}
      </div>

      <button type="submit" disabled={loading} className="btn-primary gap-2">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        {loading ? 'Enviando...' : 'Enviar Mensagem'}
      </button>
    </form>
  );
}
