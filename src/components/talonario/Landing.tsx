'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight, CalendarDays, Check, Clock, Globe, MessageCircle, MessageSquareText, Minus,
  PauseCircle, PenLine, Phone, Plus, Search, Star, Store, Armchair, Scissors, Sparkles, Users,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { COPY, CONTACT, type Copy } from './copy';
import { Phone3D } from './Phone3D';
import { LiveSimulator } from './LiveSimulator';
import './talonario.css';

function LumoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="-28 -28 604 216" className={className} aria-hidden="true">
      <path d="M12 12V148M60 72V110A38 38 0 0 0 136 110M136 72V148M184 72V148M184 106A34 34 0 0 1 252 106V148M252 106A34 34 0 0 1 320 106V148" fill="none" stroke="currentColor" strokeWidth="24" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="400" cy="110" r="38" fill="none" stroke="#F2A33A" strokeWidth="24" />
      <circle cx="400" cy="110" r="11" fill="#F2A33A" />
      <path d="M470.5 64.5V95.5M495.5 64.5V95.5M470.5 80H495.5M522 64.5A15.5 15.5 0 1 0 522.01 64.5ZM528 88L538 98" fill="none" stroke="#F2A33A" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LangSwitch({ paper, away }: { paper?: boolean; away?: boolean }) {
  const { locale, setLocale } = useI18n();
  return (
    <div className={`lang${paper ? ' lang-paper' : ''}${away ? ' away' : ''}`} role="group" aria-label="Idioma / Language" aria-hidden={away || undefined}>
      <button type="button" aria-pressed={locale === 'es'} onClick={() => setLocale('es')}>ES</button>
      <button type="button" aria-pressed={locale === 'en'} onClick={() => setLocale('en')}>EN</button>
    </div>
  );
}

