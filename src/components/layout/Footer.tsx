import Link from 'next/link';
import {
  MapPin,
  Phone,
  Mail,
  Instagram,
  Facebook,
} from 'lucide-react';
import ScrollToTop from './ScrollToTop';

const footerLinks = [
  {
    title: 'Navegação',
    links: [
      { label: 'Home', href: '/' },
      { label: 'O Clube', href: '/o-clube' },
      { label: 'Empresas', href: '/empresas' },
      { label: 'Profissionais', href: '/profissionais' },
      { label: 'Notícias', href: '/noticias' },
    ],
  },
  {
    title: 'Cadastro',
    links: [
      { label: 'Profissionais', href: '/cadastro?tipo=profissional' },
      { label: 'Escritórios', href: '/cadastro?tipo=escritorio' },
      { label: 'Área Restrita', href: '/area-restrita' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-dark-950 border-t border-dark-800">
      {/* Main */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-dark-900 font-display font-bold text-lg">
                C
              </div>
              <span className="text-xl font-display font-bold text-white">
                CDA
              </span>
            </div>
            <p className="text-dark-400 text-sm leading-relaxed mb-6">
              Clube da Decoração e Arquitetura — conectando profissionais e
              empresas do setor com benefícios exclusivos.
            </p>
            <div className="flex gap-3">
              <a
                href="https://www.instagram.com/clubecda/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-dark-800 flex items-center justify-center text-dark-400 hover:text-brand-400 hover:bg-dark-700 transition-colors"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="https://www.facebook.com/ClubeCDA/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-dark-800 flex items-center justify-center text-dark-400 hover:text-brand-400 hover:bg-dark-700 transition-colors"
              >
                <Facebook className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Link Columns */}
          {footerLinks.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
                {col.title}
              </h3>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-dark-400 hover:text-brand-400 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contato */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Contato
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm text-dark-400">
                <MapPin className="w-4 h-4 mt-0.5 text-brand-400 shrink-0" />
                <span>São Paulo, SP - Brasil</span>
              </li>
              <li>
                <a
                  href="tel:+551130000000"
                  className="flex items-center gap-2 text-sm text-dark-400 hover:text-brand-400 transition-colors"
                >
                  <Phone className="w-4 h-4 text-brand-400 shrink-0" />
                  (11) 3000-0000
                </a>
              </li>
              <li>
                <a
                  href="mailto:contato@clubecda.com.br"
                  className="flex items-center gap-2 text-sm text-dark-400 hover:text-brand-400 transition-colors"
                >
                  <Mail className="w-4 h-4 text-brand-400 shrink-0" />
                  contato@clubecda.com.br
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-dark-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-dark-500">
            &copy; {new Date().getFullYear()} CDA – Clube da Decoração e
            Arquitetura. Todos os direitos reservados.
          </p>
          <ScrollToTop />
        </div>
      </div>
    </footer>
  );
}
