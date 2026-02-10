import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

interface EmailParams {
  to?: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailParams) {
  const recipient = to || process.env.EMAIL_TO || 'contato@clubecda.com.br';

  try {
    if (!resend) {
      console.warn('RESEND_API_KEY não configurada. E-mail não enviado.');
      return { success: false, error: 'API key not configured' };
    }

    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'CDA <noreply@clubecda.com.br>',
      to: [recipient],
      subject,
      html,
    });

    if (error) {
      console.error('Erro ao enviar email:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    return { success: false, error };
  }
}

// Templates de email
export function emailNovoCadastro(tipo: string, nome: string) {
  const tipoLabel = tipo === 'PR' ? 'Profissional' : 'Escritório';
  return {
    subject: `Novo Cadastro de ${tipoLabel} - Clube CDA`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1a1c20; padding: 30px; text-align: center;">
          <h1 style="color: #c79954; margin: 0;">Clube CDA</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333;">Novo Cadastro de ${tipoLabel}</h2>
          <p>Foi realizado um novo cadastro no site:</p>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Tipo:</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${tipoLabel}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Nome:</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${nome}</td>
            </tr>
          </table>
          <p style="margin-top: 20px;">O cadastro aguarda liberação no painel administrativo.</p>
        </div>
        <div style="background: #1a1c20; padding: 15px; text-align: center;">
          <p style="color: #888; font-size: 12px; margin: 0;">CDA - Clube da Decoração e Arquitetura</p>
        </div>
      </div>
    `,
  };
}

export function emailContato(
  nome: string,
  email: string,
  telefone: string,
  celular: string,
  assunto: string,
  mensagem: string
) {
  return {
    subject: `Contato via Site - ${assunto}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1a1c20; padding: 30px; text-align: center;">
          <h1 style="color: #c79954; margin: 0;">Clube CDA</h1>
          <p style="color: #aaa; margin: 5px 0 0;">Contato via Site</p>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Nome:</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${nome}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">E-mail:</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${email}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Telefone:</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${telefone}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Celular:</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${celular}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Assunto:</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${assunto}</td>
            </tr>
          </table>
          <div style="margin-top: 20px; padding: 15px; background: white; border-radius: 8px;">
            <p style="font-weight: bold; margin: 0 0 10px;">Mensagem:</p>
            <p style="margin: 0; white-space: pre-wrap;">${mensagem}</p>
          </div>
          <p style="color: #888; font-size: 12px; margin-top: 20px;">
            Enviado em: ${new Date().toLocaleString('pt-BR')}
          </p>
        </div>
      </div>
    `,
  };
}
