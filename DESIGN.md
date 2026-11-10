---
name: Lumo HQ
description: Negocios locales, visibles / Local businesses, visible. The landing as Lumo's carbon-copy order book.
colors:
  noche: "#1B2130"
  noche-deep: "#151A26"
  arena: "#FFF7EC"
  arena-reverse: "#FBEFD9"
  copy-yellow: "#FFE6A8"
  rule: "#E9DCC4"
  rule-strong: "#D9C8A9"
  pizarra: "#5B6375"
  ink-warm: "#69635A"
  carbon: "#3446A3"
  ambar: "#F2A33A"
  ambar-hover: "#F5B256"
  ambar-ink: "#8F520A"
  brillo: "#FFD27A"
  copy-ink: "#6B501B"
  sello-rojo: "#B8433A"
  sello-verde: "#22663F"
  desk-text-soft: "#B7BDCB"
typography:
  display:
    fontFamily: "Bricolage Grotesque, Avenir Next, Segoe UI, system-ui, sans-serif"
    fontSize: "clamp(2.5rem, 7.4vw, 4.6rem)"
    fontWeight: 800
    lineHeight: 0.93
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Bricolage Grotesque, Avenir Next, Segoe UI, system-ui, sans-serif"
    fontSize: "clamp(1.9rem, 5vw, 3.3rem)"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Bricolage Grotesque, Avenir Next, Segoe UI, system-ui, sans-serif"
    fontSize: "clamp(1.5rem, 3vw, 2rem)"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.02em"
  figure:
    fontFamily: "Bricolage Grotesque, Avenir Next, Segoe UI, system-ui, sans-serif"
    fontSize: "1.7rem"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.01em"
    fontFeature: "tnum"
  body:
    fontFamily: "Figtree, Helvetica Neue, Segoe UI, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Figtree, Helvetica Neue, Segoe UI, system-ui, sans-serif"
    fontSize: "0.78rem"
    fontWeight: 700
    letterSpacing: "0.12em"
  hand:
    fontFamily: "Caveat, Bradley Hand, Segoe Print, cursive"
    fontSize: "1.7rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0em"
rounded:
  sheet: "3px"
  control: "6px"
  stamp: "8px"
spacing:
  gutter: "16px"
  container: "1200px"
  sheet-pad-top: "44px"
  sheet-pad-x: "clamp(16px, 4vw, 48px)"
  band-y: "clamp(28px, 5vw, 64px)"
  row-y: "10px"
components:
  stub-primary:
    backgroundColor: "{colors.ambar}"
    textColor: "{colors.noche}"
    rounded: "0 0 3px 3px"
    padding: "18px clamp(16px, 4vw, 48px) 20px"
  stub-primary-hover:
    backgroundColor: "{colors.ambar-hover}"
  send-stub:
    backgroundColor: "{colors.ambar}"
    textColor: "{colors.noche}"
    rounded: "{rounded.sheet}"
    padding: "18px 20px"
  dock:
    backgroundColor: "{colors.ambar}"
    textColor: "{colors.noche}"
    rounded: "0"
    padding: "16px 16px"
    height: "56px"
  button-ink:
    backgroundColor: "{colors.noche}"
    textColor: "{colors.arena}"
    rounded: "{rounded.control}"
    padding: "13px 16px"
  button-ink-hover:
    backgroundColor: "{colors.pizarra}"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.noche}"
    rounded: "{rounded.control}"
    padding: "12px 14px"
  nav-cta:
    backgroundColor: "{colors.ambar}"
    textColor: "{colors.noche}"
    rounded: "{rounded.control}"
    padding: "9px 14px"
  lang-toggle-on:
    backgroundColor: "{colors.arena}"
    textColor: "{colors.noche}"
    rounded: "{rounded.control}"
    padding: "8px 12px"
  input-hand:
    backgroundColor: "transparent"
    textColor: "{colors.carbon}"
    typography: "{typography.hand}"
    rounded: "0"
    padding: "2px 0 4px"
  sheet:
    backgroundColor: "{colors.arena}"
    textColor: "{colors.noche}"
    rounded: "{rounded.sheet}"
    padding: "44px clamp(16px, 4vw, 48px) clamp(26px, 4vw, 44px)"
  stamp:
    backgroundColor: "transparent"
    textColor: "{colors.ambar-ink}"
    rounded: "{rounded.stamp}"
    padding: "7px 14px"
  tear-stub-selected:
    backgroundColor: "{colors.copy-yellow}"
    textColor: "{colors.noche}"
    rounded: "0"
    padding: "14px 14px 12px"
  carbon-copy:
    backgroundColor: "{colors.copy-yellow}"
    textColor: "{colors.copy-ink}"
    rounded: "{rounded.sheet}"
    padding: "22px"