/** Sheets slide up off the pad the first time they enter the viewport. Content is visible by default. */
function useLift() {
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const els = Array.from(document.querySelectorAll<HTMLElement>('.tal .lift'));
    const vh = window.innerHeight;
    els.forEach((el) => { if (el.getBoundingClientRect().top > vh * 0.9) el.classList.add('pre'); });
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.remove('pre'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

function Hero({ t }: { t: Copy }) {
  const { locale } = useI18n();
  const [biz, setBiz] = useState('');
  const [screen, setScreen] = useState(0);
  const [stampKey, setStampKey] = useState(0);
  const typed = useRef(false);
  const today = new Date().toLocaleDateString(locale === 'es' ? 'es-US' : 'en-US', { day: '2-digit', month: 'short', year: 'numeric' });

  const onBiz = (v: string) => {
    setBiz(v);
    if (!typed.current && v.trim().length > 2) { typed.current = true; setStampKey((k) => k + 1); }
  };

  return (
    <section className="hero" aria-labelledby="h1">
      <div className="wrap hero-grid">
        <div className="pad-stack">
          <div className="under" aria-hidden="true"><span>{t.copyTag}</span></div>
          <article className="sheet perf nota">
            <div className="sheet-pad">
              <div className="letterhead">
                <div className="mark"><LumoMark /><small>{t.tagline}</small></div>
                <div className="folio">
                  <span>{t.notaNo}</span><b>0001</b><span suppressHydrationWarning>{today}</span>
                  <LangSwitch paper />
                </div>
              </div>
              <h1 id="h1"><span>{t.h1a}</span><span>{t.h1b}</span></h1>
              <p className="lede">{t.heroLede}</p>
              <div className="to-line">
                <label htmlFor="bizName">{t.toLabel}</label>
                <input id="bizName" autoComplete="organization" maxLength={40} spellCheck={false} placeholder={t.toPh} value={biz} onChange={(e) => onBiz(e.target.value)} />
              </div>
              <table className="items">
                <thead><tr><th scope="col"><span className="vh">{t.colOk}</span></th><th scope="col">{t.colItem}</th><th scope="col">{t.colAmt}</th></tr></thead>
                <tbody>
                  {t.items.map((it) => (
                    <tr key={it}><td><Check className="ck" aria-hidden="true" /></td><td>{it}</td><td className="amt" /></tr>
                  ))}
                  <tr><td /><td>{t.setup} <span className="muted">{t.setupNote}</span></td><td className="amt num">$500</td></tr>
                  <tr><td /><td>{t.monthly} <span className="muted">{t.monthlyNote}</span></td><td className="amt num">{t.monthlyAmt}</td></tr>
                </tbody>
              </table>
              <div className="totals">
                <div className="big"><small>{t.delivLabel}</small>{t.deliv}</div>
                <span key={stampKey} className={`stamp${stampKey ? ' hit' : ''}`} aria-hidden="true">{t.stampHalf}</span>
              </div>
            </div>
            <a className="stub" href="#diagnostico">
              <span>{t.stubT}<small>{t.stubS}</small></span><ArrowRight className="ico" aria-hidden="true" />
            </a>
          </article>
        </div>
        <aside className="desk-side" aria-label={t.phoneTabs.join(' · ')}>
          <p className="desk-note" aria-hidden="true">{t.deskNote}</p>
          <div className="phone3d">
            <Phone3D locale={locale} screen={screen} onScreen={setScreen} fallback={t.phone3dFallback} />
          </div>
          <div className="phone-caption" role="group">
            {t.phoneTabs.map((tab, i) => (
              <button key={tab} type="button" aria-pressed={screen === i} onClick={() => setScreen(i)}>{tab}</button>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}

function BeforeAfter({ t }: { t: Copy }) {
  const [on, setOn] = useState(false);
  const missing = on ? 0 : 6;
  const icons = [Phone, MessageSquareText, CalendarDays, Star];
  return (
    <section className="band" id="hoy">
      <div className="wrap">
        <article className="sheet perf lift">
          <div className="sheet-pad">
            <div className="folio-row"><b>Nº 0003</b></div>
            <h2 className="sec-title">{t.baTitle}</h2>
            <p className="sec-lede">{t.baLede}</p>
            <div className={`ba${on ? ' on' : ''}`}>
              <div>
                <div className="checks" role="group" aria-label={`${t.before} / ${t.after}`}>
                  <button type="button" className="checkbox" aria-pressed={!on} onClick={() => setOn(false)}><i><Check aria-hidden="true" /></i>{t.before}</button>
                  <button type="button" className="checkbox" aria-pressed={on} onClick={() => setOn(true)}><i><Check aria-hidden="true" /></i>{t.after}</button>
                </div>
                <div className="profile">
                  <div className="search"><Search className="ico" aria-hidden="true" />{t.searchQ}</div>
                  <div className="ph" aria-hidden="true"><i><Store /></i><i><Armchair /></i><i><Scissors /></i><i><Sparkles /></i><i><Users /></i></div>
                  <p className="pname">{t.pName}</p>
                  <p className="pmeta">
                    <span className="stars" aria-label="4.9">{[0, 1, 2, 3, 4].map((k) => <Star key={k} fill="currentColor" strokeWidth={0} />)}</span>
                    <span className="num">4.9</span><span>{on ? t.revA : t.revB}</span>
                  </p>
                  <p className="prow"><Clock className="ico" aria-hidden="true" /><span className={on ? '' : 'blank'}>{on ? t.hA : t.hB}</span></p>
                  <p className="prow"><Globe className="ico" aria-hidden="true" /><span className={on ? '' : 'blank'}>{on ? t.wA : t.wB}</span></p>
                  <div className="pbtns">
                    {[t.bCall, t.bText, t.bBook, t.bRev].map((b, i) => { const I = icons[i]; return <span key={b}><I className="ico" aria-hidden="true" />{b}</span>; })}
                  </div>
                </div>
                <p className="ex-note">{t.exNote}</p>
              </div>
              <div>
                <ul className="ledger">
                  {t.sig.map(([k, v]) => (
                    <li key={k}><b>{k}</b><span className="val">{on ? <span key="v" className="hand">{v}</span> : <span className="missing">{t.missing}</span>}</span></li>
                  ))}
                </ul>
                <p className="ba-count" aria-live="polite"><b>{t.baCount(missing)}</b></p>
                <div className="ba-stamp">{on && <span className="stamp green hit">{t.stampDone}</span>}</div>
              </div>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}

function Days({ t }: { t: Copy }) {
  return (
    <section className="band" id="entrega" style={{ paddingTop: 0 }}>
      <div className="wrap">
        <article className="sheet lift">
          <div className="sheet-pad">
            <div className="folio-row"><b>Nº 0004</b></div>
            <h2 className="sec-title">{t.procTitle}</h2>
            <p className="sec-lede">{t.procLede}</p>
            <div className="days">
              {t.days.map(([n, h, p, who], i) => (
                <div className="day" key={n}>
                  <div className="dh"><b>{n}</b><span>{t.dayWord}</span></div>
                  <h3>{h}</h3><p>{p}</p><span className="who">{who}</span>
                  <span className={`stamp${i === 0 || i === 5 ? ' green' : ''}`}>{t.stampDay[i]}</span>
                </div>
              ))}
            </div>
            <div className="pause"><PauseCircle className="ico" aria-hidden="true" /><p>{t.pause}</p></div>
          </div>
        </article>
      </div>
    </section>
  );
}

function Tally({ n }: { n: number }) {
  const groups = Math.floor(n / 5), rest = n % 5;
  const mark = (k: number, count: number) => (
    <svg key={k} viewBox="0 0 52 46" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round">
      {Array.from({ length: Math.min(count, 4) }, (_, i) => <line key={i} x1={8 + i * 10} y1={6} x2={6 + i * 10} y2={40} />)}
      {count === 5 && <line x1={2} y1={34} x2={46} y2={10} />}
    </svg>
  );
  return <div className="tally">{[...Array.from({ length: groups }, (_, k) => mark(k, 5)), ...(rest ? [mark(groups, rest)] : [])]}</div>;
}

function MathSheet({ t }: { t: Copy }) {
  const [val, setVal] = useState(600);
  const n = Math.max(1, Math.ceil(1700 / Math.max(50, val)));
  const pct = ((Math.min(3000, Math.max(100, val)) - 100) / 2900) * 100;
  return (
    <section className="band" id="cuenta" style={{ paddingTop: 0 }}>
      <div className="wrap">
        <article className="sheet perf lift">
          <div className="sheet-pad">
            <div className="folio-row"><b>Nº 0005</b></div>
            <h2 className="sec-title">{t.calcTitle}</h2>
            <div className="math">
              <div>
                <table className="sum"><tbody>
                  <tr><td>{t.s1}</td><td>$500</td></tr>
                  <tr><td>{t.s2}</td><td>$1,200</td></tr>
                  <tr className="total"><td>{t.s3}</td><td>$1,700</td></tr>
                </tbody></table>
                <div className="val-field">
                  <label htmlFor="valNum">{t.calcLabel}</label>
                  <div className="val-row"><span>$</span><input id="valNum" type="number" inputMode="numeric" min={50} max={20000} step={50} value={val} onChange={(e) => setVal(Number(e.target.value) || 0)} /></div>
                  <input type="range" min={100} max={3000} step={50} value={Math.min(3000, Math.max(100, val))} aria-label={t.calcLabel} style={{ ['--p' as string]: `${pct}%` }} onChange={(e) => setVal(Number(e.target.value))} />
                  <div className="range-ends"><span>$100</span><span>$3,000</span></div>
                </div>
              </div>
              <div>
                <Tally n={Math.min(n, 20)} />
                <p className="result" aria-live="polite">{t.calcRes(n)}</p>
                <p className="fine">{t.calcFine}</p>
              </div>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}

function Prices({ t }: { t: Copy }) {
  return (
    <>
      <section className="band" id="precios" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <article className="sheet perf lift">
            <div className="sheet-pad">
              <div className="folio-row"><b>Nº 0006</b></div>
              <h2 className="sec-title">{t.priceTitle}</h2>
              <p className="sec-lede">{t.priceLede}</p>
              <div className="price-notas">
                {[
                  { k: 'base', name: t.base, for: t.baseFor, web: t.r2a, missed: false, setup: '$500', setupNote: t.r6a, monthly: '$100', href: '/checkout?package=BASE', go: t.goBase, hl: true },
                  { k: 'prem', name: t.prem, for: t.premFor, web: t.r2b, missed: true, setup: t.r6b, setupNote: t.r6bs, monthly: '$150–200', href: '#diagnostico', go: t.goPrem, hl: false },
                ].map((n) => (
                  <section key={n.k} className={`pnota${n.hl ? ' hl' : ''}`} aria-label={n.name}>
                    <header><h3>{n.name}</h3><p>{n.for}</p></header>
                    <ul>
                      <li><Check className="ico" aria-hidden="true" />{t.rows[0]}</li>
                      <li><Check className="ico" aria-hidden="true" />{t.rows[1]}: {n.web}</li>
                      <li><Check className="ico" aria-hidden="true" />{t.rows[2]}</li>
                      <li className={n.missed ? '' : 'off'}>{n.missed ? <Check className="ico" aria-hidden="true" /> : <Minus className="ico" aria-label={t.notIncl} />}{t.rows[3]}</li>
                      <li><Check className="ico" aria-hidden="true" />{t.rows[4]}</li>
                    </ul>
                    <dl>
                      <div><dt>{t.r6}<small>{n.setupNote}</small></dt><dd className="num">{n.setup}</dd></div>
                      <div><dt>{t.r7}</dt><dd className="num">{n.monthly}</dd></div>
                    </dl>
                    {n.href.startsWith('#') ? <a className="pgo" href={n.href}>{n.go}<ArrowRight className="ico" aria-hidden="true" /></a>
                      : <Link className="pgo" href={n.href} prefetch>{n.go}<ArrowRight className="ico" aria-hidden="true" /></Link>}
                  </section>
                ))}
              </div>
              <div className="founder">
                <span className="stamp">{t.fStamp}</span>
                <p>{t.fText} <Link href="/checkout?package=FOUNDER" prefetch>{t.fGo}</Link></p>
              </div>
              <div className="covers">
                {t.covers.map(([b, s]) => <div key={b}><b>{b}</b><span>{s}</span></div>)}
              </div>
              <p className="fine">{t.taxNote}</p>
            </div>
          </article>
        </div>
      </section>
      <section className="band" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <article className="sheet reverse lift">
            <div className="sheet-pad">
              <div className="folio-row"><b>Nº 0006-R</b></div>
              <h2 className="sec-title">{t.promTitle}</h2>
              <ol className="clauses">
                {t.prom.map(([a, b]) => <li key={a}><div><b><s>{a}</s></b><span>{b}</span></div></li>)}
              </ol>
            </div>
          </article>
        </div>
      </section>
    </>
  );
}

function Faq({ t }: { t: Copy }) {
  return (
    <section className="band" id="preguntas" style={{ paddingTop: 0 }}>
      <div className="wrap">
        <article className="sheet perf lift">
          <div className="sheet-pad">
            <div className="folio-row"><b>Nº 0007</b></div>
            <h2 className="sec-title">{t.faqTitle}</h2>
            <div className="qa">
              {t.faq.map(([q, a]) => (
                <details key={q}>
                  <summary><span className="q">{t.qL}</span><span>{q}</span><Plus className="ico" aria-hidden="true" /></summary>
                  <div className="a"><b>{t.aL}</b><p>{a}</p></div>
                </details>
              ))}
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}

type Channel = 'whatsapp' | 'sms' | 'call';

export function Request({ t }: { t: Copy }) {
  const [f, setF] = useState({ ownerName: '', businessName: '', phone: '', preferredChannel: 'whatsapp' as Channel, sourceOfCustomers: '', currentContactMethod: '', tcpaConsent: false, website: '' });
  const [err, setErr] = useState<{ field?: string; msg: string } | null>(null);
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => { setF((p) => ({ ...p, [k]: v })); if (err?.field === k) setErr(null); };
  const chLabel = { whatsapp: t.chWhatsapp, sms: t.chSms, call: t.chCall };
  const chIcon = { whatsapp: MessageCircle, sms: MessageSquareText, call: Phone };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = f.phone.replace(/\D/g, '');
    if (f.ownerName.trim().length < 2) return setErr({ field: 'ownerName', msg: t.errName });
    if (f.businessName.trim().length < 2) return setErr({ field: 'businessName', msg: t.errBiz });
    if (digits.length < 10) return setErr({ field: 'phone', msg: t.errPhone });
    if (!f.sourceOfCustomers || !f.currentContactMethod) return setErr({ field: 'qs', msg: t.errQs });
    if (!f.tcpaConsent) return setErr({ field: 'tcpaConsent', msg: t.errConsent });
    setState('sending'); setErr(null);
    try {
      const res = await fetch('/api/diagnosis', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || t.errNet);
      setState('sent');
    } catch (ex) {
      setState('idle');
      setErr({ msg: ex instanceof Error && ex.message ? ex.message : t.errNet });
    }
  };
  const cls = (k: string) => `fline${err?.field === k ? ' err' : ''}`;
  const filled = f.ownerName || f.businessName || f.phone;

  return (
    <section className="band" id="diagnostico" style={{ paddingTop: 0 }}>
      <div className="wrap">
        <article className="sheet perf lift">
          <div className="sheet-pad">
            <div className="folio-row"><b>Nº 0008</b></div>
            <h2 className="sec-title">{t.ctaTitle}</h2>
            <p className="sec-lede">{t.ctaLede}</p>
            <div className="req">
              <form onSubmit={submit} noValidate>
                <div className="two">
                  <div className={cls('ownerName')}><label htmlFor="f-name">{t.fmName}</label><input id="f-name" autoComplete="name" maxLength={80} value={f.ownerName} onChange={(e) => set('ownerName', e.target.value)} aria-invalid={err?.field === 'ownerName'} /></div>
                  <div className={cls('businessName')}><label htmlFor="f-biz">{t.fmBiz}</label><input id="f-biz" autoComplete="organization" maxLength={100} value={f.businessName} onChange={(e) => set('businessName', e.target.value)} aria-invalid={err?.field === 'businessName'} /></div>
                </div>
                <div className={cls('phone')}><label htmlFor="f-phone">{t.fmPhone}</label><input id="f-phone" type="tel" inputMode="tel" autoComplete="tel" maxLength={20} value={f.phone} onChange={(e) => set('phone', e.target.value)} aria-invalid={err?.field === 'phone'} /></div>
                <span className="flabel" id="ch-label">{t.fmChannel}</span>
                <div className="channels" role="group" aria-labelledby="ch-label">
                  {(['whatsapp', 'sms', 'call'] as Channel[]).map((k) => { const I = chIcon[k]; return (
                    <button key={k} type="button" aria-pressed={f.preferredChannel === k} onClick={() => set('preferredChannel', k)}><I className="ico" aria-hidden="true" />{chLabel[k]}</button>
                  ); })}
                </div>
                <div className="two">
                  <div className={cls('qs')}><label htmlFor="f-src">{t.fmSource}</label>
                    <select id="f-src" value={f.sourceOfCustomers} onChange={(e) => set('sourceOfCustomers', e.target.value)}>
                      <option value="">{t.choose}</option>{t.sourceOpts.map((o) => <option key={o}>{o}</option>)}
                    </select></div>
                  <div className={cls('qs')}><label htmlFor="f-ct">{t.fmContact}</label>
                    <select id="f-ct" value={f.currentContactMethod} onChange={(e) => set('currentContactMethod', e.target.value)}>
                      <option value="">{t.choose}</option>{t.contactOpts.map((o) => <option key={o}>{o}</option>)}
                    </select></div>
                </div>
                {/* Honeypot: hidden from people, bots fill it; the API drops those requests. */}
                <div className="hp" aria-hidden="true"><label htmlFor="f-web">Website</label><input id="f-web" tabIndex={-1} autoComplete="off" value={f.website} onChange={(e) => set('website', e.target.value)} /></div>
                <label className="consent"><input type="checkbox" checked={f.tcpaConsent} onChange={(e) => set('tcpaConsent', e.target.checked)} /><span>{t.consent}</span></label>
                <p className="errmsg" role="alert">{err?.msg}</p>
                <button className="send" type="submit" disabled={state !== 'idle'}>
                  <span>{state === 'sending' ? t.fmSending : t.fmSend}</span><PenLine className="ico" aria-hidden="true" />
                </button>
              </form>
              <div className="out" aria-live="polite">
                <h3>{t.outTitle}</h3>
                <p>{state === 'sent' ? t.outDone : t.outText}</p>
                <ul>
                  {[f.ownerName, f.businessName, f.phone, chLabel[f.preferredChannel], f.sourceOfCustomers, f.currentContactMethod].map((v, i) => (
                    <li key={i}><span>{t.outRows[i]}</span><span className={`hand${v ? '' : ' blank'}`}>{v}</span></li>
                  ))}
                </ul>
                {!filled && <p className="empty">{t.outEmpty}</p>}
                {state === 'sent' && <span className="stamp carbon hit">{t.outSent}</span>}
              </div>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}

export function Landing() {
  const { locale } = useI18n();
  const t = COPY[locale];
  const [dock, setDock] = useState(false);
  const [headAway, setHeadAway] = useState(true);
  useLift();

  // One logo and one language switch in view: the header's copies wait until the nota's letterhead
  // scrolls away. The dock carries the action whenever the hero stub is out of view, and hides at the form.
  useEffect(() => {
    const update = () => {
      const vh = window.innerHeight;
      const head = document.querySelector('.tal .letterhead')?.getBoundingClientRect();
      const stub = document.querySelector('.tal .hero .stub')?.getBoundingClientRect();
      const req = document.getElementById('diagnostico')?.getBoundingClientRect().top ?? Infinity;
      setHeadAway(!head || head.bottom < 60);
      const stubVisible = !!stub && stub.top < vh && stub.bottom > 0;
      setDock(!stubVisible && req > vh * 0.6);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => { window.removeEventListener('scroll', update); window.removeEventListener('resize', update); };
  }, []);

  return (
    <div className="tal" lang={locale}>
      <header className={`desk-top${headAway ? '' : ' bare'}`}>
        <div className="wrap">
          <Link className={`logo${headAway ? '' : ' away'}`} href="/" aria-label="Lumo HQ"><LumoMark /></Link>
          <nav className="desk-nav" aria-label={locale === 'es' ? 'Secciones' : 'Sections'}>
            {t.nav.map(([href, label]) => <a key={href} href={href}>{label}</a>)}
          </nav>
          <LangSwitch away={!headAway} />
          <Link className="desk-login" href="/login">{t.login}</Link>
          <a className="desk-cta" href="#diagnostico">{t.navCta}</a>
        </div>
      </header>

      <main id="top">
        <Hero t={t} />
        <section className="band" id="simulador" style={{ paddingTop: 0 }}>
          <div className="wrap">
            <article className="sheet perf lift">
              <div className="sheet-pad">
                <div className="folio-row"><b>Nº 0002</b></div>
                <h2 className="sec-title">{t.simTitle}</h2>
                <p className="sec-lede">{t.simLede}</p>
                <LiveSimulator t={t} />
              </div>
            </article>
          </div>
        </section>
        <BeforeAfter t={t} />
        <Days t={t} />
        <MathSheet t={t} />
        <Prices t={t} />
        <Faq t={t} />
        <Request t={t} />
      </main>

      <footer className="foot">
        <div className="wrap">
          <div className="row"><LumoMark className="lg" /><span>{t.foot}</span></div>
          <nav aria-label="Lumo HQ">{t.footLinks.map(([href, label]) => <Link key={href} href={href}>{label}</Link>)}</nav>
          <p className="ftc"><b>{t.ftcTitle}</b> {t.ftc}</p>
        </div>
      </footer>

      <div className={`dock${dock ? ' show' : ''}${CONTACT.phone ? '' : ' solo'}`} inert={!dock}>
        {CONTACT.phone && <a className="call" href={`tel:${CONTACT.phone}`}><Phone className="ico" aria-hidden="true" />{t.dockCall}</a>}
        <a href="#diagnostico"><span>{t.stubT}</span><ArrowRight className="ico" aria-hidden="true" /></a>
      </div>
    </div>
  );
}
