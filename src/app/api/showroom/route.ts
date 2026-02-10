import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'empresa') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const items = await prisma.showroom.findMany({
    where: { empresa: parseInt(session.user.id) },
  });

  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'empresa') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const data = await req.json();
  const { descricao, imagem } = data;

  const item = await prisma.showroom.create({
    data: {
      empresa: parseInt(session.user.id),
      descricao: descricao || null,
      foto: imagem || null,
    },
  });

  return NextResponse.json({ success: true, item });
}
