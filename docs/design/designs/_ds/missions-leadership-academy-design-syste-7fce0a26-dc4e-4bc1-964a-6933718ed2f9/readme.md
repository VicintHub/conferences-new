# Missions & Leadership Academy — Design System

The brand system for the **Missions & Leadership Academy**, the training arm of **The Men of Issachar Vision Inc.** — a faith-based missions and ministry training organisation based at the Leadership & Mission Center, Olororo, Ojo, Ibadan, Nigeria.

The Academy offers Global Missions & Ministry Training (2026/2027 session) across four programmes — the *Guerrilla Diploma*, *Guerrilla Certificate*, *Mobile Special Courses*, and *En Route Volunteer Courses* — plus specialised mission consultation. Its brand voice is **military-spiritual**: a "boot camp for missionaries," disciplined, urgent, faith-driven. The rallying line is *"No army parades an untrained soldier."*

---

## Sources provided

This system was built from two supplied materials — **no production codebase or Figma was provided**:

1. **`uploads/IMG_0156.PNG`** — the official organisation logo: a circular embroidered patch badge. Cream ring with black arched text "THE MEN OF ISSACHAR VISION INC.", cobalt-blue inner field with a faint globe texture, and a brick-red mounted horseman with a raised lance. The brand palette is sampled directly from this file. Cleaned/cropped copies live in `assets/logo/`.
2. **`uploads/Missions-Academy-Promo-Video-Script-and-Prompt.md`** — a promo-video voice-over script + motion-design brief. This is the source of truth for **tone, copy, programme content, contact details, and the stated visual direction** (cobalt / maroon / cream / black; condensed stencil headlines; clean body sans; stamp/impact motion).

> Because no app or website code exists, the UI kit and slides are **original recreations** that realise the brief — not reconstructions of an existing product. Content (programmes, copy, contact info) is canonical; layouts are faithful interpretations.

### ⚠️ Font substitution — needs your input
The brief specifies *type by description only* ("strong condensed sans-serif, military stencil feel" + "clean sans-serif"), not named font files. These Google Fonts were chosen to match and are **substitutions**:
- **Oswald** — condensed military display (headlines, stamps)
- **Barlow** — clean utilitarian body
- **Saira Stencil One** — stencil stamp accent
- **JetBrains Mono** — tactical labels / contact / eyebrows

If the organisation has official brand fonts, send them and we'll self-host and swap. See `tokens/fonts.css`.

---

## CONTENT FUNDAMENTALS

**Voice.** Bold, commanding, "call to arms" — a military trailer crossed with a revival altar call. Deliberate, weighty, declarative. Never soft, corporate, or chatty.

**Person & address.** Speaks to the reader as a recruit/soldier in the second person and the imperative: *"Choose your path of training." "Get Trained. Get Sent." "Say yes."* The organisation refers to itself in the third person ("the Academy", "the training arm of…").

**Casing.** Headlines and labels are **UPPERCASE** (display + eyebrows). Body is sentence case. Stamps are uppercase stencil.

**Sentence rhythm.** Short, punchy, fragment-friendly. Rhetorical repetition and triads: *"Not on the mission field. Not in the battle for souls."* Em-dashes and hard stops for cadence. A signature refrain recurs: **"No army parades an untrained soldier."**

**Lexicon.** Military-spiritual blend — *soldier, army, enlist, guerrilla, field, deploy, mission, crusade, soul-winning, discipleship, commissioned, get sent*. Programme names lean tactical ("Guerrilla Diploma").

**Numbers & specifics.** Concrete and confident: *"One full year." "Six weeks." "2026/2027 Academic Session."* Contact details are always exact (address + both phone numbers).

**Emoji.** None. Ever. The tone is too grave for emoji. Iconography carries any pictorial weight (line icons).

**Example copy.**
> *Eyebrow:* `THE CHALLENGE`
> *Headline:* `NO ARMY PARADES AN UNTRAINED SOLDIER`
> *Body:* "But no army parades an untrained soldier. Not on the mission field. Not in the battle for souls."
> *CTA:* `ENLIST NOW` · `GET TRAINED. GET SENT.`

---

## VISUAL FOUNDATIONS

**Palette (sampled from the patch).** Cobalt blue `#1460a1` is the primary — authority, the institution, the badge field. Brick/maroon red `#a82e26`/`#6f0000` is the accent — urgency, the horseman, every divider and underline. Cream/parchment `#faf6ec` is the light surface. Cool near-black ink `#0c0d10` is text. Two grounds dominate: **deep cobalt `#00203f`** (heroes, cinematics, CTAs) and **cream** (content). Use red sparingly and decisively — it is a signal, not a fill.

**Type.** Condensed uppercase Oswald for everything loud; Barlow for everything read; JetBrains Mono for tactical labels, eyebrows, coordinates and contact lines; Saira Stencil One only for stamps. Display tracking is tight (−0.01em), line-height near 1. Mono labels track wide (0.08–0.14em).