---

# Design System: Lumo HQ

## Overview

**Creative North Star: "El talonario de notas"**

The landing is Lumo's order book: Arena bond sheets laid on a grained Noche desk, each one a numbered nota (Nº 0001 to Nº 0008, with a reverse side marked -R). Line items say what the owner gets and what it costs, the owner's own words appear as carbon-blue handwriting on ruled lines, and finished things carry a rubber stamp. The pale yellow customer copy sits under the original and, at the request sheet, receives every field the owner fills in, as if through carbon paper.

Density is that of a working form: ruled rows, tabular amounts, short printed captions, generous sheet padding. Hierarchy comes from heavy letterhead type (Bricolage Grotesque 800), not from colour fields or cards. States are strict: stamped means done, carbon means "your copy / your words", an empty dashed line or a red "falta" note means something is absent. Everything on paper moves like paper: sheets slide up off the pad, stamps thump down, checkmarks ink in, a selected stub lifts off its strip.

Two objects are allowed real depth, and only these two: the WebGL phone standing on the desk beside nota 0001, and the CSS-3D simulator phone inside nota 0002. Everything else is flat paper with a soft drop shadow. The agency default of headline plus device plus a row of feature cards is rejected, and so are glass panels and tilting cards: a section is a sheet, never a card grid.

**Key Characteristics:**
- Arena paper sheets with fine grain noise, 3px corners, a soft three-layer drop shadow, on a Noche desk with its own faint grain.
- A perforation hole row at the top of every sheet; dashed tear lines between stubs, between days, and above every Ámbar tear-off action.
- Folio numbers in Ámbar Ink, tabular, as the only section numbering.
- Caveat handwriting in carbon blue only where a person would write: inputs, filled values, the carbon copy, results.
- Rubber stamps (bordered, rotated -9deg, grain-masked, multiply) for completed or committed states.
- Exactly two 3D phones; one easing curve for all motion; reduced motion removes all of it.

## Colors

A warm-paper and dark-desk palette from the Lumo brand kit, with one invented working colour: carbon-copy blue.

### Primary
- **Ámbar Lumo** (ambar): the tear-off stub, the send stub, the mobile dock, the header CTA, focus rings, text selection, scrollbar thumb, the call waveform. It is the colour of "the thing you pull off and take".
- **Ámbar Ink** (ambar-ink): Ámbar darkened to read on paper. Folio numbers, the second headline line, default stamp ink, clause, FAQ, and try-list numerals, star ratings.

### Secondary
- **Carbon Blue** (carbon): carbon-copy ink. All handwriting, input text and caret, focus underline on fields, range track fill and thumb ring, tally marks, the checkbox tick, the outgoing chat bubble in the simulator, the "sent" stamp. Placeholders use it at 50% alpha; hover washes at 8%.

