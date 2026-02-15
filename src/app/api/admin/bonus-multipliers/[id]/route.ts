import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// DELETE /api/admin/bonus-multipliers/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !['admin', 'user'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const id = Number(params.id);
  if (isNaN(id)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }

  try {
    await prisma.bonusMultiplier.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Faixa removida' });
  } catch (error) {
    console.error('Erro ao excluir multiplicador:', error);
    return NextResponse.json({ error: 'Erro ao excluir' }, { status: 500 });
  }
}
