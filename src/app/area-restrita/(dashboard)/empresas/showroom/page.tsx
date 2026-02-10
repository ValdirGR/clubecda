'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { Loader2, Plus, Trash2, ImageIcon } from 'lucide-react';
import { getImageUrl } from '@/lib/utils';

interface ShowroomItem {
  id: number;
  descricao?: string | null;
  foto?: string | null;
}

export default function EmpresaShowroomPage() {
  const [items, setItems] = useState<ShowroomItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [descricao, setDescricao] = useState('');
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    fetchItems();
  }, []);

  async function fetchItems() {
    try {
      const res = await fetch('/api/showroom');
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch {
      toast.error('Erro ao buscar showroom');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormLoading(true);
    try {
      let imageUrl = '';
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'showroom');
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          imageUrl = uploadData.filename;
        }
      }

      const res = await fetch('/api/showroom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ descricao, imagem: imageUrl }),
      });

      if (!res.ok) throw new Error();
      toast.success('Item adicionado ao showroom!');
      setShowForm(false);
      setDescricao('');
      setFile(null);
      fetchItems();
    } catch {
      toast.error('Erro ao adicionar item');
    } finally {
      setFormLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Showroom</h1>
          <p className="text-dark-400 text-sm">Gerencie seus produtos e imagens</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary gap-2">
          <Plus className="w-4 h-4" />
          Adicionar Item
        </button>
      </div>

      {showForm && (
        <div className="glass rounded-xl p-6 animate-slide-down">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="form-label">Descrição</label>
              <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} className="form-input resize-none" rows={3} />
            </div>
            <div>
              <label className="form-label">Imagem</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="form-input file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:bg-brand-400 file:text-dark-900 file:text-sm file:font-medium"
              />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={formLoading} className="btn-primary gap-2">
                {formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Adicionar
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-ghost">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-dark-400" /></div>
      ) : items.length === 0 ? (
        <div className="glass rounded-xl py-12 text-center">
          <ImageIcon className="w-12 h-12 text-dark-600 mx-auto mb-3" />
          <p className="text-dark-400">Nenhum item no showroom.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item) => (
            <div key={item.id} className="glass rounded-xl overflow-hidden group">
              <div className="relative aspect-square bg-dark-800">
                {item.foto ? (
                  <Image
                    src={getImageUrl('showroom', item.foto)}
                    alt={item.descricao || 'Showroom'}
                    fill
                    className="object-cover"
                    sizes="(max-width:640px) 50vw, 25vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-dark-600">
                    <ImageIcon className="w-8 h-8" />
                  </div>
                )}
              </div>
              {item.descricao && (
                <div className="p-3">
                  <h4 className="text-sm font-medium text-white truncate">{item.descricao}</h4>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
