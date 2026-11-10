'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Users,
  Target,
  Kanban,
  DollarSign,
  TrendingUp,
  ShieldAlert,
  Menu,
  X,
  LogOut,
  UserCheck,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

interface UserInfo {
  id: string;
  name: string;
  email: string;
  role: string;
}

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<UserInfo | null>(null);

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user) {
            setUser(data.user);
          }
        }
      } catch (err) {
        console.error('Error loading current admin user:', err);
      }
    }
    loadUser();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch {
      router.push('/login');
    }
  };

  // Mirrors ROUTE_POLICY in src/lib/auth.ts. Hiding a link is a convenience; the server enforces access.
  const isAdmin = !!user && ['SUPER_ADMIN', 'ADMIN_LUIS', 'ADMIN_CARLOS'].includes(user.role);
  const isDev = user?.role === 'DEVELOPER';
  const navItems = [
    { name: 'CRM & Ventas', href: '/admin/crm', icon: Target, visible: true },
    { name: 'Producción', href: '/admin/produccion', icon: Kanban, visible: true },
    { name: 'Tablero Dominical', href: '/admin/tablero-dominical', icon: TrendingUp, visible: isAdmin || isDev },
    { name: 'Finanzas & Tax', href: '/admin/finanzas', icon: DollarSign, visible: isAdmin },
    { name: 'Retención & Churn', href: '/admin/retencion', icon: UserCheck, visible: isAdmin || isDev },
    { name: 'Usuarios & Claves', href: '/admin/usuarios', icon: Users, visible: isAdmin },
    { name: 'Seguridad (SOC)', href: '/admin/seguridad', icon: ShieldAlert, visible: isAdmin },
  ];

  return (
    <nav className="bg-lumo-noche text-white border-b border-white/10 sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Left: Brand */}
          <div className="flex items-center gap-3">
            <Link
              href="/admin/crm"
              className="flex items-center gap-2 transition-transform active:scale-95"
            >
              <span className="font-heading font-black text-xl tracking-tight text-white">
                <span className="text-lumo-ambar">LUMO</span>
                <span className="text-[10px] ml-1 bg-lumo-ambar/20 text-lumo-brillo px-1.5 py-0.5 rounded border border-lumo-ambar/40">
                  HQ
                </span>
              </span>
            </Link>
            <span className="hidden sm:inline-block text-gray-500 font-medium">/</span>
            <span className="hidden sm:inline-block text-xs text-gray-300 font-semibold">
              Sistema de Operaciones
            </span>
          </div>

          {/* Desktop Links */}
          <div className="hidden lg:flex items-center gap-1">
            {navItems
              .filter((item) => item.visible)
              .map((item) => {
                const isActive = pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={true}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-lumo-ambar text-lumo-noche shadow-xs'
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
          </div>

          {/* Right: User Badge & Logout */}
          <div className="hidden lg:flex items-center gap-3">
            {user && (
              <div className="text-right">
                <span className="block text-xs font-bold text-white leading-tight">
                  {user.name}
                </span>
                <span className="text-[10px] text-lumo-ambar font-semibold tracking-wide uppercase">
                  {user.role}
                </span>
              </div>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="min-h-touch inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-red-500/20 text-gray-300 hover:text-red-400 text-xs font-bold transition-colors active:scale-95"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Salir</span>
            </button>
          </div>

          {/* Mobile Menu Hamburger */}
          <div className="flex lg:hidden items-center gap-2">
            {user && (
              <span className="text-xs text-gray-300 font-medium truncate max-w-[120px]">
                {user.name.split(' ')[0]}
              </span>
            )}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="min-h-touch min-w-touch p-2.5 rounded-xl bg-white/10 text-white hover:bg-white/20 active:scale-95 flex items-center justify-center"
              aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-lumo-noche border-t border-white/10 px-4 pt-3 pb-6 space-y-2 animate-in slide-in-from-top-3 duration-200">
          <div className="p-3 bg-white/5 rounded-2xl mb-3 flex items-center justify-between">
            <div>
              <span className="text-xs font-black text-white block">{user?.name || 'Usuario'}</span>
              <span className="text-[10px] text-lumo-ambar font-bold uppercase">{user?.role || 'SESIÓN ACTIVA'}</span>
            </div>
            <Link
              href="/"
              target="_blank"
              className="text-[11px] text-gray-400 hover:text-white flex items-center gap-1"
            >
              <span>Ver Web Pública</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-1">
            {navItems
              .filter((item) => item.visible)
              .map((item) => {
                const isActive = pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={true}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`min-h-touch flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition-transform active:scale-98 ${
                      isActive
                        ? 'bg-lumo-ambar text-lumo-noche'
                        : 'bg-white/5 text-gray-200 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 text-lumo-ambar" />
                      <span>{item.name}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </Link>
                );
              })}
          </div>

          <div className="pt-3 border-t border-white/10 mt-3">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full min-h-touch py-3 px-4 rounded-2xl bg-red-500/20 text-red-400 hover:bg-red-500/30 font-bold text-sm flex items-center justify-center gap-2 active:scale-98"
            >
              <LogOut className="w-4 h-4" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}

