import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET - Relatório Geral
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !['admin', 'user'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const dataInicio = searchParams.get('dataInicio');
    const dataFim = searchParams.get('dataFim');

    if (!dataInicio || !dataFim) {
      return NextResponse.json({ error: 'Data de início e fim são obrigatórias' }, { status: 400 });
    }

    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);
    fim.setHours(23, 59, 59, 999);

    const pontos = await prisma.ponto.findMany({
      where: {
        data: { gte: inicio, lte: fim },
      },
      include: {
        empresaRel: { select: { id: true, empresa: true } },
      },
      orderBy: { id: 'asc' },
    });

    // Enriquecer com profissional/escritório
    const operacoes = await Promise.all(
      pontos.map(async (p) => {
        let profissionalNome = '';
        let tipoLabel = '';

        if (p.id_profissional) {
          if (p.tipo === '1' || p.tipo === 'PR') {
            const prof = await prisma.profissional.findUnique({
              where: { id: p.id_profissional },
              select: { nome: true },
            });
            profissionalNome = prof?.nome || 'N/A';
            tipoLabel = 'Profissional';
          } else if (p.tipo === '2' || p.tipo === 'ES') {
            const esc = await prisma.escritorio.findUnique({
              where: { id: p.id_profissional },
              select: { empresa: true },
            });
            profissionalNome = esc?.empresa || 'N/A';
            tipoLabel = 'Escritório';
          }
        }

        return {
          id: p.id,
          data: p.data,
          empresaId: p.id_empresa,
          empresaNome: p.empresaRel?.empresa || 'N/A',
          profissionalId: p.id_profissional,
          profissionalNome,
          tipo: tipoLabel,
          valor: Number(p.valor) || 0,
          pontos: Number(p.pontos) || 0,
          nota: p.nota || '',
          status: p.status || '',
        };
      })
    );

    const totalGeral = {
      valor: operacoes.reduce((acc, p) => acc + p.valor, 0),
      pontos: operacoes.reduce((acc, p) => acc + p.pontos, 0),
      registros: operacoes.length,
    };

    return NextResponse.json({
      periodo: { inicio: dataInicio, fim: dataFim },
      operacoes,
      totalGeral,
    });
  } catch (error) {
    console.error('Erro ao gerar relatório geral:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
