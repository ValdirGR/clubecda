import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET - Relatório por Escritórios
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !['admin', 'user'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const escritorioId = searchParams.get('escritorio'); // 'todos' ou ID
    const dataInicio = searchParams.get('dataInicio');
    const dataFim = searchParams.get('dataFim');
    const tipo = searchParams.get('tipo') || 'detalhado';

    if (!dataInicio || !dataFim) {
      return NextResponse.json({ error: 'Data de início e fim são obrigatórias' }, { status: 400 });
    }

    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);
    fim.setHours(23, 59, 59, 999);

    // Build WHERE conditions for pontos
    const pontosWhere: any = {
      tipo: { in: ['2', 'ES'] },
      data: { gte: inicio, lte: fim },
    };

    if (escritorioId && escritorioId !== 'todos') {
      pontosWhere.id_profissional = parseInt(escritorioId);
    }

    // Single query: fetch all matching pontos at once
    const pontos = await prisma.ponto.findMany({
      where: pontosWhere,
      include: {
        empresaRel: { select: { id: true, empresa: true } },
      },
      orderBy: { id: 'asc' },
    });

    // Fetch escritorio names for all relevant IDs in a single query
    const escIds = [...new Set(pontos.map((p) => p.id_profissional).filter(Boolean))] as number[];
    const escritorios = escIds.length > 0
      ? await prisma.escritorio.findMany({
          where: { id: { in: escIds } },
          select: { id: true, empresa: true, nome_fantasia: true },
        })
      : [];
    const escMap = new Map(escritorios.map((e) => [e.id, e]));

    // Group pontos by escritorio
    const grupoMap = new Map<number, {
      escritorioId: number;
      escritorioNome: string;
      nomeFantasia?: string;
      totalValor: number;
      totalPontos: number;
      operacoes: any[];
    }>();

    for (const p of pontos) {
      const escId = p.id_profissional || 0;
      if (!grupoMap.has(escId)) {
        const esc = escMap.get(escId);
        grupoMap.set(escId, {
          escritorioId: escId,
          escritorioNome: esc?.empresa || `Escritório #${escId}`,
          nomeFantasia: esc?.nome_fantasia || undefined,
          totalValor: 0,
          totalPontos: 0,
          operacoes: [],
        });
      }
      const grupo = grupoMap.get(escId)!;
      grupo.totalValor += Number(p.valor) || 0;
      grupo.totalPontos += Number(p.pontos) || 0;

      if (tipo === 'detalhado') {
        grupo.operacoes.push({
          id: p.id,
          data: p.data,
          empresaId: p.id_empresa,
          empresaNome: p.empresaRel?.empresa || 'N/A',
          valor: Number(p.valor) || 0,
          pontos: Number(p.pontos) || 0,
          nota: p.nota || '',
        });
      }
    }

    const resultado = Array.from(grupoMap.values()).sort((a, b) =>
      (a.escritorioNome || '').localeCompare(b.escritorioNome || '', 'pt-BR')
    );

    const totalGeral = {
      valor: resultado.reduce((acc, e) => acc + e.totalValor, 0),
      pontos: resultado.reduce((acc, e) => acc + e.totalPontos, 0),
      registros: pontos.length,
    };

    return NextResponse.json({
      tipo,
      periodo: { inicio: dataInicio, fim: dataFim },
      escritorios: resultado,
      totalGeral,
    });
  } catch (error) {
    console.error('Erro ao gerar relatório por escritórios:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
