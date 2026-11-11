"use client";
/**
 * FAQ with accordion (21st.dev, prompt 25), rebuilt in the lab.
 *
 * LAB changes vs the original:
 * - Native exclusive accordion: <details name="…"> (one open at a time, no Radix, no JS state).
 *   Height animates with `interpolate-size: allow-keywords` + `::details-content` where supported,
 *   and opens instantly elsewhere. Find-in-page (Ctrl/Cmd+F) finds and opens closed answers.
 * - <h2> (the original used an <h1> for a section heading); heading level via prop.
 * - One stagger (title words → copy → items), not a doubly wrapped fade; reduced motion via MotionConfig.
 * - Optional FAQPage JSON-LD (rich results / local SEO) built from string answers, `<` escaped.
 * - `layout`: "center" (original) or "split" (sticky title left, questions right).
 * - Contact line via `contact` ({label, href}): mailto, tel, WhatsApp or a page.
 */
import * as React from "react";
import { motion, MotionConfig } from "motion/react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FAQItem {
  question: string;
  answer: React.ReactNode;
  /** Plain-text answer for JSON-LD when `answer` is not a string. */
  answerText?: string;
}

const CSS = `
.faq-acc{interpolate-size:allow-keywords}
.faq-acc details::details-content{block-size:0;overflow:hidden;transition:block-size .35s cubic-bezier(.22,1,.36,1),content-visibility .35s allow-discrete}
.faq-acc details[open]::details-content{block-size:auto}
.faq-acc summary{list-style:none}
.faq-acc summary::-webkit-details-marker{display:none}
@media (prefers-reduced-motion:reduce){.faq-acc details::details-content{transition:none}}
`;

export default function FAQAccordion({
  title = "Frequently asked questions",
  description = "We are here to help with any questions you may have. If you don't find what you need, contact us.",
  data,
  contact = { label: "support@example.com", href: "mailto:support@example.com" },
  defaultOpen,
  layout = "center",
  headingLevel = 2,
  jsonLd = true,
  className,
}: {
  title?: string;
  description?: React.ReactNode;
  data: FAQItem[];
  contact?: { label: string; href: string } | null;
  /** Index of the item open on load. */
  defaultOpen?: number;
  layout?: "center" | "split";
  headingLevel?: 2 | 3;
  /** Emit schema.org FAQPage JSON-LD. Use once per page. */
  jsonLd?: boolean;
  className?: string;
}) {
  const name = React.useId();
  const H = `h${headingLevel}` as "h2" | "h3";
  const words = title.split(" ");
  const split = layout === "split";
  const ease = [0.22, 1, 0.36, 1] as const;

  const ld = jsonLd
    ? JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: data
          .map((d) => ({ q: d.question, a: typeof d.answer === "string" ? d.answer : d.answerText }))
          .filter((d) => d.a)
          .map((d) => ({ "@type": "Question", name: d.q, acceptedAnswer: { "@type": "Answer", text: d.a } })),
      }).replace(/</g, "\\u003c")
    : null;

  return (
    <MotionConfig reducedMotion="user">
      <section className={cn("relative w-full py-24", className)}>
        <style>{CSS}</style>
        {ld ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ld }} /> : null}
        <div className={cn("mx-auto px-6", split ? "grid max-w-6xl gap-12 lg:grid-cols-[2fr_3fr] lg:gap-20" : "max-w-3xl")}>
          <div className={cn(split ? "lg:sticky lg:top-24 lg:self-start" : "text-center")}>
            <H className={cn("text-3xl font-bold tracking-tight text-balance text-foreground md:text-5xl", !split && "lg:text-6xl")}>
              {words.map((w, i) => (
                <motion.span
                  key={`${w}-${i}`}
                  initial={{ opacity: 0, filter: "blur(6px)", y: 12 }}
                  whileInView={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.06, ease }}
                  className="mr-[0.25em] inline-block"
                >
                  {w}
                </motion.span>
              ))}
            </H>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className={cn("mt-6 text-base text-pretty text-muted-foreground md:text-lg", !split && "mx-auto max-w-2xl")}
            >
              {description}
              {contact ? (
                <>
                  {" "}
                  <a href={contact.href} className="font-medium text-foreground underline underline-offset-4 transition-opacity hover:opacity-80">
                    {contact.label}
                  </a>
                </>
              ) : null}
            </motion.p>
          </div>

          <div className={cn("faq-acc", !split && "mt-14")}>
            {data.map((item, i) => (
              <motion.details
                key={item.question}
                name={name}
                open={defaultOpen === i || undefined}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: 0.35 + i * 0.05, ease }}
                className="group border-b border-border"
              >
                <summary className="flex min-h-[56px] cursor-pointer items-center justify-between gap-4 py-4 text-left text-base font-medium text-foreground transition-colors hover:text-foreground/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground">
                  {item.question}
                  <ChevronDown aria-hidden className="size-4 shrink-0 text-muted-foreground transition-transform duration-300 group-open:rotate-180" />
                </summary>
                <div className="pr-8 pb-5 text-sm leading-relaxed text-muted-foreground md:text-base">{item.answer}</div>
              </motion.details>
            ))}
          </div>
        </div>
      </section>
    </MotionConfig>
  );
}
