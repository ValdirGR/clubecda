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

  const pattern = `%${query}%`;

  try {
    if (type === 'profissional') {
      const isNumeric = !isNaN(Number(query));
      const results = await prisma.$queryRawUnsafe<
        { id: number; nome: string | null; email: string | null; cidade: string | null; uf: string | null }[]
      >(
        isNumeric
          ? `SELECT id, nome, email, cidade, uf FROM profissionais WHERE nome ILIKE $1 OR email ILIKE $1 OR cpf ILIKE $1 OR id = $2 ORDER BY nome ASC LIMIT 10`
          : `SELECT id, nome, email, cidade, uf FROM profissionais WHERE nome ILIKE $1 OR email ILIKE $1 OR cpf ILIKE $1 ORDER BY nome ASC LIMIT 10`,
        pattern,
        ...(isNumeric ? [Number(query)] : [])
      );

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
      const isNumeric = !isNaN(Number(query));
      const results = await prisma.$queryRawUnsafe<
        { id: number; empresa: string | null; nome_fantasia: string | null; email: string | null; cidade: string | null; estado: string | null }[]
      >(
        isNumeric
          ? `SELECT id, empresa, nome_fantasia, email, cidade, estado FROM escritorios WHERE empresa ILIKE $1 OR nome_fantasia ILIKE $1 OR email ILIKE $1 OR cnpj ILIKE $1 OR id = $2 ORDER BY empresa ASC LIMIT 10`
          : `SELECT id, empresa, nome_fantasia, email, cidade, estado FROM escritorios WHERE empresa ILIKE $1 OR nome_fantasia ILIKE $1 OR email ILIKE $1 OR cnpj ILIKE $1 ORDER BY empresa ASC LIMIT 10`,
        pattern,
        ...(isNumeric ? [Number(query)] : [])
      );

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
