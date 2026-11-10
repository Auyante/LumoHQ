/**
 * Live security suite (Phase 2). Runs real attacks against a running server.
 *   BASE_URL=http://localhost:3100 node scripts/verify-security.js
 * Needs data/INITIAL-PASSWORDS.txt (from scripts/rehash-users.js) or the ADMIN_LUIS_PASSWORD and
 * SALES_BARBARA_PASSWORD env vars. Passwords are never printed.
 * Each scenario uses its own fake client IP (x-real-ip), so blocks from one test do not leak into another.
 * Run it against development only: it fills the audit log and the blocklist on purpose.
 */
const fs = require('fs');
const path = require('path');

const BASE = process.env.BASE_URL || 'http://localhost:3100';
const UA = 'LumoSecuritySuite/1.0';
let pass = 0, fail = 0;
const ok = (cond, label) => { if (cond) { pass++; console.log(`  [PASS] ${label}`); } else { fail++; console.log(`  [FAIL] ${label}`); } };

function passwords() {
  const file = path.join(__dirname, '..', 'data', 'INITIAL-PASSWORDS.txt');
  const map = {};
  if (fs.existsSync(file)) for (const line of fs.readFileSync(file, 'utf8').split('\n')) { const m = line.match(/^(\S+@\S+)\s+(\S+)$/); if (m) map[m[1]] = m[2]; }
  return {
    luis: process.env.ADMIN_LUIS_PASSWORD || map['luis@lumohq.com'],
    carlos: process.env.ADMIN_CARLOS_PASSWORD || map['carlos@lumohq.com'],
    barbara: process.env.SALES_BARBARA_PASSWORD || map['barbara@lumohq.com'],
  };
}

// Fresh addresses every run (198.18.0.0/15 is reserved for testing), so blocks left by an earlier run never leak in.
const RUN = Math.random().toString(36).slice(2, 8);
const ipNet = `198.${18 + Math.floor(Math.random() * 2)}.${Math.floor(Math.random() * 256)}`;
let ipSeq = 10;
const newIp = () => `${ipNet}.${ipSeq++}`;
async function call(p, { ip = newIp(), method = 'GET', body, cookie, ua = UA, headers = {}, raw } = {}) {
  const h = { 'x-real-ip': ip, 'user-agent': ua, ...headers };
  if (cookie) h.cookie = cookie;
  if (body !== undefined && !raw) h['content-type'] = 'application/json';
  const res = await fetch(BASE + p, { method, headers: h, body: raw ?? (body !== undefined ? JSON.stringify(body) : undefined), redirect: 'manual' });
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { /* text body */ }
  return { status: res.status, text, json, headers: res.headers };
}
async function login(email, password, ip = newIp(), ua = UA) {
  const r = await call('/api/auth/login', { ip, ua, method: 'POST', body: { email, password } });
  const set = r.headers.get('set-cookie') || '';
  const m = set.match(/lumo_session=([^;]+)/);
  return { ...r, cookie: m ? `lumo_session=${m[1]}` : null, setCookie: set };
}

