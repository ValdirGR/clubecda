'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Menu, X, ChevronDown, User, LogIn, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const navigation = [
  { label: 'Home', href: '/' },
  { label: 'O Clube', href: '/o-clube' },
  { label: 'Empresas', href: '/empresas' },
  { label: 'Profissionais', href: '/profissionais' },
  { label: 'Notícias', href: '/noticias' },
  {
    label: 'Cadastre-se',
    href: '/cadastro',
    children: [
      { label: 'Profissional', href: '/cadastro?tipo=profissional' },
      { label: 'Escritório', href: '/cadastro?tipo=escritorio' },
    ],
  },
  { label: 'Contato', href: '/contato' },
];

export default function Header() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setDropdownOpen(null);
  }, [pathname]);

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-dark-900/95 backdrop-blur-md shadow-lg shadow-black/20 py-2'
          : 'bg-transparent py-4'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-dark-900 font-display font-bold text-lg group-hover:shadow-lg group-hover:shadow-brand-400/30 transition-shadow">
              C
            </div>
            <div>
              <span className="text-xl font-display font-bold text-white">
                CDA
              </span>
              <span className="hidden sm:block text-[10px] text-dark-400 tracking-wider uppercase">
                Decoração & Arquitetura
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navigation.map((item) => (
              <div
                key={item.href}
                className="relative"
                onMouseEnter={() =>
                  item.children && setDropdownOpen(item.label)
                }
                onMouseLeave={() => setDropdownOpen(null)}
              >
                <Link
                  href={item.href}
                  className={cn(
                    'px-3 py-2 rounded-md text-sm font-medium transition-colors inline-flex items-center gap-1',
                    pathname === item.href
                      ? 'text-brand-400'
                      : 'text-dark-200 hover:text-white'
                  )}
                >
                  {item.label}
                  {item.children && (
                    <ChevronDown className="w-3 h-3" />
                  )}
                </Link>

                {/* Dropdown */}
                <AnimatePresence>
                  {item.children && dropdownOpen === item.label && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="absolute top-full left-0 mt-1 w-48 glass rounded-lg overflow-hidden shadow-xl"
                    >
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className="block px-4 py-2.5 text-sm text-dark-200 hover:text-white hover:bg-dark-700/50 transition-colors"
                        >
                          {child.label}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}

            <div className="ml-3 pl-3 border-l border-dark-700 flex items-center gap-2">
              {session ? (
                <>
                  <Link
                    href="/area-restrita"
                    className="btn-ghost text-sm gap-2"
                  >
                    <User className="w-4 h-4" />
                    Área Restrita
                  </Link>
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="p-2 rounded-md text-dark-400 hover:text-red-400 hover:bg-dark-700/50 transition-colors"
                    title="Sair"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <Link
                  href="/area-restrita"
                  className="btn-outline text-sm py-2 px-4 gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  Entrar
                </Link>
              )}
            </div>
          </nav>

          {/* Mobile Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 text-dark-200 hover:text-white"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="lg:hidden overflow-hidden"
            >
              <nav className="py-4 space-y-1">
                {navigation.map((item) => (
                  <div key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        'block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors',
                        pathname === item.href
                          ? 'text-brand-400 bg-dark-800'
                          : 'text-dark-200 hover:text-white hover:bg-dark-800'
                      )}
                    >
                      {item.label}
                    </Link>
                    {item.children?.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className="block px-8 py-2 text-sm text-dark-400 hover:text-white"
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                ))}
                <div className="pt-3 mt-3 border-t border-dark-700 px-4 space-y-2">
                  {session ? (
                    <>
                      <Link
                        href="/area-restrita"
                        className="btn-primary w-full text-sm gap-2"
                      >
                        <User className="w-4 h-4" />
                        Área Restrita
                      </Link>
                      <button
                        onClick={() => signOut({ callbackUrl: '/' })}
                        className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg text-sm font-medium text-dark-400 hover:text-red-400 hover:bg-dark-700/50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sair
                      </button>
                    </>
                  ) : (
                    <Link
                      href="/area-restrita"
                      className="btn-primary w-full text-sm gap-2"
                    >
                      <LogIn className="w-4 h-4" />
                      Entrar
                    </Link>
                  )}
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
