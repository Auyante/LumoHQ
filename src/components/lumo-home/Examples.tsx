'use client';

/**
 * "Examples" section: real sites we built for fictional businesses, each one opening the
 * full demo (a self-contained HTML file in /public/ejemplos). Card shell drafted with
 * DeepSeek and reviewed here: the entrance animation lives on a wrapper so the hover lift
 * on the link never fights it.
 */
import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';

export type Example = {
  slug: string;
  name: string;
  trade: string;
  blurb: string;
  href: string;
  image: string;
  alt: string;
  tags: string[];
  accent: string;
};

type Props = { title: string; lede: string; demoNote: string; cta: string; items: Example[] };

const EASE = 'ease-[cubic-bezier(0.22,1,0.36,1)]';

export default function Examples({ title, lede, demoNote, cta, items }: Props) {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cards = gridRef.current?.querySelectorAll<HTMLElement>('[data-example-card]');
    if (!cards?.length) return;
    const reveal = (el: Element) => el.setAttribute('data-in', '');
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      cards.forEach(reveal);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { reveal(e.target); io.unobserve(e.target); } }),
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' },
    );
    cards.forEach((c) => io.observe(c));
    return () => io.disconnect();
  }, []);

  return (
    <section id="ejemplos" aria-labelledby="ejemplos-title" className="bg-white py-24 text-[#1B2130] md:py-32">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <h2 id="ejemplos-title" className="text-balance font-heading text-[clamp(2rem,5vw,3.4rem)] font-extrabold leading-[1.02] tracking-[-0.03em]">
          {title}
        </h2>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-[#5B6375]">{lede}</p>

        <div ref={gridRef} className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-2">
          {items.map((item, i) => (
            <div
              key={item.slug}
              data-example-card
              style={{ transitionDelay: `${i * 90}ms` }}
              className={`translate-y-6 opacity-0 transition duration-700 ${EASE} data-[in]:translate-y-0 data-[in]:opacity-100 motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:transition-none`}
            >
              <a
                href={item.href}
                target="_blank"
                rel="noopener"
                className={`group flex h-full flex-col overflow-hidden rounded-2xl border border-[#E6E8EE] bg-white shadow-[0_1px_2px_rgba(27,33,48,0.06)] transition duration-500 ${EASE} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F2A33A] motion-reduce:transition-none [@media(hover:hover)]:hover:-translate-y-1 [@media(hover:hover)]:hover:shadow-[0_18px_40px_-18px_rgba(27,33,48,0.35)]`}
              >
                {/* Browser window: chrome bar + screenshot of the demo's first screen. */}
                <div className="flex items-center gap-2 border-b border-[#E6E8EE] px-4 py-2.5" aria-hidden>
                  <span className="size-2.5 rounded-full bg-[#E6E8EE]" />
                  <span className="size-2.5 rounded-full bg-[#E6E8EE]" />
                  <span className="size-2.5 rounded-full bg-[#E6E8EE]" />
                  <span className="ml-2 flex-1 truncate rounded-full bg-[#F4F5F8] px-3 py-1 font-mono text-xs text-[#5B6375]">
                    /ejemplos/{item.slug}
                  </span>
                </div>
                <div className="relative aspect-[16/10] overflow-hidden bg-[#F4F5F8]">
                  <Image
                    src={item.image}
                    alt={item.alt}
                    fill
                    sizes="(min-width: 768px) 50vw, 100vw"
                    className={`object-cover object-top transition-transform duration-500 ${EASE} motion-reduce:transition-none [@media(hover:hover)]:group-hover:scale-[1.03]`}
                  />
                  <span className="absolute bottom-3 left-3 z-10 rounded-full bg-[#1B2130]/85 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white backdrop-blur">
                    {demoNote}
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-6">
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: item.accent }}>{item.trade}</p>
                  <h3 className="mt-2 font-heading text-2xl font-extrabold leading-tight">{item.name}</h3>
                  <p className="mt-3 leading-relaxed text-[#5B6375]">{item.blurb}</p>
                  <ul className="mt-5 flex flex-wrap gap-2">
                    {item.tags.map((tag) => (
                      <li key={tag} className="rounded-full border border-[#E6E8EE] px-3 py-1 text-xs font-medium">{tag}</li>
                    ))}
                  </ul>
                  <span className="mt-auto flex min-h-12 items-center justify-between pt-6 font-semibold">
                    {cta}
                    <ArrowUpRight className={`size-5 shrink-0 transition-transform duration-500 ${EASE} [@media(hover:hover)]:group-hover:-translate-y-0.5 [@media(hover:hover)]:group-hover:translate-x-0.5`} aria-hidden />
                  </span>
                </div>
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