(async () => {
  const pw = passwords();
  if (!pw.luis || !pw.barbara) { console.error('Missing team passwords (data/INITIAL-PASSWORDS.txt or env).'); process.exit(2); }

  console.log('\n--- 1. Route protection ---');
  ok((await call('/admin/finanzas')).status === 307, '/admin/* without a session redirects to /login');
  ok((await call('/api/crm/prospects')).status === 401, 'CRM API without a session: 401');
  ok((await call('/api/admin/users')).status === 401, 'Users API without a session: 401');
  ok((await call('/api/admin/security')).status === 401, 'SOC API without a session: 401');
  const forged = 'lumo_session=' + Buffer.from(JSON.stringify({ id: 'usr-luis', role: 'SUPER_ADMIN', sv: 0, exp: 9999999999 })).toString('base64url') + '.deadbeef';
  ok((await call('/api/admin/users', { cookie: forged })).status === 401, 'Forged token (bad HMAC): 401');

  console.log('\n--- 2. Login, cookie flags, RBAC ---');
  const barb = await login('barbara@lumohq.com', pw.barbara);
  ok(barb.status === 200 && !!barb.cookie, 'Bárbara signs in');
  ok(/HttpOnly/i.test(barb.setCookie) && /SameSite=Strict/i.test(barb.setCookie) && /Path=\//i.test(barb.setCookie), 'Cookie is HttpOnly; SameSite=Strict; Path=/');
  ok((await call('/admin/crm', { cookie: barb.cookie })).status === 200, 'Bárbara: CRM 200');
  ok((await call('/admin/produccion', { cookie: barb.cookie })).status === 200, 'Bárbara: Day 1 production 200');
  ok((await call('/admin/finanzas', { cookie: barb.cookie })).status === 403, 'Bárbara: Finances 403');
  ok((await call('/admin/usuarios', { cookie: barb.cookie })).status === 403, 'Bárbara: Users 403');
  ok((await call('/admin/seguridad', { cookie: barb.cookie })).status === 403, 'Bárbara: Security 403');
  ok((await call('/api/admin/users', { cookie: barb.cookie })).status === 403, 'Bárbara: Users API 403');
  ok((await call('/api/crm/prospects', { cookie: barb.cookie })).status === 200, 'Bárbara: CRM API 200');
  ok((await call('/api/crm/prospects', { cookie: barb.cookie, ua: 'Stolen-Cookie-Browser' })).status === 401, 'Same cookie from another browser (fingerprint): 401');

  const luis = await login('luis@lumohq.com', pw.luis);
  // Clear a lockout an earlier run may have left on the account the brute-force test uses.
  await call('/api/admin/security', { cookie: luis.cookie, method: 'POST', body: { action: 'unlock-account', email: 'luis@lumohq.com' } });
  ok(luis.status === 200, 'Luis signs in');
  ok((await call('/admin/finanzas', { cookie: luis.cookie })).status === 200, 'Luis: Finances 200');
  ok((await call('/api/admin/users', { cookie: luis.cookie })).status === 200, 'Luis: Users API 200');
  const users = (await call('/api/admin/users', { cookie: luis.cookie })).json?.users || [];
  ok(users.length >= 3 && users.every((u) => !('hash' in u) && !('salt' in u)), 'User list never exposes hashes or salts');

  console.log('\n--- 3. Revocation ---');
  const barbId = users.find((u) => u.email === 'barbara@lumohq.com')?.id;
  ok((await call('/api/admin/users', { cookie: luis.cookie, method: 'PATCH', body: { userId: barbId, action: 'revoke-sessions' } })).status === 200, 'Luis revokes Bárbara’s sessions');
  ok((await call('/api/crm/prospects', { cookie: barb.cookie })).status === 401, 'Bárbara’s old cookie is dead: 401');
  ok((await call('/api/admin/users', { cookie: luis.cookie, method: 'POST', body: { name: 'X', email: 'x@lumohq.com', role: 'GOD_MODE' } })).status === 400, 'Unknown role rejected');

  console.log('\n--- 4. Brute force lockout ---');
  const bfIp = newIp();
  const codes = [];
  for (let i = 0; i < 6; i++) codes.push((await call('/api/auth/login', { ip: bfIp, method: 'POST', body: { email: 'luis@lumohq.com', password: 'wrong-' + i } })).status);
  ok(codes.slice(0, 5).every((c) => c === 401), '5 wrong passwords: 401 each, same generic message');
  ok(codes[5] === 403, '6th attempt from that IP: blocked (403)');
  const unk = await call('/api/auth/login', { method: 'POST', body: { email: `nobody-${RUN}@lumohq.com`, password: 'x' } });
  ok(unk.status === 401 && unk.json?.error === 'Correo o contraseña incorrectos.', 'Unknown account answers exactly like a wrong password');
  const locked = await call('/api/auth/login', { method: 'POST', body: { email: 'luis@lumohq.com', password: pw.luis } });
  ok(locked.status === 429, 'Account locked after 5 failures, even with the right password from a new IP');
  const barbNow = await login('barbara@lumohq.com', pw.barbara);
  const barbUnlock = await call('/api/admin/security', { cookie: barbNow.cookie, method: 'POST', body: { action: 'unlock-account', email: 'luis@lumohq.com' } });
  ok(barbUnlock.status === 403, `Sales cannot unlock accounts (${barbUnlock.status})`);
  ok((await call('/api/admin/security', { cookie: luis.cookie, method: 'POST', body: { action: 'unlock-account', email: 'luis@lumohq.com' } })).json?.success === true, 'Another admin session unlocks the account');
  ok((await call('/api/auth/login', { method: 'POST', body: { email: 'luis@lumohq.com', password: pw.luis } })).status === 200, 'Unlocked account signs in again');

  console.log('\n--- 5. WAF / IDS ---');
  const sqli = await call("/?q=' OR 1=1 --");
  ok(sqli.status === 403 && sqli.text.includes('Security Violation Logged'), "SQLi in query string: 403 'Security Violation Logged'");
  ok((await call('/api/diagnosis', { method: 'POST', body: { ownerName: '<script>alert(1)</script>' } })).status === 403, 'XSS in JSON body: 403');
  ok((await call('/api/diagnosis', { method: 'POST', body: { ownerName: 'x', businessName: "1 UNION SELECT password FROM users" } })).status === 403, 'UNION SELECT in body: 403');
  ok((await call('/demo/..%2f..%2fetc%2fpasswd')).status === 403, 'Encoded path traversal: 403');
  ok((await call('/api/diagnosis', { method: 'POST', body: { ownerName: 'a; cat /etc/shadow' } })).status === 403, 'Command injection in body: 403');
  const wafIp = newIp();
  await call('/?x=<script>', { ip: wafIp });
  ok((await call('/', { ip: wafIp })).status === 403, 'Attacker IP stays blocked on the next clean request');
  const legit = await call('/api/diagnosis', { method: 'POST', body: { ownerName: "Ana O'Brien", businessName: 'Tacos & Más · 3 o 4 cortes', phone: '4325550100', preferredChannel: 'whatsapp', sourceOfCustomers: 'De boca en boca', currentContactMethod: 'Me llaman', tcpaConsent: true } });
  ok(legit.status === 200, "Normal business text (O'Brien, &, ·) passes the WAF");
  const err = await call('/?q=<script>');
  ok(!/at\s+\w+\s*\(|node_modules|stack/i.test(err.text), 'Block response exposes no stack trace');

  console.log('\n--- 6. Honeypots ---');
  const hpIp = newIp();
  const hp = await call('/api/diagnosis', { ip: hpIp, method: 'POST', body: { ownerName: 'Bot', website: 'http://spam.example' } });
  ok(hp.status === 200, 'Honeypot filled: bot gets a fake success');
  ok((await call('/', { ip: hpIp })).status === 403, 'Honeypot IP is now blocked');
  const hpl = newIp();
  await call('/api/auth/login', { ip: hpl, method: 'POST', body: { email: 'luis@lumohq.com', password: 'x', website: 'bot' } });
  ok((await call('/', { ip: hpl })).status === 403, 'Login honeypot blocks the IP');

  console.log('\n--- 7. Payments, contracts, client portal ---');
  const wh = await call('/api/webhooks/stripe', { method: 'POST', headers: { 'x-lumo-test-webhook': 'true' }, body: { id: 'evt_fake', type: 'checkout.session.completed', data: { object: { metadata: { contractId: 'x' }, amount_total: 50000 } } } });
  ok(wh.status !== 200, 'Forged Stripe webhook with the old bypass header is rejected');
  const ts = Math.floor(Date.now() / 1000) - 3600;
  const replay = await call('/api/webhooks/stripe', { method: 'POST', headers: { 'stripe-signature': `t=${ts},v1=${'a'.repeat(64)}` }, body: { id: 'evt_old' } });
  ok(replay.status !== 200, 'Old/replayed signature is rejected');
  ok((await call('/api/client/approve', { method: 'POST', body: { clientId: 'cli_elrey_01', clientWrittenConfirmation: true } })).status === 403, 'Client approval without the portal key: 403');
  ok((await call('/api/client/checklist', { method: 'POST', body: { clientId: 'cli_elrey_01', key: 'x'.repeat(32), updates: { hoursSet: true } } })).status === 403, 'Client checklist with a wrong key: 403');
  const links = (await call('/api/admin/portal-link', { cookie: luis.cookie })).json?.links || [];
  const link = links.find((l) => l.clientId === 'cli_elrey_01');
  ok(!!link, 'Admin can generate the private portal link');
  const key = link ? new URL(link.url).searchParams.get('k') : '';
  const tamper = await call('/api/client/checklist', { method: 'POST', body: { clientId: 'cli_elrey_01', key, updates: { photosUploadedCount: 99, isComplete: true, hoursSet: true } } });
  ok(tamper.status === 200 && tamper.json?.project?.day1Checklist?.photosUploadedCount !== 99, 'Checklist ignores a forged photo count');

  console.log('\n--- 8. Uploads (magic bytes, polyglot, UUID) ---');
  const up = async (name, bytes, ip = newIp()) => {
    const fd = new FormData();
    fd.append('clientId', 'cli_elrey_01'); fd.append('key', key);
    fd.append('photos', new Blob([bytes]), name);
    const r = await fetch(BASE + '/api/client/photos', { method: 'POST', body: fd, headers: { 'x-real-ip': ip, 'user-agent': UA } });
    return { status: r.status, json: await r.json().catch(() => ({})) };
  };
  const jpeg = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(200, 7), Buffer.from([0xff, 0xd9])]);
  const good = await up('foto.jpg', jpeg);
  ok(good.status === 200 && good.json.saved === 1, 'Real JPEG is accepted');
  const dir = path.join(__dirname, '..', 'data', 'uploads', 'cli_elrey_01');
  ok(fs.existsSync(dir) && fs.readdirSync(dir).every((f) => /^[0-9a-f-]{36}\.(jpg|png|webp)$/.test(f)), 'Stored under a UUID v4 name, outside /public');
  ok((await up('shell.jpg', Buffer.from('<?php system($_GET["c"]); ?>'))).status === 400, 'PHP renamed to .jpg: rejected by magic bytes');
  const poly = Buffer.concat([jpeg, Buffer.from('<script>alert(1)</script>')]);
  ok((await up('poly.jpg', poly)).status === 400, 'JPEG polyglot with an embedded <script>: rejected');
  ok((await up('x.svg', Buffer.from('<svg onload=alert(1)>'))).status === 400, 'SVG rejected');
  ok((await call('/api/client/photos', { method: 'POST', raw: 'x', headers: { 'content-type': 'multipart/form-data; boundary=z' } })).status >= 400, 'Malformed upload rejected');

  console.log('\n--- 8b. CRM (Phase 3) ---');
  const barb2 = await login('barbara@lumohq.com', pw.barbara);
  const crmList = (await call('/api/crm/prospects', { cookie: luis.cookie })).json?.prospects || [];
  const target = crmList.find((x) => x.stage === 'LISTED') || crmList[0];
  const mass = await call('/api/crm/prospects', { cookie: luis.cookie, method: 'PATCH', body: { id: target.id, action: 'update_details', details: { totalScore: 8, priority: 'P1', followUpCount: 0 } } });
  ok(mass.status === 400, 'Mass assignment (score, priority, follow-up count) rejected');
  ok((await call('/api/crm/prospects', { cookie: luis.cookie, method: 'PATCH', body: { id: target.id, action: 'update_stage', stage: 'HACKED' } })).status === 400, 'Unknown stage rejected');
  ok((await call('/api/crm/prospects', { cookie: barb2.cookie, method: 'POST', body: { action: 'import_csv', csv: 'negocio,teléfono\nX,4325550199' } })).status === 403, 'Bárbara cannot bulk-import');
  // A new number each run: the CRM keeps earlier imports while the server runs.
  const testPhone = `(432) 555-${1000 + Math.floor(Math.random() * 9000)}`;
  const imp = await call('/api/crm/prospects', { cookie: luis.cookie, method: 'POST', body: { action: 'import_csv', batchNumber: 5, csv: `negocio,teléfono,ciudad\n=cmd|calc ${RUN},${testPhone},Midland\nDup,${testPhone},Odessa\nMal,12,Midland` } });
  ok(imp.status === 200 && imp.json.created === 1 && imp.json.skipped.length === 1 && imp.json.errors.length === 1, 'CSV import: creates valid rows, skips duplicates, reports bad ones');
  const exported = (await call('/api/crm/prospects', { cookie: luis.cookie })).json.prospects.find((x) => x.phone.includes('0777'));
  ok(exported && exported.businessName.startsWith('=cmd'), 'Imported name stored as text (export neutralizes it)');
  ok((await call('/api/crm/prospects', { cookie: luis.cookie, method: 'PATCH', body: { id: exported.id, action: 'opt_out', optedOut: true } })).status === 200, 'Opt-out recorded');
  ok((await call('/api/crm/prospects', { cookie: luis.cookie, method: 'PATCH', body: { id: exported.id, action: 'follow_up' } })).status === 409, 'Follow-up to an opted-out business: refused (TCPA)');
  const tcpa = crmList.find((x) => x.followUpCount >= 3);
  if (tcpa) ok((await call('/api/crm/prospects', { cookie: luis.cookie, method: 'PATCH', body: { id: tcpa.id, action: 'follow_up' } })).status === 409, '4th follow-up refused (TCPA 3/3)');
  const dlink = (await call(`/api/crm/diagnosis-link?id=${encodeURIComponent(target.id)}`, { cookie: barb2.cookie })).json?.url;
  ok(!!dlink, 'Staff get a signed diagnosis link');
  const diagPath = new URL(dlink).pathname;
  const noKey = await call(diagPath);
  ok(noKey.status === 200 && noKey.text.includes('no es válido') && !noKey.text.includes(target.businessName), 'Diagnosis without the key shows nothing');
  const withKey = await call(diagPath + new URL(dlink).search);
  ok(withKey.text.includes(target.businessName.replace(/&/g, '&amp;')), 'Diagnosis with the key shows that business');
  ok(!withKey.text.includes(target.phone) && !(target.ownerName && withKey.text.includes(target.ownerName)), 'Diagnosis never prints the owner name or phone');
  const other = crmList.find((x) => x.id !== target.id && !x.businessName.includes(target.businessName) && !target.businessName.includes(x.businessName));
  ok(!withKey.text.includes(other.businessName), 'Diagnosis page leaks no other prospect');
  ok((await call(`/diagnostico/${encodeURIComponent(other.id)}${new URL(dlink).search}`)).text.includes('no es válido'), "One business's key does not open another's diagnosis");

  console.log('\n--- 9. Security center ---');
  const soc = await call('/api/admin/security', { cookie: luis.cookie });
  ok(soc.status === 200 && soc.json?.integrity?.intact === true, 'Audit log hash chain is intact');
  const types = new Set((soc.json?.entries || []).map((e) => e.type));
  ok(['LOGIN_OK', 'LOGIN_FAIL', 'WAF_BLOCK', 'HONEYPOT', 'IP_BLOCKED', 'ACCESS_DENIED', 'SESSIONS_REVOKED', 'UPLOAD_REJECTED'].every((t) => types.has(t)), 'Every attack class above shows up in the audit log');
  const blocked = (soc.json?.blocks || []).find((b) => b.ip === wafIp);
  ok(!!blocked, 'Blocked IP listed in the SOC');
  ok((await call('/api/admin/security', { cookie: luis.cookie, method: 'POST', body: { action: 'unblock-ip', ip: wafIp } })).json?.success === true, 'Admin unblocks an IP');
  ok((await call('/', { ip: wafIp })).status === 200, 'Unblocked IP gets through again');

  console.log('\n--- 10. IRS ledger and Sunday board ---');
  const carlos = await login('carlos@lumohq.com', pw.carlos);
  const L = '/api/admin/ledger';
  ok((await call(L)).status === 401 || (await call(L)).status === 403, 'Ledger without a session: refused');
  ok((await call(L, { cookie: barb2.cookie })).status === 403, 'Ledger for sales: 403');
  ok((await call('/api/admin/sunday', { cookie: barb2.cookie })).status === 403, 'Sunday board for sales: 403');
  ok((await call(L, { cookie: luis.cookie, method: 'POST', body: { kind: 'trip', date: '2026-11-01', client: 'Prueba', city: 'Midland', miles: 9999 } })).status === 400, 'Trip over 500 miles: rejected');
  ok((await call(L, { cookie: luis.cookie, method: 'POST', body: { kind: 'trip', date: '2999-01-01', client: 'Prueba', city: 'Midland', miles: 10 } })).status === 400, 'Trip dated in the future: rejected');
  ok((await call(L, { cookie: luis.cookie, method: 'POST', body: { kind: 'expense', date: '2026-11-01', concept: 'Prueba', category: 'Otro', amount: 150, signatures: { carlos: { by: 'x', at: 'y' } } } })).status === 400, 'Expense with forged signatures in the body: rejected');
  const made = await call(L, { cookie: luis.cookie, method: 'POST', body: { kind: 'expense', date: '2026-11-01', concept: 'Suite: gasto doble firma', category: 'Otro', amount: 150 } });
  const big = made.json?.expenses?.find((e) => e.concept === 'Suite: gasto doble firma');
  ok(made.status === 201 && big && big.signatures.luis && !big.signatures.carlos, 'Expense over $100 starts with only the creator signature');
  ok((await call(L, { cookie: luis.cookie, method: 'PATCH', body: { action: 'sign', id: big.id } })).status === 409, 'Same partner cannot sign twice');
  ok((await call(L, { cookie: barb2.cookie, method: 'PATCH', body: { action: 'sign', id: big.id } })).status === 403, 'Sales cannot sign');
  const signed = await call(L, { cookie: carlos.cookie, method: 'PATCH', body: { action: 'sign', id: big.id } });
  ok(signed.status === 200 && signed.json.expenses.find((e) => e.id === big.id).signatures.carlos, 'Second partner signs: expense approved');
  ok((await call('/api/admin/sunday', { cookie: luis.cookie, method: 'POST', body: { action: 'save', review: { milestone: 14, hours: { luisHours: 9.3, carlosHours: 1, barbaraHours: 1, contactsThisWeek: 1 }, metrics: { contacts: 1, diagnoses: 1, meetings: 1, closedClients: 1, mrr: 100 }, notes: '' } } })).status === 400, 'Sunday hours must be in halves');
  ok((await call('/api/admin/sunday', { cookie: luis.cookie, method: 'POST', body: { action: 'save', review: { milestone: 15, hours: {}, metrics: {}, notes: '' } } })).status === 400, 'Sunday review with a bad milestone: rejected');

  console.log(`\nSECURITY SUITE: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
