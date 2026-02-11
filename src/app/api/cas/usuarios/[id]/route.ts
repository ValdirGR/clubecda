import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// GET - Buscar usuário por ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !['admin', 'user'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const id = parseInt(params.id);
    const usuario = await prisma.casUsuario.findUnique({
      where: { usuario_id: id },
      include: {
        acessos: {
          include: { modulo: true },
        },
      },
    });

    if (!usuario) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Usuário tipo "user" não pode ver admins
    if (session.user.role === 'user' && usuario.usuario_tipo === 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { usuario_senha, ...safe } = usuario;
    return NextResponse.json(safe);
  } catch (error) {
    console.error('Erro ao buscar usuário CAS:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// PUT - Atualizar usuário
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Apenas administradores podem editar usuários' }, { status: 403 });
  }

  try {
    const id = parseInt(params.id);
    const data = await req.json();
    const { nome, login, senha, modulosUser, modulosAdmin } = data;

    if (!nome || !login) {
      return NextResponse.json({ error: 'Nome e login são obrigatórios' }, { status: 400 });
    }

    // Verificar duplicidade de login (excluindo o próprio)
    const existe = await prisma.casUsuario.findFirst({
      where: {
        usuario_user: login,
        NOT: { usuario_id: id },
      },
    });

    if (existe) {
      return NextResponse.json({ error: 'Este login já está em uso' }, { status: 409 });
    }

    // Dados de atualização
    const updateData: any = {
      usuario_nome: nome,
      usuario_user: login,
    };

    // Atualizar senha apenas se fornecida
    if (senha && senha.trim() !== '') {
      updateData.usuario_senha = await bcrypt.hash(senha, 10);
    }

    const usuario = await prisma.casUsuario.update({
      where: { usuario_id: id },
      data: updateData,
    });

    // Recriar permissões: deletar todas e re-inserir
    await prisma.casAcessoMod.deleteMany({
      where: { usuario_id: id },
    });

    const now = new Date();
    const allModulos = [
      ...(modulosUser || []).map((m: string) => parseInt(m)),
      ...(modulosAdmin || []).map((m: string) => parseInt(m)),
    ];

    for (const modId of allModulos) {
      await prisma.casAcessoMod.create({
        data: {
          usuario_id: id,
          modulo_id: modId,
          acesso_atualizacao: now,
        },
      });
    }

    return NextResponse.json({ success: true, usuario: { ...usuario, usuario_senha: undefined } });
  } catch (error) {
    console.error('Erro ao atualizar usuário CAS:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// DELETE - Excluir usuário
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Apenas administradores podem excluir usuários' }, { status: 403 });
  }

  try {
    const id = parseInt(params.id);

    // Não permitir excluir a si mesmo
    if (String(id) === session.user.id) {
      return NextResponse.json({ error: 'Você não pode excluir seu próprio usuário' }, { status: 400 });
    }

    // Deletar permissões primeiro
    await prisma.casAcessoMod.deleteMany({
      where: { usuario_id: id },
    });

    // Deletar usuário
    await prisma.casUsuario.delete({
      where: { usuario_id: id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir usuário CAS:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
