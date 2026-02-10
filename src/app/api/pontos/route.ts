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

    if (role === 'empresa') {
      // Empresa vê pontos que ela concedeu
      pontos = await prisma.ponto.findMany({
        where: { id_empresa: userId },
        orderBy: { data: 'desc' },
        take: 100,
      });
    } else if (role === 'escritorio') {
      // Escritório vê pontos via tipo
      pontos = await prisma.ponto.findMany({
        where: { tipo: 'ES' },
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
    const total = pontos.reduce((acc: number, p: Ponto) => acc + (Number(p.pontos) || 0), 0);

    return NextResponse.json({ pontos, total });
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

  try {
    const data = await req.json();
    const {
      id_profissional,
      pontos,
      valor,
      nota,
    } = data;

    if (!pontos || !id_profissional) {
      return NextResponse.json(
        { error: 'Dados incompletos. Informe pontos e profissional.' },
        { status: 400 }
      );
    }

    const novoPonto = await prisma.ponto.create({
      data: {
        id_empresa: parseInt(session.user.id),
        id_profissional: id_profissional ? parseInt(id_profissional) : null,
        tipo: 'PR',
        pontos: pontos ? Number(pontos) : null,
        valor: valor ? parseFloat(valor) : null,
        nota: nota || null,
        data: new Date(),
      },
    });

    return NextResponse.json({ success: true, ponto: novoPonto });
  } catch (error) {
    console.error('Erro ao registrar pontos:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
