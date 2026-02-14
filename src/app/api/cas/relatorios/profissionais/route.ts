import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET - Relatório por Profissionais
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !['admin', 'user'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const profissionalId = searchParams.get('profissional'); // 'todos' ou ID
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
      tipo: { in: ['1', 'PR'] },
      data: { gte: inicio, lte: fim },
    };

    if (profissionalId && profissionalId !== 'todos') {
      pontosWhere.id_profissional = parseInt(profissionalId);
    }

    // Single query: fetch all matching pontos at once
    const pontos = await prisma.ponto.findMany({
      where: pontosWhere,
      include: {
        empresaRel: { select: { id: true, empresa: true } },
      },
      orderBy: { id: 'asc' },
    });

    // Fetch profissional names for all relevant IDs in a single query
    const profIds = [...new Set(pontos.map((p) => p.id_profissional).filter(Boolean))] as number[];
    const profissionais = profIds.length > 0
      ? await prisma.profissional.findMany({
          where: { id: { in: profIds } },
          select: { id: true, nome: true },
        })
      : [];
    const profMap = new Map(profissionais.map((p) => [p.id, p.nome]));

    // Group pontos by profissional
    const grupoMap = new Map<number, {
      profissionalId: number;
      profissionalNome: string;
      totalValor: number;
      totalPontos: number;
      operacoes: any[];
    }>();

    for (const p of pontos) {
      const profId = p.id_profissional || 0;
      if (!grupoMap.has(profId)) {
        grupoMap.set(profId, {
          profissionalId: profId,
          profissionalNome: profMap.get(profId) || `Profissional #${profId}`,
          totalValor: 0,
          totalPontos: 0,
          operacoes: [],
        });
      }
      const grupo = grupoMap.get(profId)!;
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
      (a.profissionalNome || '').localeCompare(b.profissionalNome || '', 'pt-BR')
    );

    const totalGeral = {
      valor: resultado.reduce((acc, p) => acc + p.totalValor, 0),
      pontos: resultado.reduce((acc, p) => acc + p.totalPontos, 0),
      registros: pontos.length,
    };

    return NextResponse.json({
      tipo,
      periodo: { inicio: dataInicio, fim: dataFim },
      profissionais: resultado,
      totalGeral,
    });
  } catch (error) {
    console.error('Erro ao gerar relatório por profissionais:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
