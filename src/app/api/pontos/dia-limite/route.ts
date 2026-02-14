import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/pontos/dia-limite - Retorna o dia limite de pontuação (público para qualquer usuário logado)
export async function GET() {
  try {
    const config = await prisma.configuracao.findUnique({
      where: { chave: 'dia_limite_pontuacao' },
    });

    const diaLimite = config ? parseInt(config.valor) : 10;

    return NextResponse.json({ diaLimite });
  } catch (error) {
    console.error('Erro ao buscar dia limite:', error);
    return NextResponse.json({ diaLimite: 10 });
  }
}
