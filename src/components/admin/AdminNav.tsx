'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Target, Kanban, DollarSign, CalendarCheck, UserCheck, QrCode, Users, ShieldAlert,
  Globe, LogOut, Menu, X, type LucideIcon,
} from 'lucide-react';
import { canAccessRoute, isRole, type UserRole } from '@/lib/route-policy';

interface UserInfo { id: string; name: string; email: string; role: string }

interface NavItem { name: string; short: string; href: string; icon: LucideIcon; group: string }

/** One menu for every /admin page. Visibility follows ROUTE_POLICY; the server still enforces access. */
const NAV: NavItem[] = [
  { name: 'CRM & Prospección', short: 'CRM', href: '/admin/crm', icon: Target, group: 'Ventas' },
  { name: 'Kit QR Reseñas', short: 'Kit QR', href: '/herramientas/resenas', icon: QrCode, group: 'Ventas' },
  { name: 'Producción 5 Días', short: 'Producción', href: '/admin/produccion', icon: Kanban, group: 'Operación' },
  { name: 'Retención & Reportes', short: 'Retención', href: '/admin/retencion', icon: UserCheck, group: 'Operación' },
  { name: 'Tablero Dominical', short: 'Domingo', href: '/admin/tablero-dominical', icon: CalendarCheck, group: 'Operación' },
  { name: 'Finanzas & Fiscal', short: 'Finanzas', href: '/admin/finanzas', icon: DollarSign, group: 'Dinero' },
  { name: 'Usuarios & Claves', short: 'Usuarios', href: '/admin/usuarios', icon: Users, group: 'Equipo y seguridad' },
  { name: 'Seguridad (SOC)', short: 'Seguridad', href: '/admin/seguridad', icon: ShieldAlert, group: 'Equipo y seguridad' },
];

const ROLE_LABEL: Partial<Record<UserRole, string>> = {
  SUPER_ADMIN: 'Super admin', ADMIN_LUIS: 'Socio', ADMIN_CARLOS: 'Socio', SALES_BARBARA: 'Ventas', DEVELOPER: 'Desarrollo',
};

function visibleFor(role: string | undefined): NavItem[] {
  if (!role || !isRole(role)) return NAV.filter((i) => i.href === '/admin/crm');
  // The QR kit page is public; show it to anyone who can work leads.
  return NAV.filter((i) => canAccessRoute(role, i.href.startsWith('/admin') ? i.href : '/admin/crm'));
}

