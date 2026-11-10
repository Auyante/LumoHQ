import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  getUserByEmail,
  verifyPassword,
  createSessionToken,
  updateUserLastLogin,
} from '@/lib/auth';
import { checkRateLimit, clearRateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Por favor ingresa tu correo y contraseña.' },
        { status: 400 }
      );
    }

    // Rate Limiting: 5 attempts per 15 minutes (900,000 ms)
    const rateLimitKey = `login-attempt:${ip}:${email.toLowerCase().trim()}`;
    const rateCheck = checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000);

    if (!rateCheck.allowed) {
      const waitMinutes = Math.ceil((rateCheck.resetAt - Date.now()) / 60000);
      return NextResponse.json(
        {
          error: `Demasiados intentos fallidos. Por seguridad, la cuenta está bloqueada temporalmente. Intenta en ${waitMinutes} minutos.`,
        },
        { status: 429 }
      );
    }

    const user = getUserByEmail(email);

    if (!user) {
      return NextResponse.json(
        { error: 'Credenciales inválidas. Verifica tu correo y contraseña.' },
        { status: 401 }
      );
    }

    if (!user.active) {
      return NextResponse.json(
        { error: 'Esta cuenta ha sido desactivada. Consulta con el Administrador.' },
        { status: 403 }
      );
    }

    const isMatch = verifyPassword(password, user.hash, user.salt);

    if (!isMatch) {
      return NextResponse.json(
        { error: 'Credenciales inválidas. Verifica tu correo y contraseña.' },
        { status: 401 }
      );
    }

    // Login successful
    clearRateLimit(rateLimitKey);
    updateUserLastLogin(user.id);
    const token = createSessionToken(user);

    const isProd = process.env.NODE_ENV === 'production';
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

    response.cookies.set({
      name: 'lumo_session',
      value: token,
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (err: any) {
    console.error('Login error:', err);
    return NextResponse.json(
      { error: 'Error interno al procesar el inicio de sesión.' },
      { status: 500 }
    );
  }
}

