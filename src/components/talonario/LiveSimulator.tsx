'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight, CalendarCheck, ChevronLeft, Grid3x3, Instagram, MessageCircle, MessageSquareText,
  MicOff, Phone, SendHorizontal, Volume2,
} from 'lucide-react';
import type { Copy } from './copy';

type Channel = 'booking' | 'whatsapp' | 'social';
type View = 'home' | 'call' | 'sms' | Channel;
type Msg = { from: 'me' | 'biz'; text: string };

const CHANNEL_ICON = { booking: CalendarCheck, whatsapp: MessageCircle, social: Instagram } as const;

/** Chat thread with a scripted business on the other end. */
function Chat({ head, first, chips, replies, fallback, placeholder, sendLabel, variant }: {
  head: string; first: string; chips: string[]; replies: Record<string, string>; fallback: string;
  placeholder: string; sendLabel: string; variant?: 'sms' | 'wa' | 'ig';
}) {
  const [msgs, setMsgs] = useState<Msg[]>([{ from: 'biz', text: first }]);
  const [typing, setTyping] = useState(false);
  const [draft, setDraft] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  // scroll only the phone screen, never the page
  useEffect(() => { const box = endRef.current?.closest('.scr'); if (box) box.scrollTo({ top: box.scrollHeight, behavior: 'smooth' }); }, [msgs, typing]);

  const send = (text: string) => {
    const clean = text.trim().slice(0, 140);
    if (!clean || typing) return;
    setMsgs((m) => [...m, { from: 'me', text: clean }]);
    setDraft('');
    timers.current.push(window.setTimeout(() => setTyping(true), 350));
    timers.current.push(window.setTimeout(() => {
      setTyping(false);
      setMsgs((m) => [...m, { from: 'biz', text: replies[clean] ?? fallback }]);
    }, 1400));
  };

  return (
    <>
      <div className="chat-head">
        <span className="av" aria-hidden="true">ER</span>
        <span><b>{head}</b><small>El Rey</small></span>
      </div>
      <div className="bubbles" aria-live="polite">
        {msgs.map((m, i) => <p key={i} className={`bub ${m.from}`} style={{ whiteSpace: 'pre-line' }}>{m.text}</p>)}
        {typing && <p className="bub biz typing" aria-label="…"><i /><i /><i /></p>}
        <div ref={endRef} />
      </div>
      <div className="chips">
        {chips.map((c) => <button key={c} type="button" onClick={() => send(c)}>{c}</button>)}
      </div>
      <form className="composer" onSubmit={(e) => { e.preventDefault(); send(draft); }}>
        <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={placeholder} aria-label={placeholder} maxLength={140} />
        <button type="submit" aria-label={sendLabel}><SendHorizontal className="ico" /></button>
      </form>
    </>
  );
}

function CallScreen({ c, onEnd }: { c: Copy['sim']; onEnd: () => void }) {
  const [state, setState] = useState<'calling' | 'connected' | 'ended'>('calling');
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    const a = window.setTimeout(() => setState('connected'), 1800);
    return () => clearTimeout(a);
  }, []);
  useEffect(() => {
    if (state !== 'connected') return;
    const t = window.setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [state]);
  const hang = () => { setState('ended'); window.setTimeout(onEnd, 900); };
  const label = state === 'calling' ? c.calling : state === 'connected' ? `${c.connected} · ${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}` : c.ended;
  return (
    <div className="scr call">
      <p className="who">{c.bizName}</p>
      <p className="num">{c.callSub}</p>
      <p className="state" aria-live="polite">{label}</p>
      <div className={`wave${state === 'connected' ? '' : ' idle'}`} aria-hidden="true">
        {Array.from({ length: 14 }, (_, i) => <i key={i} />)}
      </div>
      <div className="call-pad" aria-hidden="true">
        <span><i><MicOff className="ico" /></i>{c.mute}</span>
        <span><i><Grid3x3 className="ico" /></i>{c.keypad}</span>
        <span><i><Volume2 className="ico" /></i>{c.speaker}</span>
      </div>
      <button type="button" className="hang" onClick={hang} aria-label={c.hangup} disabled={state === 'ended'}>
        <Phone className="ico" />
      </button>
      <p className="ex" style={{ color: '#B7BDCB' }}>{c.example}</p>
    </div>
  );
}

function Booking({ c }: { c: Copy['sim'] }) {
  const [svc, setSvc] = useState<number | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const slots = ['10:00', '11:30', '1:00', '2:30', '4:30', '6:00'];
  const taken = new Set(['11:30', '2:30']);
  if (done && svc !== null && slot) {
    return (
      <div className="confirm">
        <p className="mini-h">{c.bizName}</p>
        <span className="stamp green hit">{c.booked}</span>
        <div className="booked-rows">
          <div className="svc"><span>{c.services[svc][0]}</span><b className="num">{c.services[svc][1]}</b></div>
          <div className="svc"><span>{c.bookTime}</span><b className="num">{slot}</b></div>
          <div className="svc"><span>{c.bookWith}</span><b>Ramiro</b></div>
        </div>
        <p style={{ fontSize: '.86rem' }}>{c.bookedText()}</p>
        <button type="button" className="act" onClick={() => { setDone(false); setSvc(null); setSlot(null); }}><span>{c.bookAgain}</span></button>
      </div>
    );
  }
  return (
    <>
      <p className="mini-h">{c.bookHead}</p>
      <p className="flabel">{c.pickSvc}</p>
      <div className="svc-pick">
        {c.services.map(([n, p], i) => (
          <button key={n} type="button" aria-pressed={svc === i} onClick={() => setSvc(i)}><span>{n}</span><span>{p}</span></button>
        ))}
      </div>
      <p className="flabel">{c.pickTime}</p>
      <div className="slots">
        {slots.map((s) => (
          <button key={s} type="button" disabled={taken.has(s)} aria-pressed={slot === s} onClick={() => setSlot(s)}>{s}</button>
        ))}
      </div>
      <button type="button" className="ok-btn" disabled={svc === null || !slot} onClick={() => setDone(true)}>{c.bookBtn}</button>
    </>
  );
}

