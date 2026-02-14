import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// Busca o multiplicador correto para a quantidade de empresas únicas no mês
function getMultiplier(
  contaEmpresa: number,
  multipliers: { range_min: number; range_max: number | null; multiplier: number }[]
): number {
  for (const m of multipliers) {
    if (contaEmpresa >= m.range_min && (m.range_max === null || contaEmpresa <= m.range_max)) {
      return m.multiplier;
    }
  }
  return 1.0;
}

// Calcula pontuação de um profissional conforme lógica legada:
// - Pontos ordenados por data ASC
// - Construtora: valor / 4
// - Empresas únicas por mês → multiplicador (da tabela bonus_multipliers)
// - Ao mudar de mês, acumula valor_pontuacao e reseta contadores mensais
// - Pontos final = ValorNovaPontuacao / 100
function calcularPontuacaoProfissional(
  pontos: {
    id: number;
    id_empresa: number | null;
    valor: number;
    data: Date;
    empresaNome: string;
    construtora: string | null;
    nota: string;
  }[],
  multipliers: { range_min: number; range_max: number | null; multiplier: number }[],
  incluirOperacoes: boolean
) {
  let contaEmpresaMes = 0;
  let contaEmpresaTotal = 0;
  let mesmaEmpresa = 0;
  let mesmoMes = 0;
  let valorTot = 0;
  let valorTotNovo = 0;
  let valorPontuacao = 0;
  let valorMesAnteriorPontuacao = 0;
  const operacoes: any[] = [];

  for (const p of pontos) {
    const mesAtual = p.data.getMonth() + 1;
    const idEmpresa = p.id_empresa || 0;
    let valor = p.valor;

    // Mudança de mês: acumular e resetar
    if (mesmoMes !== 0 && mesmoMes !== mesAtual) {
      valorMesAnteriorPontuacao = valorPontuacao + valorMesAnteriorPontuacao;
      contaEmpresaMes = 0;
      valorTotNovo = 0;
      valorPontuacao = 0;
    }
    mesmoMes = mesAtual;

    // Conta empresas únicas quando muda de empresa
    if (mesmaEmpresa !== idEmpresa) {
      contaEmpresaMes++;
      contaEmpresaTotal++;
    }
    mesmaEmpresa = idEmpresa;

    // Ajuste construtora: valor / 4
    if (p.construtora === 's') {
      valor = valor / 4;
    }

    // Acumular valores
    valorTot += valor;
    valorTotNovo += valor;

    // Aplicar multiplicador do mês
    const mult = getMultiplier(contaEmpresaMes, multipliers);
    valorPontuacao = valorTotNovo * mult;

    if (incluirOperacoes) {
      operacoes.push({
        id: p.id,
        data: p.data,
        empresaId: p.id_empresa,
        empresaNome: p.empresaNome,
        valor: p.valor,
        valorAjustado: Math.round(valor * 100) / 100,
        construtora: p.construtora === 's',
        nota: p.nota,
      });
    }
  }

  // Cálculo final
  const valorNovaPontuacao = valorPontuacao + valorMesAnteriorPontuacao;
  const pontosTotal = Math.round(valorNovaPontuacao / 100);

  return {
    totalValor: Math.round(valorTot * 100) / 100,
    totalValorComIndice: Math.round(valorNovaPontuacao * 100) / 100,
    totalEmpresas: contaEmpresaTotal,
    totalPontos: pontosTotal,
    operacoes,
  };
}

// GET - Relatório por Profissionais
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !['admin', 'user'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const profissionalId = searchParams.get('profissional');
    const dataInicio = searchParams.get('dataInicio');
    const dataFim = searchParams.get('dataFim');
    const tipo = searchParams.get('tipo') || 'detalhado';

    if (!dataInicio || !dataFim) {
      return NextResponse.json({ error: 'Data de início e fim são obrigatórias' }, { status: 400 });
    }

    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);
    fim.setHours(23, 59, 59, 999);

    // 1) Buscar multiplicadores da tabela bonus_multipliers (dinâmico)
    const bonusRows = await prisma.bonusMultiplier.findMany({
      orderBy: { range_min: 'asc' },
    });
    const multipliers = bonusRows.map((r) => ({
      range_min: r.range_min,
      range_max: r.range_max,
      multiplier: Number(r.multiplier),
    }));

    // 2) Build WHERE para pontos
    const pontosWhere: any = {
      tipo: { in: ['1', 'PR'] },
      ativo: 'a',
      data: { gte: inicio, lte: fim },
    };

    if (profissionalId && profissionalId !== 'todos') {
      pontosWhere.id_profissional = parseInt(profissionalId);
    }

    // 3) Buscar todos os pontos com dados da empresa (construtora)
    const pontos = await prisma.ponto.findMany({
      where: pontosWhere,
      include: {
        empresaRel: { select: { id: true, empresa: true, construtora: true } },
      },
      orderBy: { data: 'asc' },
    });

    // 4) Buscar nomes dos profissionais
    const profIds = [...new Set(pontos.map((p) => p.id_profissional).filter(Boolean))] as number[];
    const profissionais = profIds.length > 0
      ? await prisma.profissional.findMany({
          where: { id: { in: profIds } },
          select: { id: true, nome: true },
        })
      : [];
    const profMap = new Map(profissionais.map((p) => [p.id, p.nome]));

    // 5) Agrupar pontos por profissional
    const pontosAgrupados = new Map<number, typeof pontos>();
    for (const p of pontos) {
      const profId = p.id_profissional || 0;
      if (!pontosAgrupados.has(profId)) pontosAgrupados.set(profId, []);
      pontosAgrupados.get(profId)!.push(p);
    }

    // 6) Calcular pontuação para cada profissional usando lógica legada
    const resultado: any[] = [];
    for (const [profId, profPontos] of pontosAgrupados) {
      const pontosFormatados = profPontos.map((p) => ({
        id: p.id,
        id_empresa: p.id_empresa,
        valor: Number(p.valor) || 0,
        data: p.data ? new Date(p.data) : new Date(),
        empresaNome: p.empresaRel?.empresa || 'N/A',
        construtora: p.empresaRel?.construtora || null,
        nota: p.nota || '',
      }));

      const calc = calcularPontuacaoProfissional(
        pontosFormatados,
        multipliers,
        tipo === 'detalhado'
      );

      resultado.push({
        profissionalId: profId,
        profissionalNome: profMap.get(profId) || `Profissional #${profId}`,
        totalValor: calc.totalValor,
        totalValorComIndice: calc.totalValorComIndice,
        totalEmpresas: calc.totalEmpresas,
        totalPontos: calc.totalPontos,
        operacoes: calc.operacoes,
      });
    }

    // Ordenar por nome
    resultado.sort((a, b) =>
      (a.profissionalNome || '').localeCompare(b.profissionalNome || '', 'pt-BR')
    );

    const totalGeral = {
      valor: resultado.reduce((acc, p) => acc + p.totalValor, 0),
      valorComIndice: resultado.reduce((acc, p) => acc + p.totalValorComIndice, 0),
      empresas: resultado.reduce((acc, p) => acc + p.totalEmpresas, 0),
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
