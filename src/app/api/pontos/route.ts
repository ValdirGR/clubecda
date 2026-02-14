import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import type { Ponto } from '@prisma/client';

// GET - Listar pontos do usuário logado
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const { role, id } = session.user;
  const userId = parseInt(id);

  try {
    let pontos;
    let empresa = null;

    if (role === 'empresa') {
      // Empresa vê pontos que ela concedeu
      pontos = await prisma.ponto.findMany({
        where: { id_empresa: userId },
        orderBy: { data: 'desc' },
        take: 100,
      });
      // Buscar dados da empresa (construtora flag para cálculo de pontos)
      empresa = await prisma.empresa.findUnique({
        where: { id: userId },
        select: { id: true, empresa: true, construtora: true, foto: true },
      });
    } else if (role === 'escritorio') {
      // Escritório vê pontos via tipo (legacy tipo '2' ou novo 'ES')
      pontos = await prisma.ponto.findMany({
        where: {
          id_profissional: userId,
          OR: [{ tipo: 'ES' }, { tipo: '2' }],
        },
        orderBy: { data: 'desc' },
        take: 100,
      });
    } else if (role === 'profissional') {
      // Profissional vê seus pontos
      pontos = await prisma.ponto.findMany({
        where: { id_profissional: userId },
        orderBy: { data: 'desc' },
        take: 100,
      });
    } else {
      return NextResponse.json({ error: 'Tipo de usuário inválido' }, { status: 403 });
    }

    // Calcular totais (pontos is Decimal in DB)
    const totalPontos = pontos.reduce((acc: number, p: Ponto) => acc + (Number(p.pontos) || 0), 0);
    const totalValor = pontos.reduce((acc: number, p: Ponto) => acc + (Number(p.valor) || 0), 0);

    return NextResponse.json({
      pontos,
      total: totalPontos,
      totalValor,
      empresa,
    });
  } catch (error) {
    console.error('Erro ao buscar pontos:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// POST - Empresa registra pontos para profissional/escritório
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  if (session.user.role !== 'empresa') {
    return NextResponse.json({ error: 'Apenas empresas podem registrar pontos' }, { status: 403 });
  }

  // Verificar prazo dinâmico: buscar dia limite do banco
  const configDiaLimite = await prisma.configuracao.findUnique({
    where: { chave: 'dia_limite_pontuacao' },
  });
  const diaLimite = configDiaLimite ? parseInt(configDiaLimite.valor) : 10;
  
  const now = new Date();
  const dia = now.getDate();
  if (dia > diaLimite) {
    return NextResponse.json(
      { error: `Formulário desativado. Disponível apenas entre os dias 1 e ${diaLimite} de cada mês.` },
      { status: 400 }
    );
  }

  try {
    const data = await req.json();
    const {
      id_profissional,
      valor,
      tipo,
      estagio_obra,
      nota,         // Nome Cliente NF
      cidade,
      telefone,
      email,
    } = data;

    if (!id_profissional || !valor || !estagio_obra || !nota) {
      return NextResponse.json(
        { error: 'Dados incompletos. Informe profissional/escritório, valor, estágio da obra e nome cliente NF.' },
        { status: 400 }
      );
    }

    const valorNum = parseFloat(valor);
    if (isNaN(valorNum) || valorNum <= 0) {
      return NextResponse.json(
        { error: 'Valor inválido.' },
        { status: 400 }
      );
    }

    // Buscar empresa para calcular pontos (construtora flag)
    const empresaId = parseInt(session.user.id);
    const empresa = await prisma.empresa.findUnique({
      where: { id: empresaId },
      select: { construtora: true },
    });

    // Cálculo automático de pontos:
    // construtora = 's' → valor / 400
    // construtora = 'n' → valor / 100
    const divisor = empresa?.construtora === 's' ? 400 : 100;
    const pontosCalculados = valorNum / divisor;

    const novoPonto = await prisma.ponto.create({
      data: {
        id_empresa: empresaId,
        id_profissional: parseInt(id_profissional),
        tipo: tipo || '1',  // '1' = profissional, '2' = escritório (compatível com legado)
        pontos: pontosCalculados,
        valor: valorNum,
        estagio_obra: estagio_obra || null,
        nota: nota || null,           // Nome Cliente NF
        cidade: cidade || null,
        telefone: telefone || null,
        email: email || null,
        data: new Date(),
      },
    });

    return NextResponse.json({ success: true, ponto: novoPonto });
  } catch (error) {
    console.error('Erro ao registrar pontos:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
