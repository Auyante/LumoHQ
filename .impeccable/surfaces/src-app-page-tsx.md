---
version: 1
slug: "src-app-page-tsx"
primary_target: "src/app/page.tsx"
related_targets: []
---

# Surface: Lumo HQ landing (src/app/page.tsx)

Mode: Persuade. Audience: Latino business owners in Midland-Odessa on their phone (320-430px), arriving from a 1:1 message or a visit; secondary: English-speaking owners from search. Action: request the free diagnosis (POST /api/diagnosis, TCPA consent). Proof: none real; example businesses labeled as examples. Pinned by user: "El talonario de notas" direction (chosen on ~/lumo-hq-web, roll seed:d3178a396913b223); Carlos's v2 brief adds a 3D hero phone, a live phone simulator (call / SMS / third channel run inside the screen), links to /demo/barberia and /demo/taqueria, zero emojis, sticky bar only on "/". User decision: 3D only on hero phone and simulator; no glassmorphism, no card tilt.

## Direction contract

THESIS: The site is Lumo's order book. Every section is a numbered nota whose line items say exactly what the owner gets and what it costs; the diagnosis is a nota the owner fills in and sends. Refuses headline + device + row of feature cards, and refuses glass/tilt cards.

OWN-WORLD: Arena bond sheets on a grained Noche desk. Noche ink, carbon-blue handwriting (Caveat) only where a person writes, Ámbar folio numbers and rubber stamps, Brillo/yellow customer copy. Perforation rows, dashed tear lines, ruled rows, tabular amounts. Bricolage Grotesque 800 letterhead, Figtree text. States: stamped = done, carbon = your copy, red "falta" = missing.

STORY: Owner sees a nota made out to a business like theirs with items and prices, writes their business name, sees a real phone on the desk turning through what they get, compares their Google profile before/after, taps the live phone to try call/text/booking, reads the price list, follows the 5 days, sends the diagnosis nota.

FIRST VIEWPORT: Phone: the Arena nota (folio Nº 0001, ES/EN on letterhead) fills the width; headline "Que te encuentren. Que te llamen."; "Para:" live carbon input; line items with amounts; Ámbar perforated stub "Arranca aquí: tu diagnóstico gratis" at the sheet foot. Desktop: the same nota left, the WebGL phone standing on the desk right, following the pointer, drag to spin, screen showing the deliverables in turn.

FORM: Order book / carbon-copy talonario, user-pinned (position 4 of 7 on the original list). seed:d3178a396913b223
Signature interaction: the live simulator phone on the desk (CSS 3D chassis that follows pointer/tilt) where Llamar / Texto / third channel run their real flow on its screen.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
