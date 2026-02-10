'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Loader2, UserPlus } from 'lucide-react';

const schema = z.object({
  nome: z.string().min(3, 'Nome é obrigatório'),
  cpf: z.string().min(11, 'CPF é obrigatório'),
  email: z.string().email('E-mail inválido'),
  telefone: z.string().optional(),
  celular: z.string().optional(),
  endereco: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  cep: z.string().optional(),
  profissao: z.string().min(1, 'Profissão é obrigatória'),
  registro: z.string().optional(),
  empresa: z.string().optional(),
  usuario: z.string().min(4, 'Usuário deve ter pelo menos 4 caracteres'),
  senha: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  senhaConfirm: z.string(),
}).refine((data) => data.senha === data.senhaConfirm, {
  message: 'Senhas não conferem',
  path: ['senhaConfirm'],
});

type FormData = z.infer<typeof schema>;

export default function CadastroProfissional() {
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
      const res = await fetch('/api/cadastro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, tipo: 'PR' }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Erro no cadastro');
      toast.success('Cadastro realizado com sucesso! Aguarde a aprovação.');
      reset();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao realizar cadastro.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Dados Pessoais */}
      <h3 className="text-sm font-semibold text-brand-400 uppercase tracking-wider">
        Dados Pessoais
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="form-label">Nome Completo *</label>
          <input {...register('nome')} className="form-input" />
          {errors.nome && <p className="text-red-400 text-xs mt-1">{errors.nome.message}</p>}
        </div>
        <div>
          <label className="form-label">CPF *</label>
          <input {...register('cpf')} className="form-input" placeholder="000.000.000-00" />
          {errors.cpf && <p className="text-red-400 text-xs mt-1">{errors.cpf.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="form-label">Profissão *</label>
          <select {...register('profissao')} className="form-input">
            <option value="">Selecione...</option>
            <option value="Arquiteto(a)">Arquiteto(a)</option>
            <option value="Designer de Interiores">Designer de Interiores</option>
            <option value="Decorador(a)">Decorador(a)</option>
            <option value="Paisagista">Paisagista</option>
            <option value="Engenheiro(a)">Engenheiro(a)</option>
            <option value="Outro">Outro</option>
          </select>
          {errors.profissao && <p className="text-red-400 text-xs mt-1">{errors.profissao.message}</p>}
        </div>
        <div>
          <label className="form-label">Registro Profissional</label>
          <input {...register('registro')} className="form-input" placeholder="CAU / ABD / etc." />
        </div>
      </div>

      <div>
        <label className="form-label">Escritório / Empresa Vinculada</label>
        <input {...register('empresa')} className="form-input" />
      </div>

      {/* Contato */}
      <div className="pt-4 gold-line" />
      <h3 className="text-sm font-semibold text-brand-400 uppercase tracking-wider">
        Contato
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="form-label">E-mail *</label>
          <input {...register('email')} type="email" className="form-input" />
          {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <label className="form-label">Telefone</label>
          <input {...register('telefone')} className="form-input" />
        </div>
      </div>

      <div>
        <label className="form-label">Celular</label>
        <input {...register('celular')} className="form-input" />
      </div>

      {/* Endereço */}
      <div className="pt-4 gold-line" />
      <h3 className="text-sm font-semibold text-brand-400 uppercase tracking-wider">
        Endereço
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2">
          <label className="form-label">Endereço</label>
          <input {...register('endereco')} className="form-input" />
        </div>
        <div>
          <label className="form-label">Número</label>
          <input {...register('numero')} className="form-input" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="form-label">Complemento</label>
          <input {...register('complemento')} className="form-input" />
        </div>
        <div>
          <label className="form-label">Bairro</label>
          <input {...register('bairro')} className="form-input" />
        </div>
        <div>
          <label className="form-label">CEP</label>
          <input {...register('cep')} className="form-input" placeholder="00000-000" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="form-label">Cidade</label>
          <input {...register('cidade')} className="form-input" />
        </div>
        <div>
          <label className="form-label">Estado</label>
          <select {...register('estado')} className="form-input">
            <option value="">Selecione...</option>
            {['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map(uf => (
              <option key={uf} value={uf}>{uf}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Acesso */}
      <div className="pt-4 gold-line" />
      <h3 className="text-sm font-semibold text-brand-400 uppercase tracking-wider">
        Dados de Acesso
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="form-label">Usuário *</label>
          <input {...register('usuario')} className="form-input" />
          {errors.usuario && <p className="text-red-400 text-xs mt-1">{errors.usuario.message}</p>}
        </div>
        <div>
          <label className="form-label">Senha *</label>
          <input {...register('senha')} type="password" className="form-input" />
          {errors.senha && <p className="text-red-400 text-xs mt-1">{errors.senha.message}</p>}
        </div>
        <div>
          <label className="form-label">Confirmar Senha *</label>
          <input {...register('senhaConfirm')} type="password" className="form-input" />
          {errors.senhaConfirm && <p className="text-red-400 text-xs mt-1">{errors.senhaConfirm.message}</p>}
        </div>
      </div>

      <div className="pt-4">
        <button type="submit" disabled={loading} className="btn-primary w-full gap-2 py-4">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
          {loading ? 'Enviando...' : 'Cadastrar como Profissional'}
        </button>
      </div>
    </form>
  );
}
