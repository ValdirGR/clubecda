'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import {
  LayoutDashboard,
  Star,
  Building2,
  ShoppingBag,
  Tag,
  Image as ImageIcon,
  BarChart3,
  LogOut,
  Menu,
  X,
  User2,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const menuItems = {
  empresa: [
    { label: 'Dashboard', href: '/area-restrita/empresas', icon: LayoutDashboard },
    { label: 'Pontos', href: '/area-restrita/empresas/pontos', icon: Star },
    { label: 'Showroom', href: '/area-restrita/empresas/showroom', icon: ShoppingBag },
    { label: 'Promoções', href: '/area-restrita/empresas/promocoes', icon: Tag },
    { label: 'Informativos', href: '/area-restrita/empresas/informativos', icon: ImageIcon },
    { label: 'Relatórios', href: '/area-restrita/empresas/relatorios', icon: BarChart3 },
  ],
  escritorio: [
    { label: 'Dashboard', href: '/area-restrita/escritorios', icon: LayoutDashboard },
    { label: 'Pontos', href: '/area-restrita/escritorios/pontos', icon: Star },
    { label: 'Minhas Empresas', href: '/area-restrita/escritorios/empresas', icon: Building2 },
  ],
  profissional: [
    { label: 'Dashboard', href: '/area-restrita/profissionais', icon: LayoutDashboard },
    { label: 'Meus Pontos', href: '/area-restrita/profissionais/pontos', icon: Star },
    { label: 'Empresas', href: '/area-restrita/profissionais/empresas', icon: Building2 },
  ],
};

export default function DashboardShell({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const role = (session?.user as any)?.role || 'profissional';
  const items = menuItems[role as keyof typeof menuItems] || menuItems.profissional;

  const roleLabel = {
    empresa: 'Empresa',
    escritorio: 'Escritório',
    profissional: 'Profissional',
  }[role as string] || 'Usuário';

  return (
    <div className="min-h-screen pt-20">
      <div className="flex">
        {/* Sidebar */}
        <aside
          className={cn(
            'fixed lg:sticky top-20 left-0 z-40 h-[calc(100vh-5rem)] w-64 bg-dark-800/95 backdrop-blur-md border-r border-dark-700 transition-transform duration-300 lg:translate-x-0 overflow-y-auto',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <div className="p-6">
            {/* User info */}
            <div className="glass rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-400/10 flex items-center justify-center">
                  <User2 className="w-5 h-5 text-brand-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {session?.user?.name}
                  </p>
                  <p className="text-xs text-brand-400">{roleLabel}</p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="space-y-1">
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                    pathname === item.href
                      ? 'bg-brand-400/10 text-brand-400'
                      : 'text-dark-300 hover:text-white hover:bg-dark-700/50'
                  )}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  {item.label}
                  {pathname === item.href && (
                    <ChevronRight className="w-3 h-3 ml-auto" />
                  )}
                </Link>
              ))}
            </nav>

            {/* Logout */}
            <div className="mt-8 pt-6 border-t border-dark-700">
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-dark-400 hover:text-red-400 hover:bg-dark-700/50 transition-all w-full"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </button>
            </div>
          </div>
        </aside>

        {/* Overlay mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/60 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Mobile header */}
          <div className="lg:hidden sticky top-20 z-20 bg-dark-900/95 backdrop-blur-md border-b border-dark-700 px-4 py-3 flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex items-center gap-2 text-sm text-dark-300 hover:text-white"
            >
              <Menu className="w-5 h-5" />
              Menu
            </button>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="flex items-center gap-2 text-sm text-dark-400 hover:text-red-400 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>

          <div className="p-6 lg:p-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
