'use client';

import React, { useState, useEffect } from 'react';
import { AdminNav } from '@/components/admin/AdminNav';
import {
  Users,
  UserPlus,
  Key,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  AlertCircle,
  RefreshCw,
  Sparkles,
  X,
} from 'lucide-react';

interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export default function AdminUsuariosPage() {
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Create User Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('SALES_BARBARA');
  const [newPassword, setNewPassword] = useState('');
  const [createdPasswordPreview, setCreatedPasswordPreview] = useState<string | null>(null);

  // Change Password Modal State
  const [changePasswordUser, setChangePasswordUser] = useState<SystemUser | null>(null);
  const [changePasswordInput, setChangePasswordInput] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      if (!res.ok) throw new Error('Error al cargar la lista de colaboradores.');
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      setErrorMessage((err instanceof Error ? err.message : ''));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleToggleStatus = async (user: SystemUser) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, action: 'toggle-status' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al modificar estado.');

      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, active: data.active } : u))
      );
      setSuccessMessage(`Estado de ${user.name} actualizado exitosamente.`);
    } catch (err) {
      setErrorMessage((err instanceof Error ? err.message : ''));
    }
  };

  // CSPRNG in the browser (crypto.getRandomValues), 18 characters, never Math.random.
  const generateAutoPassword = () => {
    const sets = ['ABCDEFGHJKLMNPQRSTUVWXYZ', 'abcdefghijkmnopqrstuvwxyz', '23456789', '!@#$%^&*-_=+'];
    const all = sets.join('');
    const rnd = (n: number) => { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] % n; };
    const chars = sets.map((set) => set[rnd(set.length)]);
    while (chars.length < 18) chars.push(all[rnd(all.length)]);
    for (let i = chars.length - 1; i > 0; i--) { const j = rnd(i + 1); [chars[i], chars[j]] = [chars[j], chars[i]]; }
    return chars.join('');
  };

  const patchUser = async (user: SystemUser, body: Record<string, unknown>, okMsg: string) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const res = await fetch('/api/admin/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, ...body }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'La acción falló.');
      setSuccessMessage(okMsg);
      await loadUsers();
    } catch (err) {
      setErrorMessage((err instanceof Error ? err.message : ''));
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          email: newEmail,
          role: newRole,
          password: newPassword || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al crear usuario.');

      setSuccessMessage(`Colaborador ${newName} creado exitosamente.`);
      if (data.generatedPassword) {
        setCreatedPasswordPreview(data.generatedPassword);
      } else {
        setCreateModalOpen(false);
        setNewName('');
        setNewEmail('');
        setNewPassword('');
      }
      loadUsers();
    } catch (err) {
      setErrorMessage((err instanceof Error ? err.message : ''));
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!changePasswordUser) return;
    setErrorMessage(null);
    setSuccessMessage(null);

    if (changePasswordInput.length < 12) {
      setErrorMessage('La contraseña debe tener al menos 12 caracteres.');
      return;
    }

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: changePasswordUser.id,
          action: 'change-password',
          newPassword: changePasswordInput,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al actualizar contraseña.');

      setSuccessMessage(`Contraseña actualizada para ${changePasswordUser.name}.`);
      setChangePasswordUser(null);
      setChangePasswordInput('');
    } catch (err) {
      setErrorMessage((err instanceof Error ? err.message : ''));
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased">
      <AdminNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6 grow w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-lumo-arena border border-lumo-niebla text-lumo-noche text-xs font-bold uppercase tracking-wider mb-2">
              <ShieldCheck className="w-4 h-4 text-lumo-ambar" />
              <span>CONTROL DE IDENTIDAD & ACCESO CRIPTOGRÁFICO</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-heading text-lumo-noche">
              Gestión de Usuarios y Contraseñas
            </h1>
            <p className="text-xs sm:text-sm text-lumo-pizarra mt-1">
              Administración de cuentas corporativas, credenciales PBKDF2 y roles RBAC para Midland-Odessa.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setCreatedPasswordPreview(null);
              setNewPassword(generateAutoPassword());
              setCreateModalOpen(true);
            }}
            className="min-h-touch inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-lumo-ambar hover:bg-lumo-brillo text-lumo-noche font-black text-xs shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Crear Nuevo Colaborador</span>
          </button>
        </div>

        {/* Global Notices */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Users Table / Mobile Cards */}
        <div className="bg-white rounded-3xl border border-lumo-niebla shadow-sm overflow-hidden">
          <div className="p-5 border-b border-lumo-niebla flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-lumo-ambar" />
              <h2 className="font-heading font-black text-sm text-lumo-noche">
                Colaboradores Registrados ({users.length})
              </h2>
            </div>
            <button
              type="button"
              onClick={loadUsers}
              className="p-2 text-gray-400 hover:text-lumo-noche rounded-xl min-h-[36px] min-w-[36px] flex items-center justify-center transition-colors"
              title="Recargar"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-lumo-pizarra">
              Cargando colaboradores del sistema...
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {users.map((usr) => (
                <div
                  key={usr.id}
                  className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <span className="font-bold text-sm text-lumo-noche">{usr.name}</span>
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                          usr.role === 'SUPER_ADMIN'
                            ? 'bg-purple-100 text-purple-800'
                            : usr.role === 'ADMIN_LUIS'
                            ? 'bg-blue-100 text-blue-800'
                            : usr.role === 'SALES_BARBARA'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {usr.role}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          usr.active
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {usr.active ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Activo</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-red-600" />
                            <span>Inactivo</span>
                          </>
                        )}
                      </span>
                    </div>

                    <div className="text-xs text-lumo-pizarra flex flex-wrap items-center gap-3">
                      <span>{usr.email}</span>
                      <span>·</span>
                      <span>
                        Último acceso:{' '}
                        <strong className="text-lumo-noche">
                          {usr.lastLoginAt ? new Date(usr.lastLoginAt).toLocaleString('es-US') : 'Sin registros'}
                        </strong>
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setChangePasswordUser(usr);
                        setChangePasswordInput(generateAutoPassword());
                      }}
                      className="min-h-touch grow sm:grow-0 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-lumo-noche text-xs font-bold transition-transform active:scale-95"
                    >
                      <Key className="w-3.5 h-3.5 text-lumo-ambar" />
                      <span>Cambiar Clave</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleStatus(usr)}
                      className={`min-h-touch grow sm:grow-0 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-transform active:scale-95 ${
                        usr.active
                          ? 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      <span>{usr.active ? 'Desactivar' : 'Activar'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => patchUser(usr, { action: 'revoke-sessions' }, `Sesiones de ${usr.name} cerradas.`)}
                      className="min-h-touch grow sm:grow-0 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-lumo-noche text-xs font-bold"
                    >
                      <span>Cerrar sesiones</span>
                    </button>

                    <select
                      aria-label={`Rol de ${usr.name}`}
                      value={usr.role}
                      onChange={(e) => patchUser(usr, { action: 'set-role', role: e.target.value }, `Rol de ${usr.name} actualizado.`)}
                      className="min-h-touch grow sm:grow-0 px-2 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold"
                    >
                      <option value="SUPER_ADMIN">Super admin</option>
                      <option value="ADMIN_LUIS">Admin Luis</option>
                      <option value="ADMIN_CARLOS">Admin Carlos</option>
                      <option value="SALES_BARBARA">Ventas (Bárbara)</option>
                      <option value="DEVELOPER">Desarrollador</option>
                      <option value="CLIENT">Cliente</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal: Crear Nuevo Colaborador */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-lumo-niebla shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-lumo-niebla">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-lumo-ambar" />
                <h3 className="font-heading font-black text-lg text-lumo-noche">
                  Crear Nuevo Colaborador
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createdPasswordPreview ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>¡Colaborador creado exitosamente!</span>
                  </div>
                  <p className="text-xs text-emerald-700 leading-relaxed">
                    Copia esta contraseña segura y envíasela al colaborador. Por seguridad, no volverá a mostrarse en texto plano.
                  </p>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-emerald-200 mt-2">
                    <span className="font-mono font-black text-sm text-lumo-noche">
                      {createdPasswordPreview}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(createdPasswordPreview)}
                      className="min-h-touch inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-transform active:scale-95"
                    >
                      {copiedKey ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey ? 'Copiada' : 'Copiar'}</span>
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setCreateModalOpen(false);
                    setCreatedPasswordPreview(null);
                    setNewName('');
                    setNewEmail('');
                    setNewPassword('');
                  }}
                  className="w-full min-h-touch py-3 rounded-xl bg-lumo-noche text-white font-bold text-xs"
                >
                  Entendido y Cerrar
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-lumo-noche mb-1">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Ej. Mateo Valenzuela"
                    className="min-h-touch w-full px-4 py-2.5 rounded-xl border border-lumo-niebla text-sm text-lumo-noche focus:border-lumo-ambar outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-lumo-noche mb-1">
                    Correo Electrónico *
                  </label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="mateo@lumohq.com"
                    className="min-h-touch w-full px-4 py-2.5 rounded-xl border border-lumo-niebla text-sm text-lumo-noche focus:border-lumo-ambar outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-lumo-noche mb-1">
                    Rol Operativo en Midland-Odessa *
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="min-h-touch w-full px-4 py-2.5 rounded-xl border border-lumo-niebla text-sm text-lumo-noche bg-white focus:border-lumo-ambar outline-none"
                  >
                    <option value="SALES_BARBARA">Ventas & CRM (Bárbara)</option>
                    <option value="ADMIN_LUIS">Administrador de Operaciones (Luis)</option>
                    <option value="SUPER_ADMIN">Super Administrador (Carlos Gómez)</option>
                    <option value="DEVELOPER">Desarrollador / Técnico</option>
                    <option value="ADMIN_CARLOS">Administrador Técnico (Carlos)</option>
                    <option value="CLIENT">Cliente (portal)</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-lumo-noche">
                      Contraseña Inicial Segura *
                    </label>
                    <button
                      type="button"
                      onClick={() => setNewPassword(generateAutoPassword())}
                      className="text-[11px] text-lumo-ambar font-bold hover:underline flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Generar Otra</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="min-h-touch w-full px-4 py-2.5 rounded-xl border border-lumo-niebla text-sm font-mono text-lumo-noche focus:border-lumo-ambar outline-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full min-h-touch py-3 rounded-xl bg-lumo-ambar hover:bg-lumo-brillo text-lumo-noche font-black text-xs transition-transform active:scale-95 shadow-md"
                  >
                    Guardar Colaborador en el Sistema
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal: Cambiar Contraseña */}
      {changePasswordUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-lumo-niebla shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-lumo-niebla">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-lumo-ambar" />
                <h3 className="font-heading font-black text-base text-lumo-noche">
                  Cambiar Contraseña: {changePasswordUser.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setChangePasswordUser(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-lumo-noche">
                    Nueva Contraseña (mínimo 12 caracteres):
                  </label>
                  <button
                    type="button"
                    onClick={() => setChangePasswordInput(generateAutoPassword())}
                    className="text-[11px] text-lumo-ambar font-bold hover:underline flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Auto-generar</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={changePasswordInput}
                  onChange={(e) => setChangePasswordInput(e.target.value)}
                  className="min-h-touch w-full px-4 py-2.5 rounded-xl border border-lumo-niebla text-sm font-mono text-lumo-noche focus:border-lumo-ambar outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setChangePasswordUser(null)}
                  className="min-h-touch py-2.5 px-3 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="min-h-touch py-2.5 px-3 rounded-xl bg-lumo-noche text-white font-bold text-xs transition-transform active:scale-95"
                >
                  Confirmar Cambio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

