import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendEmail, emailNovoCadastro } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { tipo } = data;

    if (tipo === 'PR') {
      // Cadastro de Profissional
      const {
        nome, cpf, email, telefone, celular,
        endereco, complemento, bairro, cidade, estado,
        crea, empresa, usuario, senha,
      } = data;

      if (!nome || !cpf || !email || !usuario || !senha) {
        return NextResponse.json(
          { error: 'Campos obrigatórios não preenchidos.' },
          { status: 400 }
        );
      }

      // Verificar se usuário já existe
      const existing = await prisma.profissional.findFirst({
        where: { OR: [{ usuario }, { cpf }] },
      });
      if (existing) {
        return NextResponse.json(
          { error: 'Usuário ou CPF já cadastrado.' },
          { status: 409 }
        );
      }

      await prisma.profissional.create({
        data: {
          nome,
          cpf,
          email,
          telefone: telefone || null,
          celular: celular || null,
          endereco: endereco || null,
          complemento: complemento || null,
          bairro: bairro || null,
          cidade: cidade || null,
          uf: estado || null,
          crea: crea || null,
          empresa: empresa || null,
          usuario,
          senha, // Em produção: hash com bcrypt
          ativo: 'n', // Aguardando aprovação
        },
      });

      // Notificação por e-mail
      const tmpl = emailNovoCadastro('PR', nome);
      await sendEmail(tmpl).catch(console.error);

      return NextResponse.json({ success: true, message: 'Cadastro realizado. Aguarde aprovação.' });
    }

    if (tipo === 'ES') {
      // Cadastro de Escritório
      const {
        empresa: nomeEmpresa, nome_contato, cnpj,
        email, telefone, celular, site,
        endereco, complemento, bairro, cidade, estado, cep,
        usuario, senha,
      } = data;

      if (!nomeEmpresa || !nome_contato || !email || !usuario || !senha) {
        return NextResponse.json(
          { error: 'Campos obrigatórios não preenchidos.' },
          { status: 400 }
        );
      }

      // Verificar se usuário já existe
      const existing = await prisma.escritorio.findFirst({
        where: { usuario },
      });
      if (existing) {
        return NextResponse.json(
          { error: 'Usuário já cadastrado.' },
          { status: 409 }
        );
      }

      await prisma.escritorio.create({
        data: {
          empresa: nomeEmpresa,
          nome_contato,
          cnpj: cnpj || null,
          email,
          telefone: telefone || null,
          celular: celular || null,
          site: site || null,
          endereco: endereco || null,
          complemento: complemento || null,
          bairro: bairro || null,
          cidade: cidade || null,
          estado: estado || null,
          cep: cep || null,
          usuario,
          senha, // Em produção: hash com bcrypt
          ativo: 'n',
        },
      });

      const tmpl = emailNovoCadastro('ES', nomeEmpresa);
      await sendEmail(tmpl).catch(console.error);

      return NextResponse.json({ success: true, message: 'Cadastro realizado. Aguarde aprovação.' });
    }

    return NextResponse.json({ error: 'Tipo inválido.' }, { status: 400 });
  } catch (error) {
    console.error('Erro no cadastro:', error);
    return NextResponse.json(
      { error: 'Erro interno ao processar cadastro.' },
      { status: 500 }
    );
  }
}
