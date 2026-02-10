import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AuthProvider from '@/components/providers/AuthProvider';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'CDA – Clube da Decoração e Arquitetura',
    template: '%s | CDA',
  },
  description:
    'O CDA é um clube de fidelidade que reúne empresas de decoração, arquitetura e design de interiores, oferecendo condições exclusivas para profissionais do setor.',
  keywords: [
    'decoração',
    'arquitetura',
    'design de interiores',
    'clube de fidelidade',
    'showroom',
    'profissionais',
    'escritórios',
  ],
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://clubecda.com.br',
    siteName: 'CDA – Clube da Decoração e Arquitetura',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${playfair.variable}`}>
      <body className="min-h-screen flex flex-col">
        <AuthProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#25272e',
                color: '#e1e2e5',
                border: '1px solid rgba(199,153,84,0.3)',
              },
              success: {
                iconTheme: { primary: '#c79954', secondary: '#1a1c20' },
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