export function LiveSimulator({ t }: { t: Copy }) {
  const c = t.sim;
  const [channel, setChannel] = useState<Channel>('booking');
  const [view, setView] = useState<View>('home');
  const [tilt, setTilt] = useState({ x: 6, y: -14 });
  const stageRef = useRef<HTMLDivElement>(null);
  const reduced = useRef(false);

  useEffect(() => { reduced.current = matchMedia('(prefers-reduced-motion: reduce)').matches; }, []);
  useEffect(() => { setView('home'); }, [channel]);

  // The chassis turns toward the pointer: real 3D through CSS transforms, no WebGL needed here.
  const onMove = (e: React.PointerEvent) => {
    if (reduced.current || e.pointerType !== 'mouse') return;
    const b = stageRef.current!.getBoundingClientRect();
    const px = (e.clientX - b.left) / b.width - 0.5, py = (e.clientY - b.top) / b.height - 0.5;
    setTilt({ x: -py * 14, y: px * 22 });
  };
  const ChanIcon = CHANNEL_ICON[channel];
  const chanName = t.channels[channel][0];

  return (
    <div className="sim">
      <div>
        <span className="chan-label" id="chan-label">{t.chanLabel}</span>
        <div className="chan-stubs" role="group" aria-labelledby="chan-label">
          {(Object.keys(t.channels) as Channel[]).map((k) => {
            const Icon = CHANNEL_ICON[k];
            return (
              <button key={k} type="button" aria-pressed={channel === k} onClick={() => setChannel(k)}>
                <b><Icon className="ico" aria-hidden="true" />{t.channels[k][0]}</b>
                <em>{t.channels[k][1]}</em>
              </button>
            );
          })}
        </div>
        <ol className="try-list">
          {t.tryList.map((s, i) => <li key={i}><b>{i + 1}.</b><span>{s}</span></li>)}
        </ol>
      </div>

      <div className="sim-stage" ref={stageRef} onPointerMove={onMove} onPointerLeave={() => setTilt({ x: 6, y: -14 })}>
        <div className="sim-phone" style={{ transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}>
          <div className="body" aria-hidden="true" />
          <div className="edge" aria-hidden="true" />
          <div className="face">
            <div className="screen" role="region" aria-label={c.bizName}>
              <div className="status" aria-hidden="true"><span>9:41</span><span className="notch" /><span>5G</span></div>
              {view === 'call' ? (
                <CallScreen c={c} onEnd={() => setView('home')} />
              ) : (
                <div className={`scr${view === 'whatsapp' ? ' wa' : view === 'social' ? ' ig' : ''}`}>
                  {view !== 'home' && (
                    <button type="button" className="back" onClick={() => setView('home')}><ChevronLeft className="ico" aria-hidden="true" />{c.back}</button>
                  )}
                  {view === 'home' && (
                    <>
                      <div className="site-head">
                        <h4>{c.bizName}</h4>
                        <p>{c.bizLine}</p>
                        <span className="open"><i aria-hidden="true" />{c.open}</span>
                      </div>
                      <button type="button" className="act primary" onClick={() => setView('call')}>
                        <Phone className="ico" aria-hidden="true" /><span>{c.call}<small>{c.callSub}</small></span>
                      </button>
                      <button type="button" className="act ink" onClick={() => setView('sms')}>
                        <MessageSquareText className="ico" aria-hidden="true" /><span>{c.text}<small>{c.textSub}</small></span>
                      </button>
                      <button type="button" className="act" onClick={() => setView(channel)}>
                        <ChanIcon className="ico" aria-hidden="true" /><span>{chanName}<small>{t.channels[channel][1]}</small></span>
                      </button>
                      <div>
                        {c.services.map(([n, p]) => <div className="svc" key={n}><span>{n}</span><b className="num">{p}</b></div>)}
                      </div>
                      <p className="ex">{c.example}</p>
                    </>
                  )}
                  {view === 'sms' && <Chat variant="sms" head={c.smsHead} first={c.smsFirst} chips={c.smsChips} replies={c.smsReplies} fallback={c.smsDefault} placeholder={c.typeMsg} sendLabel={c.send} />}
                  {view === 'whatsapp' && <Chat variant="wa" head={c.waHead} first={c.waFirst} chips={c.waChips} replies={c.waReplies} fallback={c.smsDefault} placeholder={c.typeMsg} sendLabel={c.send} />}
                  {view === 'social' && <Chat variant="ig" head={c.socialHead} first={c.socialFirst} chips={c.socialChips} replies={c.socialReplies} fallback={c.smsDefault} placeholder={c.typeMsg} sendLabel={c.send} />}
                  {view === 'booking' && <Booking c={c} />}
                </div>
              )}
            </div>
            <div className="glare" aria-hidden="true" />
          </div>
        </div>
      </div>
      <div className="demo-links">
        <Link href="/demo/barberia" prefetch><span>{t.demoBarber[0]}<small>{t.demoBarber[1]}</small></span><ArrowRight className="ico" aria-hidden="true" /></Link>
        <Link href="/demo/taqueria" prefetch><span>{t.demoTaco[0]}<small>{t.demoTaco[1]}</small></span><ArrowRight className="ico" aria-hidden="true" /></Link>
      </div>
    </div>
  );
}
