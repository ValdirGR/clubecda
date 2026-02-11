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

    let profissionais;
    if (profissionalId && profissionalId !== 'todos') {
      profissionais = await prisma.profissional.findMany({
        where: { id: parseInt(profissionalId) },
        select: { id: true, nome: true },
      });
    } else {
      profissionais = await prisma.profissional.findMany({
        where: { ativo: 's' },
        orderBy: { nome: 'asc' },
        select: { id: true, nome: true },
      });
    }

    const resultado = await Promise.all(
      profissionais.map(async (prof) => {
        const pontos = await prisma.ponto.findMany({
          where: {
            id_profissional: prof.id,
            tipo: { in: ['1', 'PR'] },
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
          profissionalId: prof.id,
          profissionalNome: prof.nome,
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

    const comPontos = resultado.filter((p) => p.totalPontos > 0 || p.totalValor > 0);

    const totalGeral = {
      valor: comPontos.reduce((acc, p) => acc + p.totalValor, 0),
      pontos: comPontos.reduce((acc, p) => acc + p.totalPontos, 0),
      registros: comPontos.reduce((acc, p) => acc + p.operacoes.length, 0),
    };

    return NextResponse.json({
      tipo,
      periodo: { inicio: dataInicio, fim: dataFim },
      profissionais: comPontos,
      totalGeral,
    });
  } catch (error) {
    console.error('Erro ao gerar relatório por profissionais:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
