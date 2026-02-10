import { withAuth } from 'next-auth/middleware';

export default withAuth({
  callbacks: {
    authorized: ({ token, req }) => {
      const path = req.nextUrl.pathname;

      // Admin routes require admin role
      if (path.startsWith('/admin')) {
        return token?.role === 'admin' || token?.role === 'user';
      }

      // Dashboard routes require any authenticated user
      if (
        path.startsWith('/area-restrita/empresas') ||
        path.startsWith('/area-restrita/escritorios') ||
        path.startsWith('/area-restrita/profissionais')
      ) {
        return !!token;
      }

      return true;
    },
  },
});

export const config = {
  matcher: [
    '/area-restrita/empresas/:path*',
    '/area-restrita/escritorios/:path*',
    '/area-restrita/profissionais/:path*',
    '/admin/:path*',
  ],
};