### Tertiary
- **Brillo** (brillo): handwriting and highlights that sit on the desk or on a dark screen rather than on paper (the desk note, the WebGL fallback, the phone site header's small caption, call state).
- **Sello Verde** (sello-verde): included checkmarks and the done / booked stamp variant.
- **Sello Rojo** (sello-rojo): missing values, error underlines, the dashed pause notice, hang-up, the strike-through on refused promises.

### Neutral
- **Noche** (noche): the desk; also printed ink on paper (body text, 1.5-2.5px rules, letterhead underline) and the ink fill of selected controls.
- **Noche Deep** (noche-deep): scrollbar track, the deeper desk tone.
- **Arena** (arena): the original sheet and the simulator screen.
- **Arena Reverse** (arena-reverse): the back of a sheet (conditions), day sheets, and the channel stub strip at rest.
- **Copy Yellow** (copy-yellow): the customer copy: the under-sheet, the selected tear stub, the founder strip, the carbon copy beside the request form. The copy paper is this pale yellow, not Brillo.
- **Copy Ink** (copy-ink): printed text on the yellow copy.
- **Rule** (rule) / **Rule Strong** (rule-strong): 1px ruled lines between rows / 2px dashed tear lines and the borders of in-screen controls.
- **Pizarra** (pizarra): secondary printed text, labels, ledes; also the hover fill of the ink button.
- **Ink Warm** (ink-warm): fine print, example notes, unavailable price items.
- **Desk Text Soft** (desk-text-soft): secondary text on the desk (nav links, footer, unpressed toggles).

### Named Rules
**The Carbon Means Yours Rule.** Carbon blue is reserved for words written by or for the owner (inputs, filled values, the carbon copy, their side of a conversation). Printed copy is never carbon blue.

**The Stub Is Ámbar Rule.** The primary action is the only large Ámbar surface in view, and it always sits behind a dashed tear line (2px, Noche 7px on / 6px off at 55%).

## Typography

**Display Font:** Bricolage Grotesque 700/800 (with Avenir Next, Segoe UI, system-ui)
**Body Font:** Figtree 400/600/700 (with Helvetica Neue, Segoe UI, system-ui)
**Hand Font:** Caveat 700 (with Bradley Hand, Segoe Print, cursive)

All three are self-hosted woff2 with `font-display: swap`.

**Character:** A printed letterhead (tight, heavy grotesque) over plain form text, with a handwriting layer that only ever appears where a pen would.

### Hierarchy
- **Display** (800, clamp(2.5rem, 7.4vw, 4.6rem), 0.93): the hero headline printed on nota 0001, max 12ch, two lines with the second in Ámbar Ink.
- **Headline** (800, clamp(1.9rem, 5vw, 3.3rem), 1): each sheet's title, max 17ch, balanced.
- **Title** (800, clamp(1.5rem, 3vw, 2rem)): price nota tier names; smaller subtitles (day headings, the copy title, in-screen headers) run 1.05-1.45rem in the same face.
- **Figure** (800, tabular): folio numbers (1.7rem in the letterhead, 1.05rem in a folio row), day numbers (1.9rem), totals and prices (1.3-1.6rem).
- **Body** (400, 17px, 1.6): running text; ledes 1.04-1.06rem in Pizarra, max 46-58ch; fine print 0.84rem in Ink Warm, max 62ch.
- **Label** (700, 0.78rem, 0.12em, uppercase): field names, table column heads, folio captions, the day word, the channel strip caption. These are the printed captions of a form, attached to the field or table they name.
- **Hand** (700, 1.15-2.5rem): form fields (1.7rem), the hero "Para:" line (clamp(1.7rem, 4.6vw, 2.2rem)), the calculator value (2.5rem) and result (1.85rem), filled ledger and copy values (1.4rem).

### Named Rules
**The Pen Only Writes Rule.** Caveat appears only as written content (inputs, filled values, a note scrawled on the desk), never as a headline, label, or button.

**The Tabular Money Rule.** Every amount, folio, time slot, and day number uses tabular numerals.

## Layout

A single column of sheets on the desk, max 1200px wide with 16px (or safe-area) gutters. Each section is one band (vertical padding clamp(28px, 5vw, 64px)) holding one sheet; sheet padding is 44px top (clearing the perforation row), clamp(16px, 4vw, 48px) sides. Inside a sheet, rhythm is ruled rows: 10-12px vertical padding per row, 14-28px between blocks.

The hero is a two-column grid (nota up to 640px, desk side 1fr) that collapses below 980px; the WebGL phone then drops under the nota at 400px tall and the desk note hides. Two-column interiors (simulator, before/after, math, request) collapse at 860px; the price notas at 720px. Strips of equal cells re-draw their dashed tear lines on each wrap: the 3 channel stubs go to 1 column below 560px; the 6 day sheets go to 3 below 1060px and 1 below 620px.

The desk header is sticky at 60px. Its logo and ES/EN switch are hidden while nota 0001's letterhead (which carries its own logo and switch) is in view, so only one of each is ever visible; at 520px and below the whole header slides up out of the way in that state. Below 760px a fixed Ámbar dock appears whenever the hero stub is off screen and hides as the request sheet arrives; it exists only on the landing.

## Elevation & Depth

Depth is physical paper on a desk: one soft, layered drop shadow for sheets, small rotations, and stacking (copy under original). The two phones are the only true 3D: a three.js phone on the desk (lazy-loaded, transparent canvas, canvas-texture screen, pixel ratio capped at 2, paused off screen, one still frame under reduced motion) and a CSS-3D simulator chassis (body, edge, and face layers at translateZ -14px / -7px / 0 under 1100px perspective, turning toward a mouse pointer by up to 7deg on X and 11deg on Y).

### Shadow Vocabulary
- **Sheet** (`box-shadow: 0 1px 1px rgba(0,0,0,.18), 0 12px 24px -8px rgba(0,0,0,.45), 0 40px 70px -30px rgba(0,0,0,.55)`): every sheet and the under-copy.
- **Lifted stub** (`box-shadow: 0 1px 1px rgba(0,0,0,.2), 0 14px 24px -12px rgba(0,0,0,.5)`): a selected channel stub pulled up off its strip.
- **Loose copy** (`box-shadow: 0 1px 1px rgba(0,0,0,.15), 0 10px 20px -12px rgba(0,0,0,.4)`): the carbon copy beside the request form.
- **Dock** (`box-shadow: 0 -10px 24px -10px rgba(0,0,0,.5)`): the fixed mobile dock.
- **CTA glow** (`box-shadow: 0 6px 16px -6px rgba(242,163,58,.8)`): header CTA hover only.

### Named Rules
**The Paper Tilt Rule.** Paper rotates by small fixed angles: -0.8deg the hero nota (-0.45deg at 520px and below), 2.2deg the under-copy, 1deg the carbon copy, -1.2deg a selected stub, -3deg the desk note, -9deg stamps. Strips, tables, and controls inside a sheet sit square.

**The Two Phones Rule.** Only the hero desk phone and the simulator phone have real 3D or pointer tilt. Sheets, stubs, and price notas never tilt toward the pointer, and nothing is glass.

## Shapes

Paper corners are nearly sharp (3px); controls on paper and desk are 6px; stamps 8px with a 2-3px border. Edges are drawn, not filled: perforation is a row of 3px Noche holes every 16px, 12px below the sheet top; tear lines are 2px dashes (7px on, 6px off at 55% Noche) above every tear-off action, or 2px dashed Rule Strong between stubs and days; ruled lines are 1px Rule between rows and 1.5-2.5px Noche under headers and totals. The simulator screen (35px inside a 44px chassis, 10-16px controls, pill chips) and the Google profile mock in nota 0003 (14px card, pill search) depict third-party device UI; that geometry belongs to the depicted screen and is not part of this system.

## Components

### Buttons
- **Tear-off stub (primary):** full-width Ámbar strip at the foot of a sheet, Bricolage 800 clamp(1.15rem, 2.6vw, 1.45rem), Figtree subline, 30px arrow right, dashed tear line on top. Hover lightens to Ámbar Hover and nudges the arrow 4px. The send stub (3px corners, pen icon) and the mobile dock use the same anatomy.
- **Mobile dock:** fixed bottom strip, 56px tall, safe-area padded, slides up 0.45s. When a phone number is configured it splits into a Noche "call" cell and the Ámbar stub; otherwise the stub alone.
- **Ink button:** Noche fill, Arena text, 6px; hover to Pizarra. The highlighted price nota's action.
- **Outline button:** 1.5px Noche border, transparent, 6px, hover wash `rgba(27,33,48,.08)`. Price actions, demo links, channel choices (pressed: Noche fill).
- **Header CTA:** small Ámbar button, lifts 1px with the CTA glow on hover.
- **Focus:** 3px Ámbar outline, 3px offset, everywhere.

### Inputs / Fields
- **Style:** no box. A label in Label style, then a bare line with a 1.5px Noche underline; text written in Caveat carbon blue. Selects keep the underline but set the chosen value in Figtree 600 with a drawn chevron.
- **Focus:** underline turns carbon and doubles (`box-shadow: 0 2px 0` carbon).
- **Error:** underline turns Sello Rojo; message below in red Figtree 600.
- **Checkbox toggle:** 24px Noche-bordered square on paper; the tick inks in carbon (scale and rotate in, 0.35s).
- **Range:** 6px track filled carbon to the value, thumb an Arena disc with a 4px carbon ring.

### Navigation
Sticky desk header, 60px, Noche at 94%, 1px desk-line border. Links in Desk Text Soft, Figtree 600, 6px hover wash; links hide below 980px, CTA and login below 520px. ES/EN is a two-segment bordered toggle; the pressed side fills Arena on the desk or Noche on paper. Footer on the desk: logo, links, FTC disclosure above a desk-line rule.

### Stamp (signature)
Bricolage 800 uppercase, 0.08em tracking, 3px border in currentColor, 8px corners, rotated -9deg, multiply blend, masked with turbulence noise for uneven ink. Ink is Ámbar Ink by default, Sello Verde for done or booked, Carbon for sent. Applied with the thump keyframe (from 1.9x scale, -16deg, blurred, to rest in 0.55s), triggered by an owner action: typing a business name, switching to "after", booking a slot, sending the form.

### Folio
A right-aligned row ruled underneath, carrying only "Nº" and a four-digit tabular number in Ámbar Ink (reverse sides get "-R"). The hero letterhead carries the logo, the tagline, the folio with date, and the paper ES/EN switch. The folio is a number, never a topic label.

### Tear stubs and day sheets
Equal-width cells in one Arena Reverse strip between 2px Noche rules, separated by dashed tear lines. A selected channel stub turns Copy Yellow and lifts 6px off the strip at -1.2deg. Day sheets carry a big tabular day number and a stamp at the foot.

### Price notas
The price list is two per-tier sheets side by side, not a comparison table: a 2.5px Noche top rule, the tier name in Title, included items with green checks and excluded items in Ink Warm with Rule Strong marks, then setup and monthly amounts as ruled dt/dd rows closed by a 2.5px rule, then the action. The recommended tier gets a 10% Ámbar wash with a 1px 25% Ámbar keyline and the ink button.

### Carbon copy
The Copy Yellow slip beside the request form, tilted 1deg with the loose-copy shadow. Every form field has a row here: a printed uppercase caption in Copy Ink and the owner's value in Caveat carbon, or a dashed carbon blank while empty. On send it receives the carbon stamp.

### Simulator phone
A CSS-3D chassis (graphite body gradient, edge, face, screen glare) on the desk side of nota 0002. Its Arena screen runs the real flows: the business site home, a call with a live waveform and red hang-up, SMS, booking (service pick, tabular time slots with struck-through taken times, a confirm that stamps green), and WhatsApp or Instagram chats. Carbon is the owner's own bubble; in-screen colours for WhatsApp and Instagram depict those apps.

### Desk phone (WebGL)
A three.js phone on the desk beside nota 0001, lit warm, materials in brand colours, whose canvas-texture screen (icons drawn from lucide paths) turns through the deliverables; caption toggles below select a screen, and it can be dragged horizontally. A Caveat Brillo note on the desk invites the drag. Lazy-loaded, with a Caveat fallback line when WebGL is unavailable.

## Do's and Don'ts

### Do:
- **Do** put every section on its own Arena sheet with a perforation row and a folio number, and keep numbering sequential.
- **Do** use the single easing curve (`cubic-bezier(.16,1,.3,1)`) for all motion: slide up off the pad (0.9s, 34px and 0.8deg), thump (0.55s), stub lift (0.45s), ink-in (0.35s).
- **Do** write user-entered or user-specific content in Caveat carbon blue on a ruled line.
- **Do** mark completion with a stamp and absence with an empty dashed line or a red "falta" note.
- **Do** place the primary action as an Ámbar tear-off stub behind a dashed tear line.
- **Do** show one logo and one language switch at a time; the header's copies wait while the letterhead is in view.
- **Do** drop all animation and transitions under `prefers-reduced-motion`, show stamps in their final state, and render the WebGL phone as one still frame.

### Don't:
- **Don't** build card grids or rounded feature tiles; equal items are tear stubs in one strip, and tiers are price notas.
- **Don't** use carbon blue for printed copy or Caveat for headings, labels, or buttons.
- **Don't** set amounts, folios, or time slots in proportional figures.
- **Don't** put a topic label above a sheet title; the folio row carries only the number.
- **Don't** add 3D, pointer tilt, or glass to anything but the two phones.
- **Don't** use hard offset shadows or radii above 8px on the world's own surfaces; larger radii exist only inside depicted device screens.
