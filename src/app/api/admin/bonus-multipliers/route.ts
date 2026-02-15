import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/admin/bonus-multipliers — lista todos
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !['admin', 'user'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const multipliers = await prisma.bonusMultiplier.findMany({
    orderBy: { range_min: 'asc' },
  });

  // Converter Decimal para number para JSON
  const data = multipliers.map((m) => ({
    id: m.id,
    range_min: m.range_min,
    range_max: m.range_max,
    multiplier: Number(m.multiplier),
    bonus_percent: m.bonus_percent,
  }));

  return NextResponse.json(data);
}

// PUT /api/admin/bonus-multipliers — atualiza todos de uma vez (batch)
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !['admin', 'user'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const items: {
      id: number;
      range_min: number;
      range_max: number | null;
      multiplier: number;
      bonus_percent: number;
    }[] = body.items;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }

    // Validações
    for (const item of items) {
      if (item.range_min < 0) {
        return NextResponse.json({ error: `range_min inválido: ${item.range_min}` }, { status: 400 });
      }
      if (item.range_max !== null && item.range_max < item.range_min) {
        return NextResponse.json({ error: `range_max (${item.range_max}) menor que range_min (${item.range_min})` }, { status: 400 });
      }
      if (item.multiplier < 0 || item.multiplier > 99) {
        return NextResponse.json({ error: `multiplier fora do intervalo: ${item.multiplier}` }, { status: 400 });
      }
      if (item.bonus_percent < 0 || item.bonus_percent > 999) {
        return NextResponse.json({ error: `bonus_percent fora do intervalo: ${item.bonus_percent}` }, { status: 400 });
      }
    }

    // Atualizar cada registro
    const updates = items.map((item) =>
      prisma.bonusMultiplier.update({
        where: { id: item.id },
        data: {
          range_min: item.range_min,
          range_max: item.range_max,
          multiplier: item.multiplier,
          bonus_percent: item.bonus_percent,
        },
      })
    );

    await prisma.$transaction(updates);

    return NextResponse.json({ success: true, message: 'Multiplicadores atualizados com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar multiplicadores:', error);
    return NextResponse.json({ error: 'Erro interno ao salvar' }, { status: 500 });
  }
}

// POST /api/admin/bonus-multipliers — adiciona nova faixa
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !['admin', 'user'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { range_min, range_max, multiplier, bonus_percent } = body;

    if (range_min === undefined || multiplier === undefined) {
      return NextResponse.json({ error: 'range_min e multiplier são obrigatórios' }, { status: 400 });
    }

    const created = await prisma.bonusMultiplier.create({
      data: {
        range_min: Number(range_min),
        range_max: range_max !== null && range_max !== '' ? Number(range_max) : null,
        multiplier: Number(multiplier),
        bonus_percent: Number(bonus_percent) || 0,
      },
    });

    return NextResponse.json({
      id: created.id,
      range_min: created.range_min,
      range_max: created.range_max,
      multiplier: Number(created.multiplier),
      bonus_percent: created.bonus_percent,
    }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar multiplicador:', error);
    return NextResponse.json({ error: 'Erro interno ao criar' }, { status: 500 });
  }
}
