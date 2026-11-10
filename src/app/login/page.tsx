'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/admin/crm';
  const errorParam = searchParams.get('error');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    errorParam === 'session_expired'
      ? 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.'
      : null
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Credenciales inválidas. Verifica tu correo y contraseña.');
      }

      // Successful login
      router.push(redirectPath);
      router.refresh();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error de autenticación.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-lumo-noche flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-lumo-ambar/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-block transition-transform active:scale-95">
            <span className="font-heading font-black text-3xl tracking-tight text-white flex items-center justify-center gap-2">
              <span className="text-lumo-ambar">LUMO</span>
              <span className="text-xs bg-lumo-ambar/20 text-lumo-brillo px-2 py-0.5 rounded-sm border border-lumo-ambar/40">
                HQ
              </span>
            </span>
          </Link>
          <h1 className="text-xl font-black text-white">Panel Interno de Operaciones</h1>
          <p className="text-xs text-gray-400">
            Acceso encriptado y restringido para el equipo oficial de Midland-Odessa
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/10 space-y-5">
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <div className="leading-relaxed font-medium">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-lumo-noche mb-1.5">
                Correo Electrónico Corporativo
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@lumohq.com"
                  className="min-h-touch w-full pl-10 pr-4 py-3 rounded-xl border border-lumo-niebla text-sm text-lumo-noche focus:border-lumo-ambar focus:ring-1 focus:ring-lumo-ambar outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-lumo-noche mb-1.5">
                Contraseña Encriptada
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="min-h-touch w-full pl-10 pr-11 py-3 rounded-xl border border-lumo-niebla text-sm text-lumo-noche focus:border-lumo-ambar focus:ring-1 focus:ring-lumo-ambar outline-none transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 rounded-lg min-h-[32px] min-w-[32px] flex items-center justify-center"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="min-h-touch w-full py-3.5 px-6 rounded-xl bg-lumo-ambar hover:bg-lumo-brillo text-lumo-noche font-black text-sm transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <span>{loading ? 'Verificando firma criptográfica...' : 'Entrar al Sistema'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

        </div>

        {/* Security badge footer */}
        <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Sesión encriptada HMAC-SHA256 · OWASP ASVS Nivel 2</span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-lumo-noche flex items-center justify-center text-white text-sm">
          Cargando pantalla de acceso...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

