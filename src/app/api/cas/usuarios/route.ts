import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// GET - Listar usuários CAS
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !['admin', 'user'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '15');

    const where: any = {};

    // Usuário tipo "user" só vê outros "user"
    if (session.user.role === 'user') {
      where.usuario_tipo = 'user';
    }

    if (search) {
      where.OR = [
        { usuario_nome: { contains: search } },
        { usuario_user: { contains: search } },
      ];
    }

    const [usuarios, total] = await Promise.all([
      prisma.casUsuario.findMany({
        where,
        include: {
          acessos: {
            include: { modulo: true },
          },
        },
        orderBy: { usuario_nome: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.casUsuario.count({ where }),
    ]);

    // Remover senhas do retorno
    const safes = usuarios.map(({ usuario_senha, ...u }) => u);

    return NextResponse.json({
      usuarios: safes,
      total,
      pages: Math.ceil(total / limit),
      page,
    });
  } catch (error) {
    console.error('Erro ao listar usuários CAS:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// POST - Criar novo usuário CAS
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Apenas administradores podem criar usuários' }, { status: 403 });
  }

  try {
    const data = await req.json();
    const { nome, login, senha, modulosUser, modulosAdmin } = data;

    if (!nome || !login || !senha) {
      return NextResponse.json({ error: 'Nome, login e senha são obrigatórios' }, { status: 400 });
    }

    // Verificar duplicidade de login
    const existe = await prisma.casUsuario.findFirst({
      where: { usuario_user: login },
    });

    if (existe) {
      return NextResponse.json({ error: 'Este login já está em uso' }, { status: 409 });
    }

    // Criar usuário
    const hashedSenha = await bcrypt.hash(senha, 10);
    const usuario = await prisma.casUsuario.create({
      data: {
        usuario_nome: nome,
        usuario_user: login,
        usuario_senha: hashedSenha,
        usuario_tipo: 'user',
      },
    });

    // Inserir permissões de módulos
    const now = new Date();
    const permissoes: { usuario_id: number; modulo_id: number; acesso_atualizacao: Date }[] = [];

    if (modulosUser && Array.isArray(modulosUser)) {
      for (const modId of modulosUser) {
        permissoes.push({
          usuario_id: usuario.usuario_id,
          modulo_id: parseInt(modId),
          acesso_atualizacao: now,
        });
      }
    }

    if (modulosAdmin && Array.isArray(modulosAdmin)) {
      for (const modId of modulosAdmin) {
        permissoes.push({
          usuario_id: usuario.usuario_id,
          modulo_id: parseInt(modId),
          acesso_atualizacao: now,
        });
      }
    }

    if (permissoes.length > 0) {
      for (const perm of permissoes) {
        await prisma.casAcessoMod.create({ data: perm });
      }
    }

    return NextResponse.json({ success: true, usuario: { ...usuario, usuario_senha: undefined } });
  } catch (error) {
    console.error('Erro ao criar usuário CAS:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
