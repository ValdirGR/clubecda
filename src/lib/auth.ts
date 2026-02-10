import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
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
            // Nota: o sistema original usa MySQL PASSWORD() — aqui fazemos comparação simples
            // Em produção, migrar para bcrypt
            if (admin && admin.usuario_senha === senha) {
              return {
                id: String(admin.usuario_id),
                name: admin.usuario_nome || 'Admin',
                email: `admin-${admin.usuario_id}@cda.local`,
                role: admin.usuario_tipo || 'admin',
              };
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
