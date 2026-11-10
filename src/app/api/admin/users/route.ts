import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  verifySessionToken,
  getAllUsers,
  createUser,
  updateUserPassword,
  toggleUserStatus,
  type UserRole,
} from '@/lib/auth';

function getSessionUser(request: NextRequest) {
  const token = request.cookies.get('lumo_session')?.value;
  if (!token) return null;
  const { valid, payload } = verifySessionToken(token);
  return valid && payload ? payload : null;
}

export async function GET(request: NextRequest) {
  const sessionUser = getSessionUser(request);
  if (!sessionUser) {
    return NextResponse.json({ error: 'No autenticado.' }, { status: 401 });
  }

  const users = getAllUsers().map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    active: u.active,
    createdAt: u.createdAt,
    lastLoginAt: u.lastLoginAt,
  }));

  return NextResponse.json({ users });
}

export async function POST(request: NextRequest) {
  const sessionUser = getSessionUser(request);
  if (!sessionUser) {
    return NextResponse.json({ error: 'No autenticado.' }, { status: 401 });
  }

  if (sessionUser.role !== 'SUPER_ADMIN' && sessionUser.role !== 'ADMIN_LUIS') {
    return NextResponse.json(
      { error: 'Permisos insuficientes para crear colaboradores.' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { name, email, role, password } = body;

    if (!name || !email || !role) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios (nombre, correo o rol).' },
        { status: 400 }
      );
    }

    const result = createUser(name, email, role as UserRole, password || undefined);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      user: result.user,
      generatedPassword: result.generatedPassword,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al crear usuario.' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const sessionUser = getSessionUser(request);
  if (!sessionUser) {
    return NextResponse.json({ error: 'No autenticado.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { userId, action, newPassword } = body;

    if (!userId || !action) {
      return NextResponse.json({ error: 'Faltan parámetros de acción.' }, { status: 400 });
    }

    // Changing another user's status or password requires SUPER_ADMIN or ADMIN_LUIS.
    // Changing own password is permitted.
    const isSelf = sessionUser.id === userId;
    const isAdmin = sessionUser.role === 'SUPER_ADMIN' || sessionUser.role === 'ADMIN_LUIS';

    if (!isSelf && !isAdmin) {
      return NextResponse.json(
        { error: 'No tienes autorización para modificar este usuario.' },
        { status: 403 }
      );
    }

    if (action === 'toggle-status') {
      if (!isAdmin) {
        return NextResponse.json({ error: 'Solo administradores pueden cambiar estado.' }, { status: 403 });
      }
      const res = toggleUserStatus(userId);
      return NextResponse.json(res);
    }

    if (action === 'change-password') {
      if (!newPassword || newPassword.length < 8) {
        return NextResponse.json(
          { error: 'La contraseña debe tener mínimo 8 caracteres.' },
          { status: 400 }
        );
      }
      const success = updateUserPassword(userId, newPassword);
      return NextResponse.json({ success });
    }

    return NextResponse.json({ error: 'Acción no reconocida.' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al actualizar.' }, { status: 500 });
  }
}

