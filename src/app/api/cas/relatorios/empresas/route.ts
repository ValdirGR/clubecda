import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET - Relatório por Empresas
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !['admin', 'user'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const empresaId = searchParams.get('empresa'); // 'todas' ou ID
    const dataInicio = searchParams.get('dataInicio');
    const dataFim = searchParams.get('dataFim');
    const tipo = searchParams.get('tipo') || 'detalhado'; // 'detalhado' ou 'simplificado'

    if (!dataInicio || !dataFim) {
      return NextResponse.json({ error: 'Data de início e fim são obrigatórias' }, { status: 400 });
    }

    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);
    fim.setHours(23, 59, 59, 999);

    const pontosWhere: any = {
      data: { gte: inicio, lte: fim },
    };

    if (empresaId && empresaId !== 'todas') {
      pontosWhere.id_empresa = parseInt(empresaId);
    }

    // Buscar pontos com dados relacionados
    const pontos = await prisma.ponto.findMany({
      where: pontosWhere,
      include: {
        empresaRel: {
          select: { id: true, empresa: true },
        },
      },
      orderBy: { id: 'asc' },
    });

    // Enriquecer com dados de profissional/escritório
    const pontosEnriquecidos = await Promise.all(
      pontos.map(async (p) => {
        let profissionalNome = '';
        let tipoLabel = '';

        if (p.id_profissional) {
          if (p.tipo === '1' || p.tipo === 'PR') {
            const prof = await prisma.profissional.findUnique({
              where: { id: p.id_profissional },
              select: { id: true, nome: true },
            });
            profissionalNome = prof?.nome || 'N/A';
            tipoLabel = 'Profissional';
          } else if (p.tipo === '2' || p.tipo === 'ES') {
            const esc = await prisma.escritorio.findUnique({
              where: { id: p.id_profissional },
              select: { id: true, empresa: true },
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

    // Agrupar por empresa
    const porEmpresa: Record<string, {
      empresaId: number;
      empresaNome: string;
      totalValor: number;
      totalPontos: number;
      pagamento: number;
      operacoes: any[];
    }> = {};

    for (const p of pontosEnriquecidos) {
      const key = String(p.empresaId || 0);
      if (!porEmpresa[key]) {
        porEmpresa[key] = {
          empresaId: p.empresaId || 0,
          empresaNome: p.empresaNome,
          totalValor: 0,
          totalPontos: 0,
          pagamento: 0,
          operacoes: [],
        };
      }
      porEmpresa[key].totalValor += p.valor;
      porEmpresa[key].totalPontos += p.pontos;
      if (tipo === 'detalhado') {
        porEmpresa[key].operacoes.push(p);
      }
    }

    // Calcular pagamento conforme fórmula original:
    // Se valor > R$100.000: pagamento = (valor - 100.000) * 0,0015 + 500
    // Senão: pagamento = R$500,00
    for (const key of Object.keys(porEmpresa)) {
      const e = porEmpresa[key];
      if (e.totalValor > 100000) {
        e.pagamento = (e.totalValor - 100000) * 0.0015 + 500;
      } else {
        e.pagamento = 500;
      }
    }

    // Ordenar por pontos (descrescente)
    const resultado = Object.values(porEmpresa).sort((a, b) => b.totalPontos - a.totalPontos);

    // Totais gerais
    const totalGeral = {
      valor: resultado.reduce((acc, e) => acc + e.totalValor, 0),
      pontos: resultado.reduce((acc, e) => acc + e.totalPontos, 0),
      pagamento: resultado.reduce((acc, e) => acc + e.pagamento, 0),
      registros: pontosEnriquecidos.length,
    };

    return NextResponse.json({
      tipo,
      periodo: { inicio: dataInicio, fim: dataFim },
      empresas: resultado,
      totalGeral,
    });
  } catch (error) {
    console.error('Erro ao gerar relatório por empresas:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
