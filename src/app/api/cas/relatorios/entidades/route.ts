import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET - Listar entidades para seletores de relatórios
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !['admin', 'user'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const [empresas, escritorios, profissionais] = await Promise.all([
      prisma.empresa.findMany({
        where: { ativo: 's' },
        select: { id: true, empresa: true },
        orderBy: { empresa: 'asc' },
      }),
      prisma.escritorio.findMany({
        where: { ativo: 's' },
        select: { id: true, empresa: true },
        orderBy: { empresa: 'asc' },
      }),
      prisma.profissional.findMany({
        where: { ativo: 's' },
        select: { id: true, nome: true },
        orderBy: { nome: 'asc' },
      }),
    ]);

    return NextResponse.json({ empresas, escritorios, profissionais });
  } catch (error) {
    console.error('Erro ao listar entidades:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
