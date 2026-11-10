# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js 15 (App Router), React 19, Tailwind 3, lucide-react icons, Prisma. Repo by Carlos Gómez (github.com/Auyante/LumoHQ); this copy is a sandbox for the v2 redesign. 3D allowed via three / @react-three/fiber, only on the hero phone and the live phone simulator, with a static fallback.

## Users

- **Primary:** owners of Latino-run local businesses in Midland-Odessa, Texas (barber shops, salons, taquerías/restaurants, auto shops, cleaning/home services, contractors). They usually open the site on their phone, arriving from a one-to-one message by Bárbara (WhatsApp, Instagram, Facebook) or after an in-person visit by Luis. Busy, skeptical of being "sold", often burned by previous vendors.
- **Secondary:** owners who mostly speak English and reach Lumo by searching Google.
- The site supports a sales conversation: it must make the offer, price and process clear enough that the owner says "yes, send me the free review".

## Product Purpose

Lumo HQ makes local Latino businesses visible on Google and easy to contact: a complete Google Business Profile, a one-page bilingual (EN/ES) website, one-tap contact (call + text always, plus one extra channel: online booking, Instagram/Facebook auto-replies, or WhatsApp Business), and a review system (counter QR + message to ask real customers). Success for the site: owners request the free one-page diagnosis.

## Positioning

Bilingual by default, built for and sold by people from the same community, delivered in 5 business days, paid half up front and half on approval. Honest by rule: never promises rankings or a number of customers, never fakes reviews.

## Operating Context

- Sales funnel: list of 30 businesses per batch → first contact (message or visit) → free one-page diagnosis within 24 h → 15-minute meeting with demos → contract + 50% → follow-ups (max 3).
- Delivery: Day 0 sign + 50%; Day 1 data-collection call (photos, logo, hours, services, chosen channel); Day 2 domain, Google profile, bilingual page; Day 3 buttons + extra channel, short link and review QR; Day 4 quality check + before/after; Day 5 one round of edits, written approval, remaining 50%, monthly subscription starts.
- Team: Luis Barbera (owner, legal holder as "Lumo" DBA, in Midland, in-person visits, billing), Carlos Gómez (technical delivery, remote), Bárbara (remote sales and client relationship).

## Capabilities and Constraints

- **Base package:** $500 setup (2 × $250: at signing, at approval) + $100/month. For barber shops, salons, restaurants, auto shops.
- **Premium (from month 3):** $1,000–$1,500 setup + $150–$200/month. Multi-section site (services, gallery, form) + missed-call auto-text. For contractors (roofing, construction, landscaping, cleaning).
- **Founding clients:** first 2 businesses get Base for $250 setup in exchange for showing their before/after and a testimonial. Remove once both spots are taken.
- **Monthly fee covers:** domain and hosting, keeping everything running, up to 2 small changes per month, monthly report (how many people saw and contacted the business). Sales tax on hosting added to invoice. Cancel with 30 days' notice. Client's domain is registered in the client's name.
- The app has a backend (Next.js API routes): diagnosis form, checkout with Stripe, admin CRM, client portal.
- No emojis anywhere in UI copy; vector icons only (lucide-react, brand SVGs).
- **Undecided:** domain, phone/WhatsApp number, social handles, email.

## Brand Commitments

- Name: **Lumo HQ** ("lumo." in documents). Tagline: "Negocios locales, visibles" / "Local businesses, visible".
- Logo: "lum" in Noche + amber ring-with-dot "o" + "HQ" superscript. Source: `public/` brand SVGs.
- Palette: Noche #1B2130, Ámbar Lumo #F2A33A, Brillo #FFD27A, Arena #FFF7EC, Pizarra #5B6375, Niebla #E6E8EE.
- Type: Bricolage Grotesque (titles), Figtree (text).
- Fully bilingual EN/ES. Spanish voice uses "tú" on the site; warm, plain, no hype.
- User wants: a 3D phone in the hero and a live phone simulator where Call / Text / third channel buttons run their flow inside the phone screen; links to /demo/barberia and /demo/taqueria.

## Evidence on Hand

- Identity kit: `brand/` (logos, social templates, business card, palette).
- No real clients, testimonials, photos, demos, or metrics yet. Never fabricate them; example businesses must be labeled as examples.

## Product Principles

1. Show the owner their own situation (how they look on Google) before selling anything.
2. Honesty is the differentiator: no ranking promises, no fake reviews, no pressure.
3. Bilingual is the product, not a feature toggle.
4. Remove effort: "you send photos and hours, we do the rest".
5. Price and process stated plainly, up front.

## Accessibility & Inclusion

Mobile-first; many visitors read on phones in short moments. Plain language in both languages; avoid jargon (SEO, GBP). Respect reduced motion; 3D must never block reading.