**Backgrounds.** No photographic imagery is supplied, so grounds are **solid cobalt or cream** dressed with a faint **tactical grid** (40–56px lines at ~5% opacity, radially masked) and an oversized **seal watermark** (~9% opacity). No gradients-as-decoration; if a glow is used it is a single subtle radial mask. A grain/dust overlay is appropriate for cinematic frames per the brief.

**The signature motif** is the **red rule**: a 2–3px brick-red line — as an eyebrow prefix, a divider between sections, a top-edge on cards, an underline beneath impact words. Pair it occasionally with a small rotated 45° red diamond.

**Borders & corners.** Restrained, stamped — not pill-soft. Cards `10px`, controls/inputs `4px`, chips `4px`, true pills (`999px`) only for status capsules; `50%` only for the seal. Borders are firm (1–1.5px hairlines on light; `rgba(255,255,255,0.16)` on dark); a `3px` stamped frame for stencil stamps.

**Shadows.** Cool, cobalt-tinted, decisive (`rgba(0,32,63,…)`) — never coloured glows or fuzzy pillows. The seal gets a deeper lift (`--shadow-seal`). A signature option is the **hard red under-edge** (`--shadow-stamp-accent`, a solid 3px brick line beneath an element).

**Cards.** White (or cobalt, on dark) surface, `10px` radius, hairline border, soft cool shadow, frequently a `3px` red top accent. They lift `-3px` with a stronger shadow on hover — firm and quick, no float.

**Motion.** Sharp and confident — stamp/impact with slight overshoot (`--ease-stamp`), hard cuts over soft fades, short durations (120–360ms). Press state shrinks slightly (`translateY(1px) scale(0.99)`). Hover brightens fills ~8% or fills ghosts with `--cobalt-50`; outlines shift border to cobalt. Avoid infinite decorative loops. Respect `prefers-reduced-motion`.

**Transparency & blur.** Sparingly — faint white overlays on dark grounds for the grid/watermark; no heavy glass/backdrop-blur. The brand reads as printed fabric and stamped ink, not frosted glass.

**Layout.** Max content width `1200px`; generous section rhythm (`~88px` vertical). A persistent `4–8px` red bar often runs down the left edge of hero sections. The seal sits top-left as a constant official mark; it appears larger and centred on closing frames.

**Imagery vibe (when added).** Cool dawn blues and charcoals for cinematic scenes, warming to sunrise tones at calls-to-action; embroidered/patch and film-grain textures; documentary-military gravity. Keep it warm-faith, never clinical.

---

## ICONOGRAPHY

- **System:** line icons from **[Lucide](https://lucide.dev) (MIT)** — 24×24, **2px stroke, round caps, stroke-only (never filled)**. This matches the brief's "line-art, cream stroke with red highlight" direction. Implemented as the `Icon` component (`components/core/Icon.jsx`) with paths copied inline (no runtime CDN dependency); the slide HTML inlines the same SVG paths directly.
  > **Substitution flag:** no brand-specific icon set was provided, so Lucide is the closest-matching stand-in. Swap if an official set exists.
- **Colour:** icons inherit `currentColor`. Cobalt (`--cobalt-700`) on light grounds, cream on dark, brick-red for emphasis/checks.
- **Programme icons:** compass (Diploma), clock (Certificate), users (Mobile), route (En Route). Service icons: target, flag, users, shield.
- **Emoji:** never used. **Unicode glyphs** are used only as tiny functional marks (e.g. the select chevron `▾`).
- **The seal** (`assets/logo/issachar-patch.png`) is the one piece of bespoke brand art — treat it as an official seal: full opacity, drop shadow, never recoloured or stretched, min 64px.

---

## INDEX — what's in this system

**Root**
- `styles.css` — the single entry point consumers link (`@import`s every token + font file).
- `readme.md` — this guide.
- `SKILL.md` — Agent-Skill manifest for use in Claude Code.

**`tokens/`** — `fonts.css`, `colors.css`, `typography.css`, `spacing.css`, `elevation.css` (radii, borders, shadows, motion, z).

**`assets/logo/`** — `issachar-patch.png` (900px, cleaned), `issachar-patch-256.png` (256px).

**`components/core/`** — `Button`, `Badge`, `Eyebrow`, `Stamp`, `Seal`, `Card`, `Icon`.
**`components/forms/`** — `Input`, `Select`, `Checkbox`.
Each ships `.jsx` + `.d.ts` + a `.prompt.md`; each directory has a preview `*.card.html`.

**`guidelines/cards/`** — foundation specimen cards (Colors, Type, Spacing, Brand) shown in the Design System tab.

**`ui_kits/academy-site/`** — interactive marketing + admissions site recreation (`index.html` + `App.jsx` + `Home/Programmes/Apply` screens + shared `Parts.jsx` / `academy-data.js`). See its `README.md`.

**`slides/`** — four branded 16:9 sample cards: title, statement, programmes, closing/CTA.

> Component namespace for card/kit HTML: run `check_design_system` to confirm (currently `window.DesignSystem_7fce0a`). The runtime bundle `_ds_bundle.js` is generated automatically — do not edit it.
