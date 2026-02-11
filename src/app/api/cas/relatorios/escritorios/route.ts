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

    // Buscar escritórios de interesse
    let escritorios;
    if (escritorioId && escritorioId !== 'todos') {
      escritorios = await prisma.escritorio.findMany({
        where: { id: parseInt(escritorioId) },
        select: { id: true, empresa: true, nome_fantasia: true },
      });
    } else {
      escritorios = await prisma.escritorio.findMany({
        where: { ativo: 's' },
        orderBy: { empresa: 'asc' },
        select: { id: true, empresa: true, nome_fantasia: true },
      });
    }

    const resultado = await Promise.all(
      escritorios.map(async (esc) => {
        const pontos = await prisma.ponto.findMany({
          where: {
            id_profissional: esc.id,
            tipo: { in: ['2', 'ES'] },
            data: { gte: inicio, lte: fim },
          },
          include: {
            empresaRel: { select: { id: true, empresa: true } },
          },
          orderBy: { id: 'asc' },
        });

        const totalValor = pontos.reduce((acc, p) => acc + (Number(p.valor) || 0), 0);
        const totalPontos = pontos.reduce((acc, p) => acc + (Number(p.pontos) || 0), 0);

        return {
          escritorioId: esc.id,
          escritorioNome: esc.empresa,
          nomeFantasia: esc.nome_fantasia,
          totalValor,
          totalPontos,
          operacoes: tipo === 'detalhado'
            ? pontos.map((p) => ({
                id: p.id,
                data: p.data,
                empresaId: p.id_empresa,
                empresaNome: p.empresaRel?.empresa || 'N/A',
                valor: Number(p.valor) || 0,
                pontos: Number(p.pontos) || 0,
                nota: p.nota || '',
              }))
            : [],
        };
      })
    );

    // Filtrar escritórios sem pontos
    const comPontos = resultado.filter((e) => e.totalPontos > 0 || e.totalValor > 0);

    const totalGeral = {
      valor: comPontos.reduce((acc, e) => acc + e.totalValor, 0),
      pontos: comPontos.reduce((acc, e) => acc + e.totalPontos, 0),
      registros: comPontos.reduce((acc, e) => acc + e.operacoes.length, 0),
    };

    return NextResponse.json({
      tipo,
      periodo: { inicio: dataInicio, fim: dataFim },
      escritorios: comPontos,
      totalGeral,
    });
  } catch (error) {
    console.error('Erro ao gerar relatório por escritórios:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
