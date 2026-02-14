import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET - Buscar configurações (público para leitura de dia_limite)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const chave = searchParams.get('chave');

  try {
    if (chave) {
      const config = await prisma.configuracao.findUnique({
        where: { chave },
      });
      return NextResponse.json({ config });
    }

    const configs = await prisma.configuracao.findMany({
      orderBy: { chave: 'asc' },
    });
    return NextResponse.json({ configs });
  } catch (error) {
    console.error('Erro ao buscar configurações:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// PUT - Atualizar configuração (somente admin)
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !['admin', 'user'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { chave, valor } = await req.json();

    if (!chave || valor === undefined || valor === null) {
      return NextResponse.json(
        { error: 'Chave e valor são obrigatórios.' },
        { status: 400 }
      );
    }

    // Validação específica para dia_limite_pontuacao
    if (chave === 'dia_limite_pontuacao') {
      const dia = parseInt(valor);
      if (isNaN(dia) || dia < 1 || dia > 31) {
        return NextResponse.json(
          { error: 'O dia deve ser um número entre 1 e 31.' },
          { status: 400 }
        );
      }
    }

    // Buscar valor anterior para log
    const configAtual = await prisma.configuracao.findUnique({
      where: { chave },
    });

    const valorAnterior = configAtual?.valor || null;

    // Se o valor não mudou, não precisa atualizar
    if (valorAnterior === String(valor)) {
      return NextResponse.json({ success: true, message: 'Valor não alterado.' });
    }

    // Atualizar configuração
    const config = await prisma.configuracao.upsert({
      where: { chave },
      update: {
        valor: String(valor),
        updated_at: new Date(),
      },
      create: {
        chave,
        valor: String(valor),
      },
    });

    // Registrar log da alteração
    await prisma.logConfiguracao.create({
      data: {
        chave,
        valor_anterior: valorAnterior,
        valor_novo: String(valor),
        usuario_id: parseInt(session.user.id),
        usuario_nome: session.user.name || 'Admin',
        created_at: new Date(),
      },
    });

    return NextResponse.json({ success: true, config });
  } catch (error) {
    console.error('Erro ao atualizar configuração:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
