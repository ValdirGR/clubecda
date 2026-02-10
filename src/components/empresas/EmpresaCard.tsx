'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Building2, ExternalLink } from 'lucide-react';
import { getImageUrl, truncateText } from '@/lib/utils';

interface EmpresaCardProps {
  id: number;
  nome: string;
  texto?: string | null;
  foto?: string | null;
}

export default function EmpresaCard({
  id,
  nome,
  texto,
  foto,
}: EmpresaCardProps) {

  return (
    <Link href={`/empresas/${id}`} className="group block">
      <div className="glass rounded-xl overflow-hidden card-hover h-full flex flex-col">
        {/* Logo area */}
        <div className="relative h-48 bg-dark-800 flex items-center justify-center p-6">
          {foto ? (
            <Image
              src={getImageUrl('empresas', foto)}
              alt={nome}
              fill
              className="object-contain p-4"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <Building2 className="w-16 h-16 text-dark-600" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-dark-800/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* Content */}
        <div className="p-5 flex-1 flex flex-col">
          <h3 className="text-lg font-semibold text-white group-hover:text-brand-400 transition-colors mb-2">
            {nome}
          </h3>
          {texto && (
            <p className="text-sm text-dark-400 mb-3 flex-1">
              {truncateText(texto, 100)}
            </p>
          )}
          <div className="mt-4 pt-3 border-t border-dark-700 flex items-center gap-1.5 text-xs font-medium text-brand-400 group-hover:text-brand-300 transition-colors">
            Ver detalhes
            <ExternalLink className="w-3 h-3" />
          </div>
        </div>
      </div>
    </Link>
  );
}
