'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Calendar } from 'lucide-react';
import { getImageUrl, truncateText, formatDate } from '@/lib/utils';

interface NoticiaCardProps {
  id: number;
  titulo: string;
  resumo?: string;
  imagem?: string | null;
  data?: string | Date | null;
}

export default function NoticiaCard({
  id,
  titulo,
  resumo,
  imagem,
  data,
}: NoticiaCardProps) {
  return (
    <Link href={`/noticias/${id}`} className="group block">
      <div className="glass rounded-xl overflow-hidden card-hover h-full flex flex-col">
        {/* Image */}
        <div className="relative h-52 bg-dark-800 overflow-hidden">
          {imagem ? (
            <Image
              src={getImageUrl('noticias', imagem)}
              alt={titulo}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-dark-600 font-display text-2xl">CDA</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-dark-900/80 to-transparent" />
        </div>

        {/* Content */}
        <div className="p-5 flex-1 flex flex-col">
          {data && (
            <div className="flex items-center gap-1.5 text-xs text-dark-500 mb-2">
              <Calendar className="w-3 h-3" />
              <time>{formatDate(data)}</time>
            </div>
          )}
          <h3 className="text-lg font-semibold text-white group-hover:text-brand-400 transition-colors mb-2 line-clamp-2">
            {titulo}
          </h3>
          {resumo && (
            <p className="text-sm text-dark-400 flex-1 line-clamp-3">
              {truncateText(resumo, 150)}
            </p>
          )}
          <span className="mt-4 text-xs font-medium text-brand-400 group-hover:text-brand-300 transition-colors">
            Leia mais →
          </span>
        </div>
      </div>
    </Link>
  );
}
