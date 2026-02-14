import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/search?type=profissional|escritorio&q=termo
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'profissional';
  const query = searchParams.get('q') || '';

  if (query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    if (type === 'profissional') {
      const results = await prisma.profissional.findMany({
        where: {
          OR: [
            { nome: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
            { cpf: { contains: query, mode: 'insensitive' } },
            // Search by ID if query is numeric
            ...(isNaN(Number(query)) ? [] : [{ id: Number(query) }]),
          ],
        },
        select: {
          id: true,
          nome: true,
          email: true,
          cidade: true,
          uf: true,
        },
        take: 10,
        orderBy: { nome: 'asc' },
      });

      return NextResponse.json({
        results: results.map((r) => ({
          id: r.id,
          label: r.nome || `Profissional #${r.id}`,
          detail: [r.email, r.cidade && r.uf ? `${r.cidade}/${r.uf}` : r.cidade].filter(Boolean).join(' - '),
          type: 'profissional' as const,
        })),
      });
    }

    if (type === 'escritorio') {
      const results = await prisma.escritorio.findMany({
        where: {
          OR: [
            { empresa: { contains: query, mode: 'insensitive' } },
            { nome_fantasia: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
            { cnpj: { contains: query, mode: 'insensitive' } },
            ...(isNaN(Number(query)) ? [] : [{ id: Number(query) }]),
          ],
        },
        select: {
          id: true,
          empresa: true,
          nome_fantasia: true,
          email: true,
          cidade: true,
          estado: true,
        },
        take: 10,
        orderBy: { empresa: 'asc' },
      });

      return NextResponse.json({
        results: results.map((r) => ({
          id: r.id,
          label: r.nome_fantasia || r.empresa || `Escritório #${r.id}`,
          detail: [r.email, r.cidade && r.estado ? `${r.cidade}/${r.estado}` : r.cidade].filter(Boolean).join(' - '),
          type: 'escritorio' as const,
        })),
      });
    }

    return NextResponse.json({ results: [] });
  } catch (error) {
    console.error('Erro na busca:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
