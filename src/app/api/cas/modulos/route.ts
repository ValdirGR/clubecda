import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET - Listar módulos CAS
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !['admin', 'user'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const allModulos = await prisma.casModulo.findMany({
      orderBy: [{ modulo_nome: 'asc' }, { modulo_id: 'asc' }],
    });

    // Deduplicate: keep only one entry per (modulo_nome, modulo_nivel)
    const seen = new Map<string, typeof allModulos[0]>();
    for (const m of allModulos) {
      const key = `${m.modulo_nome}|${m.modulo_nivel}`;
      if (!seen.has(key)) {
        seen.set(key, m);
      }
    }
    const modulos = Array.from(seen.values());

    const modulosUser = modulos.filter((m) => m.modulo_nivel === 'user');
    const modulosAdmin = modulos.filter((m) => m.modulo_nivel === 'admin');

    return NextResponse.json({ modulosUser, modulosAdmin });
  } catch (error) {
    console.error('Erro ao listar módulos CAS:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// POST - Sincronizar módulos (criar os padrão se não existirem)
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Apenas administradores' }, { status: 403 });
  }

  try {
    const modulosPadrao = [
      // Módulos de usuário
      { nome: 'noticias', nivel: 'user' },
      { nome: 'empresas', nivel: 'user' },
      { nome: 'escritorios', nivel: 'user' },
      { nome: 'profissionais', nivel: 'user' },
      { nome: 'pontos', nivel: 'user' },
      { nome: 'relatorios', nivel: 'user' },
      { nome: 'destaque', nivel: 'user' },
      { nome: 'clube', nivel: 'user' },
      { nome: 'fidelidade', nivel: 'user' },
      { nome: 'informativo', nivel: 'user' },
      { nome: 'indice', nivel: 'user' },
      { nome: 'baixa', nivel: 'user' },
      { nome: 'showroom', nivel: 'user' },
      // Módulos de admin
      { nome: 'usuarios', nivel: 'admin' },
    ];

    const now = new Date();
    let criados = 0;

    for (const mod of modulosPadrao) {
      const existente = await prisma.casModulo.findFirst({
        where: { modulo_nome: mod.nome, modulo_nivel: mod.nivel },
      });

      if (!existente) {
        await prisma.casModulo.create({
          data: {
            modulo_nome: mod.nome,
            modulo_nivel: mod.nivel,
            modulo_atualizacao: now,
          },
        });
        criados++;
      }
    }

    return NextResponse.json({ success: true, criados });
  } catch (error) {
    console.error('Erro ao sincronizar módulos:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
