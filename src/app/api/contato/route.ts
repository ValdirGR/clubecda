import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendEmail, emailContato } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { nome, email, telefone, celular, assunto, mensagem } = data;

    if (!nome || !email || !assunto || !mensagem) {
      return NextResponse.json(
        { error: 'Campos obrigatórios não preenchidos.' },
        { status: 400 }
      );
    }

    // Enviar e-mail
    const tmpl = emailContato(nome, email, telefone || '', celular || '', assunto, mensagem);
    await sendEmail(tmpl);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro no contato:', error);
    return NextResponse.json(
      { error: 'Erro interno ao processar contato.' },
      { status: 500 }
    );
  }
}
