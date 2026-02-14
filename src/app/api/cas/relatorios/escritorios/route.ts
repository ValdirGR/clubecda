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

// Calcula pontuação de um escritório conforme lógica legada:
// - Pontos ordenados por data ASC
// - Construtora: valor / 4
// - Empresas únicas por mês → multiplicador (da tabela bonus_multipliers)
// - Ao mudar de mês, acumula valor_pontuacao e reseta contadores mensais
// - Pontos final = ValorNovaPontuacao / 100
function calcularPontuacaoEscritorio(
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
  let contaEmpresaMes = 0;        // empresas únicas no mês corrente
  let contaEmpresaTotal = 0;      // empresas únicas total (acumulado)
  let mesmaEmpresa = 0;           // última id_empresa vista
  let mesmoMes = 0;               // último mês visto
  let valorTot = 0;               // valor total (com ajuste construtora)
  let valorTotNovo = 0;           // valor acumulado no mês corrente
  let valorPontuacao = 0;         // valor com índice do mês corrente
  let valorMesAnteriorPontuacao = 0; // acumulado dos meses anteriores
  const operacoes: any[] = [];

  for (const p of pontos) {
    const mesAtual = p.data.getMonth() + 1; // 1-12
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
        valor: p.valor,                             // valor original
        valorAjustado: Math.round(valor * 100) / 100, // valor após ajuste construtora
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
      tipo: { in: ['2', 'ES'] },
      ativo: 'a',
      data: { gte: inicio, lte: fim },
    };

    if (escritorioId && escritorioId !== 'todos') {
      pontosWhere.id_profissional = parseInt(escritorioId);
    }

    // 3) Buscar todos os pontos com dados da empresa (construtora)
    const pontos = await prisma.ponto.findMany({
      where: pontosWhere,
      include: {
        empresaRel: { select: { id: true, empresa: true, construtora: true } },
      },
      orderBy: { data: 'asc' }, // ESSENCIAL: ordem por data para tracking mensal
    });

    // 4) Buscar nomes dos escritórios
    const escIds = [...new Set(pontos.map((p) => p.id_profissional).filter(Boolean))] as number[];
    const escritorios = escIds.length > 0
      ? await prisma.escritorio.findMany({
          where: { id: { in: escIds } },
          select: { id: true, empresa: true, nome_fantasia: true },
        })
      : [];
    const escMap = new Map(escritorios.map((e) => [e.id, e]));

    // 5) Agrupar pontos por escritório
    const pontosAgrupados = new Map<number, typeof pontos>();
    for (const p of pontos) {
      const escId = p.id_profissional || 0;
      if (!pontosAgrupados.has(escId)) pontosAgrupados.set(escId, []);
      pontosAgrupados.get(escId)!.push(p);
    }

    // 6) Calcular pontuação para cada escritório usando lógica legada
    const resultado: any[] = [];
    for (const [escId, escPontos] of pontosAgrupados) {
      const esc = escMap.get(escId);
      const pontosFormatados = escPontos.map((p) => ({
        id: p.id,
        id_empresa: p.id_empresa,
        valor: Number(p.valor) || 0,
        data: p.data ? new Date(p.data) : new Date(),
        empresaNome: p.empresaRel?.empresa || 'N/A',
        construtora: p.empresaRel?.construtora || null,
        nota: p.nota || '',
      }));

      const calc = calcularPontuacaoEscritorio(
        pontosFormatados,
        multipliers,
        tipo === 'detalhado'
      );

      resultado.push({
        escritorioId: escId,
        escritorioNome: esc?.empresa || `Escritório #${escId}`,
        nomeFantasia: esc?.nome_fantasia || undefined,
        totalValor: calc.totalValor,
        totalValorComIndice: calc.totalValorComIndice,
        totalEmpresas: calc.totalEmpresas,
        totalPontos: calc.totalPontos,
        operacoes: calc.operacoes,
      });
    }

    // Ordenar por nome
    resultado.sort((a, b) =>
      (a.escritorioNome || '').localeCompare(b.escritorioNome || '', 'pt-BR')
    );

    const totalGeral = {
      valor: resultado.reduce((acc, e) => acc + e.totalValor, 0),
      valorComIndice: resultado.reduce((acc, e) => acc + e.totalValorComIndice, 0),
      empresas: resultado.reduce((acc, e) => acc + e.totalEmpresas, 0),
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
