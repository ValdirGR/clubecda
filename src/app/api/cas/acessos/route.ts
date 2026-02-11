import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET - Listar logs de acesso
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !['admin', 'user'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const usuarioId = searchParams.get('usuario');
    const dataInicio = searchParams.get('dataInicio');
    const dataFim = searchParams.get('dataFim');

    const where: any = {};

    if (usuarioId) {
      where.log_acesso_usuario = parseInt(usuarioId);
    }

    if (dataInicio || dataFim) {
      where.log_acesso_login = {};
      if (dataInicio) {
        where.log_acesso_login.gte = new Date(dataInicio);
      }
      if (dataFim) {
        const fim = new Date(dataFim);
        fim.setHours(23, 59, 59, 999);
        where.log_acesso_login.lte = fim;
      }
    }

    const [logs, total] = await Promise.all([
      prisma.casLogAcesso.findMany({
        where,
        include: {
          usuario: {
            select: {
              usuario_id: true,
              usuario_nome: true,
              usuario_user: true,
              usuario_tipo: true,
            },
          },
        },
        orderBy: { log_acesso_login: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.casLogAcesso.count({ where }),
    ]);

    return NextResponse.json({
      logs,
      total,
      pages: Math.ceil(total / limit),
      page,
    });
  } catch (error) {
    console.error('Erro ao listar logs CAS:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