export function AdminNav() {
  const pathname = usePathname() || '';
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<UserInfo | null>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    fetch('/api/auth/me', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (alive && d?.authenticated && d.user) setUser(d.user); })
      .catch(() => { /* the menu still works with the CRM link only */ });
    return () => { alive = false; };
  }, []);

  // Close on navigation.
  useEffect(() => { setOpen(false); }, [pathname]);

  // Drawer: lock page scroll, close on Escape, keep focus inside, return focus to the toggle.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const panel = panelRef.current;
    panel?.querySelector<HTMLElement>('a,button')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(false); return; }
      if (e.key !== 'Tab' || !panel) return;
      const f = Array.from(panel.querySelectorAll<HTMLElement>('a,button'));
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    const toggle = toggleRef.current;
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
      toggle?.focus();
    };
  }, [open]);

  const logout = async () => {
    try { await fetch('/api/auth/logout', { method: 'POST' }); } catch { /* go to login anyway */ }
    router.push('/login');
    router.refresh();
  };

  const items = visibleFor(user?.role);
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');
  const groups = Array.from(new Set(items.map((i) => i.group)));
  const roleLabel = user && isRole(user.role) ? ROLE_LABEL[user.role] : undefined;

  return (
    <>
      <nav aria-label="Administración" className="bg-lumo-noche text-white sticky top-0 z-40 border-b border-white/10 print:hidden">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-14 flex items-center gap-4">
          <Link href="/admin/crm" className="shrink-0 inline-flex items-baseline gap-1.5 font-heading font-black text-lg tracking-tight">
            <span>lumo</span><span className="text-[10px] font-bold text-lumo-ambar tracking-widest">HQ</span>
          </Link>

          <ul className="hidden xl:flex items-center gap-0.5 min-w-0">
            {items.map((i) => {
              const Icon = i.icon;
              const active = isActive(i.href);
              return (
                <li key={i.href}>
                  <Link href={i.href} aria-current={active ? 'page' : undefined} title={i.name}
                    className={`inline-flex items-center gap-1.5 h-9 px-2.5 rounded-lg text-[13px] font-semibold transition-colors ${active ? 'bg-white/10 text-white shadow-[inset_0_-2px_0_#F2A33A]' : 'text-white/70 hover:text-white hover:bg-white/5'}`}>
                    <Icon className={`w-4 h-4 ${active ? 'text-lumo-ambar' : ''}`} aria-hidden="true" />{i.short}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="ml-auto flex items-center gap-2">
            <Link href="/" target="_blank" rel="noopener" className="hidden xl:inline-flex items-center gap-1.5 h-9 px-2.5 rounded-lg text-[13px] font-semibold text-white/70 hover:text-white hover:bg-white/5">
              <Globe className="w-4 h-4" aria-hidden="true" />Web
            </Link>
            {user && (
              <span className="hidden md:block text-right leading-tight">
                <span className="block text-xs font-bold">{user.name}</span>
                {roleLabel && <span className="block text-[10px] text-white/60">{roleLabel}</span>}
              </span>
            )}
            <button type="button" onClick={logout} className="hidden xl:inline-flex items-center gap-1.5 h-9 px-2.5 rounded-lg text-[13px] font-semibold text-white/70 hover:text-white hover:bg-white/5">
              <LogOut className="w-4 h-4" aria-hidden="true" />Salir
            </button>
            <button ref={toggleRef} type="button" onClick={() => setOpen(true)} aria-expanded={open} aria-controls="admin-drawer"
              className="xl:hidden min-h-touch min-w-touch inline-flex items-center justify-center gap-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-sm font-bold">
              <Menu className="w-5 h-5" aria-hidden="true" /><span>Menú</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Drawer (below xl). Always mounted so it can slide out; inert while closed. */}
      <div className={`xl:hidden fixed inset-0 z-50 ${open ? '' : 'pointer-events-none'}`} inert={!open} aria-hidden={!open}>
        <button type="button" tabIndex={-1} aria-label="Cerrar menú" onClick={() => setOpen(false)}
          className={`absolute inset-0 bg-lumo-noche/50 transition-opacity duration-200 motion-reduce:transition-none ${open ? 'opacity-100' : 'opacity-0'}`} />
        <div id="admin-drawer" ref={panelRef} role="dialog" aria-modal="true" aria-label="Menú de administración"
          className={`absolute right-0 top-0 h-full w-[min(20rem,86vw)] bg-lumo-noche text-white flex flex-col shadow-2xl transition-transform duration-200 ease-out motion-reduce:transition-none ${open ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="flex items-center justify-between h-14 px-4 border-b border-white/10">
            <div className="min-w-0 leading-tight">
              <p className="text-sm font-bold truncate">{user?.name ?? 'Sesión activa'}</p>
              {roleLabel && <p className="text-[11px] text-white/60">{roleLabel}</p>}
            </div>
            <button type="button" onClick={() => setOpen(false)} className="min-h-touch min-w-touch inline-flex items-center justify-center rounded-xl hover:bg-white/10" aria-label="Cerrar menú">
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-3 space-y-4">
            {groups.map((g) => (
              <div key={g}>
                <p className="px-3 pb-1 text-[11px] font-bold uppercase tracking-widest text-white/50">{g}</p>
                <ul>
                  {items.filter((i) => i.group === g).map((i) => {
                    const Icon = i.icon;
                    const active = isActive(i.href);
                    return (
                      <li key={i.href}>
                        <Link href={i.href} aria-current={active ? 'page' : undefined} onClick={() => setOpen(false)}
                          className={`min-h-touch flex items-center gap-3 px-3 rounded-xl text-[15px] font-semibold ${active ? 'bg-white/10 text-white' : 'text-white/80 hover:bg-white/5'}`}>
                          <Icon className={`w-5 h-5 shrink-0 ${active ? 'text-lumo-ambar' : 'text-white/50'}`} aria-hidden="true" />
                          <span className="flex-1">{i.name}</span>
                          {active && <span className="w-1.5 h-1.5 rounded-full bg-lumo-ambar" aria-hidden="true" />}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-white/10 p-3 grid grid-cols-2 gap-2">
            <Link href="/" target="_blank" rel="noopener" className="min-h-touch inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 text-sm font-bold">
              <Globe className="w-4 h-4" aria-hidden="true" />Web pública
            </Link>
            <button type="button" onClick={logout} className="min-h-touch inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 text-sm font-bold hover:bg-red-500/20 hover:text-red-200">
              <LogOut className="w-4 h-4" aria-hidden="true" />Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
