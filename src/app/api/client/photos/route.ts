import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { NextResponse, type NextRequest } from 'next/server';
import { clientProjectStore } from '@/lib/client-portal';
import { validateUpload, EXT_FOR_MIME } from '@/lib/file-security';
import { requireClientKey } from '@/lib/security/guard';
import { getClientIp } from '@/lib/security/client-ip';
import { audit, recordFailure, blockIp } from '@/lib/security/store';

/**
 * Day 1 photo upload. Each file: max 10 MB, JPG/PNG/WebP by magic bytes (never by name or MIME header),
 * no embedded script or markup (anti-polyglot), stored outside /public under a random UUID name.
 * At most 20 photos per client.
 */
const MAX_PHOTOS = 20;
const UPLOAD_ROOT = path.join(process.cwd(), 'data', 'uploads');

function clientDir(clientId: string) {
  // ids are server-issued; still, refuse anything that is not a plain slug
  if (!/^[a-z0-9_-]{3,64}$/i.test(clientId)) return null;
  return path.join(UPLOAD_ROOT, clientId);
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  let form: FormData;
  try { form = await req.formData(); } catch { return NextResponse.json({ error: 'Solicitud inválida.' }, { status: 400 }); }

  const clientId = form.get('clientId');
  const denied = requireClientKey(req, clientId, form.get('key'));
  if (denied) return denied;
  const project = clientProjectStore.getById(clientId as string);
  const dir = clientDir(clientId as string);
  if (!project || !dir) return NextResponse.json({ error: 'Cliente no encontrado.' }, { status: 404 });

  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  const existing = fs.readdirSync(dir).length;
  const files = form.getAll('photos').filter((f): f is File => typeof f === 'object' && f !== null && 'arrayBuffer' in f);
  if (files.length === 0) return NextResponse.json({ error: 'Elige al menos una foto.' }, { status: 400 });
  if (existing + files.length > MAX_PHOTOS) {
    return NextResponse.json({ error: `Máximo ${MAX_PHOTOS} fotos. Ya tienes ${existing}.` }, { status: 400 });
  }

  const saved: string[] = [];
  const rejected: { name: string; error: string }[] = [];
  for (const file of files) {
    const name = String(file.name || 'archivo').slice(0, 80);
    if (file.size > 10 * 1024 * 1024) { rejected.push({ name, error: 'Supera 10 MB.' }); continue; }
    const buf = Buffer.from(await file.arrayBuffer());
    const check = validateUpload(buf, name);
    if (!check.isValid || !check.detectedMimeType) {
      rejected.push({ name, error: check.error || 'Archivo no válido.' });
      audit('UPLOAD_REJECTED', 'CRITICAL', ip, `${clientId}: ${name} · ${check.error}`);
      if (recordFailure(`upload-bad:${ip}`, 10 * 60 * 1000) >= 3) blockIp(ip, 'repeated malicious uploads');
      continue;
    }
    const stored = `${crypto.randomUUID()}.${EXT_FOR_MIME[check.detectedMimeType]}`;
    fs.writeFileSync(path.join(dir, stored), buf, { mode: 0o600 });
    saved.push(stored);
  }

  const total = fs.readdirSync(dir).length;
  const updated = clientProjectStore.updateDay1Checklist(clientId as string, { photosUploadedCount: total });
  return NextResponse.json({ success: saved.length > 0, saved: saved.length, rejected, total, project: updated }, { status: saved.length ? 200 : 400 });
}
