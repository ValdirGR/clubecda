import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from '@/lib/prisma';

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 horas
  },
  pages: {
    signIn: '/area-restrita',
  },
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'CDA Login',
      credentials: {
        usuario: { label: 'Usuário', type: 'text' },
        senha: { label: 'Senha', type: 'password' },
        tipo: { label: 'Tipo', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.usuario || !credentials?.senha || !credentials?.tipo) {
          return null;
        }

        const { usuario, senha, tipo } = credentials;

        try {
          // Login Empresa
          if (tipo === 'EM') {
            const empresa = await prisma.empresa.findFirst({
              where: {
                user: usuario,
                senha: senha,
                ativo: 's',
              },
            });
            if (empresa) {
              return {
                id: String(empresa.id),
                name: empresa.empresa,
                email: `empresa-${empresa.id}@cda.local`,
                role: 'empresa',
              };
            }
          }

          // Login Escritório
          if (tipo === 'ES') {
            const escritorio = await prisma.escritorio.findFirst({
              where: {
                usuario: usuario,
                senha: senha,
                ativo: 's',
              },
            });
            if (escritorio) {
              return {
                id: String(escritorio.id),
                name: escritorio.empresa,
                email: escritorio.email || `escritorio-${escritorio.id}@cda.local`,
                role: 'escritorio',
              };
            }
          }

          // Login Profissional
          if (tipo === 'PR') {
            const profissional = await prisma.profissional.findFirst({
              where: {
                usuario: usuario,
                senha: senha,
                ativo: 's',
              },
            });
            if (profissional) {
              return {
                id: String(profissional.id),
                name: profissional.nome,
                email: profissional.email || `prof-${profissional.id}@cda.local`,
                role: 'profissional',
              };
            }
          }

          // Login Admin (CAS)
          if (tipo === 'ADMIN') {
            const admin = await prisma.casUsuario.findFirst({
              where: {
                usuario_user: usuario,
              },
            });
            if (admin && admin.usuario_senha) {
              const dbPassword = admin.usuario_senha;
              let senhaValida = false;

              // 1. Tenta bcrypt (se a senha começar com $2)
              if (dbPassword.startsWith('$2')) {
                try {
                  senhaValida = await bcrypt.compare(senha, dbPassword);
                } catch (e) {
                  console.error('Bcrypt error:', e);
                }
              }

              // 2. Se não válido, tenta validação MySQL PASSWORD() -> SHA1(SHA1(pass))
              // Formato: *HEXADECIMAL_UPPERCASE
              if (!senhaValida && dbPassword.startsWith('*')) {
                try {
                  const shasum = crypto.createHash('sha1').update(senha).digest();
                  const shasum2 = crypto.createHash('sha1').update(shasum).digest('hex').toUpperCase();
                  const mysqlHash = '*' + shasum2;
                  senhaValida = (mysqlHash === dbPassword);
                } catch (e) {
                  console.error('MySQL hash error:', e);
                }
              }

              // 3. Se ainda não válido, tenta Texto Plano (Legacy)
              // Útil durante a migração para usuários antigos sem hash
              if (!senhaValida) {
                senhaValida = (dbPassword === senha);
              }

              if (senhaValida) {
                // Registrar log de acesso (como o PHP original fazia)
                try {
                  await prisma.casLogAcesso.create({
                    data: {
                      log_acesso_usuario: admin.usuario_id,
                      log_acesso_login: new Date(),
                      log_acesso_IP: '0.0.0.0', // IP real via headers no middleware
                    },
                  });
                } catch (logError) {
                  console.error('Erro ao registrar log de acesso:', logError);
                }

                return {
                  id: String(admin.usuario_id),
                  name: admin.usuario_nome || 'Admin',
                  email: `admin-${admin.usuario_id}@cda.local`,
                  role: admin.usuario_tipo || 'admin',
                };
              }
            }
          }

          return null;
        } catch (error) {
          console.error('Erro na autenticação:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.userId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.userId;
      }
      return session;
    },
  },
};
