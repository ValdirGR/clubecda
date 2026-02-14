import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// Verificar se a data do ponto é hoje
function isSameDay(pontoDate: Date | null | undefined): boolean {
  if (!pontoDate) return false;
  const hoje = new Date();
  const d = new Date(pontoDate);
  return (
    d.getFullYear() === hoje.getFullYear() &&
    d.getMonth() === hoje.getMonth() &&
    d.getDate() === hoje.getDate()
  );
}

// PUT /api/pontos/[id] - Editar ponto (somente no mesmo dia)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  if (session.user.role !== 'empresa') {
    return NextResponse.json({ error: 'Apenas empresas podem editar pontos' }, { status: 403 });
  }

  const pontoId = parseInt(params.id);
  if (isNaN(pontoId)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }

  try {
    // Buscar ponto existente
    const pontoExistente = await prisma.ponto.findUnique({
      where: { id: pontoId },
    });

    if (!pontoExistente) {
      return NextResponse.json({ error: 'Ponto não encontrado' }, { status: 404 });
    }

    // Verificar se o ponto pertence à empresa logada
    const empresaId = parseInt(session.user.id);
    if (pontoExistente.id_empresa !== empresaId) {
      return NextResponse.json({ error: 'Sem permissão para editar este ponto' }, { status: 403 });
    }

    // Verificar se é o mesmo dia
    if (!isSameDay(pontoExistente.data)) {
      return NextResponse.json(
        { error: 'Edição permitida somente no mesmo dia da criação do ponto.' },
        { status: 400 }
      );
    }

    const data = await req.json();
    const { id_profissional, valor, tipo, estagio_obra, nota, cidade, telefone, email } = data;

    if (!id_profissional || !valor || !estagio_obra || !nota) {
      return NextResponse.json(
        { error: 'Dados incompletos.' },
        { status: 400 }
      );
    }

    const valorNum = parseFloat(valor);
    if (isNaN(valorNum) || valorNum <= 0) {
      return NextResponse.json({ error: 'Valor inválido.' }, { status: 400 });
    }

    // Buscar empresa para calcular pontos
    const empresa = await prisma.empresa.findUnique({
      where: { id: empresaId },
      select: { construtora: true },
    });

    const divisor = empresa?.construtora === 's' ? 400 : 100;
    const pontosCalculados = valorNum / divisor;

    // Salvar dados anteriores para log
    const dadosAnterior = JSON.stringify({
      id_profissional: pontoExistente.id_profissional,
      tipo: pontoExistente.tipo,
      valor: pontoExistente.valor,
      pontos: Number(pontoExistente.pontos),
      estagio_obra: pontoExistente.estagio_obra,
      nota: pontoExistente.nota,
      cidade: pontoExistente.cidade,
      telefone: pontoExistente.telefone,
      email: pontoExistente.email,
    });

    // Atualizar ponto
    const pontoAtualizado = await prisma.ponto.update({
      where: { id: pontoId },
      data: {
        id_profissional: parseInt(id_profissional),
        tipo: tipo || '1',
        valor: valorNum,
        pontos: pontosCalculados,
        estagio_obra: estagio_obra || null,
        nota: nota || null,
        cidade: cidade || null,
        telefone: telefone || null,
        email: email || null,
      },
    });

    const dadosNovo = JSON.stringify({
      id_profissional: pontoAtualizado.id_profissional,
      tipo: pontoAtualizado.tipo,
      valor: pontoAtualizado.valor,
      pontos: Number(pontoAtualizado.pontos),
      estagio_obra: pontoAtualizado.estagio_obra,
      nota: pontoAtualizado.nota,
      cidade: pontoAtualizado.cidade,
      telefone: pontoAtualizado.telefone,
      email: pontoAtualizado.email,
    });

    // Registrar log
    await prisma.logPonto.create({
      data: {
        ponto_id: pontoId,
        acao: 'EDITAR',
        dados_anterior: dadosAnterior,
        dados_novo: dadosNovo,
        usuario_id: empresaId,
        usuario_nome: session.user.name || `Empresa #${empresaId}`,
      },
    });

    return NextResponse.json({ success: true, ponto: pontoAtualizado });
  } catch (error) {
    console.error('Erro ao editar ponto:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// DELETE /api/pontos/[id] - Excluir ponto (somente no mesmo dia)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  if (session.user.role !== 'empresa') {
    return NextResponse.json({ error: 'Apenas empresas podem excluir pontos' }, { status: 403 });
  }

  const pontoId = parseInt(params.id);
  if (isNaN(pontoId)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }

  try {
    const pontoExistente = await prisma.ponto.findUnique({
      where: { id: pontoId },
    });

    if (!pontoExistente) {
      return NextResponse.json({ error: 'Ponto não encontrado' }, { status: 404 });
    }

    const empresaId = parseInt(session.user.id);
    if (pontoExistente.id_empresa !== empresaId) {
      return NextResponse.json({ error: 'Sem permissão para excluir este ponto' }, { status: 403 });
    }

    if (!isSameDay(pontoExistente.data)) {
      return NextResponse.json(
        { error: 'Exclusão permitida somente no mesmo dia da criação do ponto.' },
        { status: 400 }
      );
    }

    // Salvar dados para log ANTES de excluir
    const dadosAnterior = JSON.stringify({
      id_profissional: pontoExistente.id_profissional,
      tipo: pontoExistente.tipo,
      valor: pontoExistente.valor,
      pontos: Number(pontoExistente.pontos),
      estagio_obra: pontoExistente.estagio_obra,
      nota: pontoExistente.nota,
      cidade: pontoExistente.cidade,
      telefone: pontoExistente.telefone,
      email: pontoExistente.email,
      data: pontoExistente.data,
    });

    // Registrar log ANTES de excluir
    await prisma.logPonto.create({
      data: {
        ponto_id: pontoId,
        acao: 'EXCLUIR',
        dados_anterior: dadosAnterior,
        dados_novo: null,
        usuario_id: empresaId,
        usuario_nome: session.user.name || `Empresa #${empresaId}`,
      },
    });

    // Excluir ponto
    await prisma.ponto.delete({
      where: { id: pontoId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir ponto:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
