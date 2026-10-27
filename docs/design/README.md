# Handoff: Jan. Conf 2027 Portal (37th IMLC & IYLC)

## Overview
A conference portal for **The Men of Issachar Vision Inc. (MIV)** — the 37th International Ministers & Leadership Conference (IMLC) and International Young Leaders Conference (IYLC), **19–24 January 2027**, Leadership & Missions Conference Centre, Olororo, Ojoo, Ibadan, Nigeria.

It has three surfaces:
1. **Public website** (desktop + mobile web): landing, speakers, testimonies, publicity kit, shop.
2. **Participant app** (installable PWA, mobile-first; same app on desktop with a sidebar): registration, home/dashboard, programme, pass/badge, live & radio, teams, hotels, store, testimonies, publicity kit.
3. **Staff tools**: admin console, print desk (tablet/laptop), scanner PWA (staff phones).

Target stack: **Laravel 11 API (backend) + Next.js 15 App Router (frontend)**. See `ARCHITECTURE.md`. Instructions for Claude Code (including creating the GitHub repo) are in `CLAUDE.md`.

## About the design files
Files in `designs/` are **design references built in HTML** — prototypes showing intended look, content and behaviour. They are **not production code**. Recreate them in Next.js (React + TypeScript + Tailwind) using the tokens below. Open any `designs/*.dc.html` in a browser (serve the folder over HTTP, e.g. `npx serve designs`) to view. `designs/Portal Index.dc.html` links every file.

Each file is a canvas of **options with IDs** (e.g. `5a`, `9c`). Where several options exist for one screen, the **chosen** one is noted in the Screen list below.

## Fidelity
**High-fidelity.** Final colours, type, spacing, copy and states. Recreate pixel-accurately. Sample data (names, prices, counts, hotels, shuttle times, testimonies) is placeholder and must come from the API.

## Design tokens
Source: `designs/_ds/.../tokens/*.css`. Port these into `tailwind.config.ts` / CSS variables.

**Colours**
- Cobalt: 950 `#001428` · 900 `#00203f` · 800 `#003070` · 700 `#0c4c8a` · **600 `#1460a1` (primary)** · 500 `#1d72ba` · 400 `#4f93cf` · 300 `#8db9dd` · 200 `#bcd6ec` · 100 `#dceaf5` · 50 `#eef5fb`
- Brick: 900 `#4a0000` · 800 `#6f0000` · 700 `#8c1f1c` · **600 `#a82e26` (accent)** · 500 `#c0392f` · 400 `#d4574b` · 300 `#e3897f` · 200 `#f0bdb6` · 100 `#f8e0dc`
- Cream: 50 `#faf6ec` · 100 `#f4eddc` · 200 `#e9ddc4` · 300 `#dccfae`
- Ink: 950 `#07080a` · 900 `#0c0d10` · 800 `#16181d` · 700 `#22262e` · 600 `#353b45` · 500 `#4d5460` · 400 `#6b7280` · 300 `#9aa1ad` · 200 `#c9ced6` · 100 `#e4e7ec` · 50 `#f4f5f7` · white `#ffffff`
- Status: success 600 `#2f7d4f` / 100 `#dcefe2` · warning 600 `#b8791b` / 100 `#faeccf` · danger = brick 600 / 100
- Only cobalt + brick as accents (no gold).

**Typography**
- Display: **Oswald** 700, uppercase, tracking −0.01 to −0.02em, line-height 0.9–1.0. Used for desktop headlines (H1 56–128px, H2 52–72px) and badge/card artwork.
- Body & UI: **Barlow** 400/500/600/700. All mobile app headings use Barlow 700 sentence case (20–26px).
- **Do not use JetBrains Mono anywhere** (client request). Eyebrows: Barlow 600 14px, tracking 0.16em, uppercase, brick-600.
- Load from Google Fonts via `next/font/google` (Oswald, Barlow).

**Radii** — mobile/app: cards 18–24px, sheets 28px top corners, inputs 4px (DS Input), chips & buttons **999px (pill)**. Desktop marketing cards 16–20px.
**Shadows** — xs `0 1px 2px rgba(0,32,63,.10)` · sm `0 2px 5px rgba(0,32,63,.12)` · md `0 6px 16px rgba(0,32,63,.14)` · lg `0 14px 34px rgba(0,32,63,.18)` · xl `0 26px 60px rgba(0,20,40,.30)`
**Spacing** — 4px base. Desktop page gutters 56px, section rhythm 96–104px. Mobile gutters 20px, gaps 10–18px.
**Motifs** — 6px brick-red bar on the left edge of hero sections; faint 48px grid (5% white) radially masked on cobalt grounds; MIV seal top-left.
**Motion** — 120/200/360ms, `cubic-bezier(.2,.7,.2,1)`; press: `translateY(1px) scale(.99)`. Respect `prefers-reduced-motion`.

**Shared components to build** (see `designs/_ds` for originals): Button (primary, accent, outline, ghost, onDark; sizes sm/md/lg; app uses pill), Badge, Input, Select, Checkbox, Chip (pill toggle), Segmented control (pill track), BottomSheet, SuccessCard, TabBar, Countdown, QR (real QR via `qrcode` lib), ImageCard with overlay label, Stepper progress bar.

## Screens
Paths in brackets are the suggested Next.js routes.

### 01 Public landing — `Portal 01 Landing v2.dc.html` (chosen: **5a desktop**, **5d** mobile app home, **5b/5c** mobile web)
Sections, top to bottom (desktop 1280 canvas, max content 1200):
1. **Nav** on transparent over hero: seal + "JAN. CONF 2027", links About · Speakers · Schedule · Accommodation · Shop, accent button.
2. **Hero** 760px tall, cobalt-950 with photo at 45% opacity + vertical gradient; centred "SEE YOU ON" (14px, tracking .3em), H1 "19th – 24th / Jan, 2027" Oswald 128px; venue line; **live countdown** (Days/Hours/Minutes/Seconds) in 120px boxes, 1px white/20% border, radius 10. Target: `2027-01-19T17:00:00+01:00`.
3. **About** two columns: H2 "The biggest conference of the year" (last line brick), MIV paragraph, avatar stack + "A conference trusted by 2,000+ attendees yearly…". Right: two staggered photos 460px tall.
4. **Meet the hosts**: 2 columns (5fr/6fr). Left one combined photo 4:5 radius 24. Right: H2 "Meet the hosts", eyebrow "The President & vice-President", H3 "Rev. Samson & Stella Ajetomobi", red rule, two verbatim paragraphs, button.
5. **Why join** (cobalt-900): three numbered cards (01–03) with giant ghost numerals.
6. **Ministering** speakers: 4-col cards (3:4 photo), "Coming soon" dashed cards.
7. **Session breakdown**: day pill tabs (Tue 19 – Sun 24), table rows (time in brick Oswald, title Oswald uppercase, location).
8. **Registration is free**: split card, image left, checklist (Physical Attendance; Live Streaming on Facebook; Live Streaming on Radio; Audio Recording of All Conference Sessions; Remote Break Out Sessions Via Zoom).
9. **Accommodation** CTA "We have made room for you".
10. **Gallery**: 8 photos (4×2, 240px rows) above; 4 portrait (9:16) video tiles below with play button + duration chip.
11. **Shop the conference merch**: 4 product tiles linking to /shop.
12. **Testimonies**: one video testimony (5fr) + 2×2 quote cards; link "Share yours in the app →".
13. **Partner** banner (brick-700), button label "PARTNER".
14. **Footer** cobalt-950: seal, "© 2027 International Ministers & Leadership Conference.", quick links, contact (mivmandate2010@gmail.com · 0808 085 4818 · address).
**Rule:** every button on the landing page reads **"Register Now"** except the Partner button ("PARTNER").
Route: `/`

### 02 Registration — `Portal 02 Registration.dc.html` (2a–2g)
Stepped flow with 4-segment progress bar. [`/register`]
1. Category (Delegate / International delegate / Minister) + dashed link to Apply (VIP, speaker, vendor, media).
2. About you: full name, phone (+234 prefix, used to sign in), email optional, church/ministry, age band segmented (16–17 / 18–45 / 46+; IYLC = 16–45).
3. Attendance: Onsite (live capacity meter, e.g. 1,846/2,500) or Online; day chips; accommodation toggle. When cap is full, Onsite disables and Online is default.
4. OTP: 6 boxes, auto-read SMS, resend timer 0:42, consent checkbox.
5. Confirmation: "You're in, {first name}" + claim-ticket card (QR + code `JC27-DLG-48213`).
6. **PWA prompt immediately after registration** (client requirement): bottom sheet "Stay in the loop" → Turn on notifications / Not now (2e). Alternate 2f: install + alerts card. Implement 2e; show 2f install instructions on iOS Safari where `beforeinstallprompt` is unavailable.
Desktop 2g: cobalt side rail with step list.

### 03 Participant dashboard — `Portal 03 Dashboard.dc.html`
- **3a Home (pre-event)**: greeting, cobalt countdown card, claim-ticket row, 2×2 quick actions. [`/app`]
- **3b Home (during event)**: day label "DAY 5 OF 6", "Happening now" card with progress + Watch live, next session, meal status, badge shortcut, announcement.
- **3c Programme**: day tab strip, sessions on time rail with coloured left edge. [`/app/programme`]
- **3d More**: grouped list (My team, Attending card, Booklet · Hotels & travel, Store, Venue map, Testimonies & feedback, Publicity kit · Attendance, Notifications, Help). [`/app/more`]
- **3e Desktop**: 240px sidebar mirroring tabs.
**Bottom tab bar** (all app screens): Home · Programme · Pass · Live · More — `Tab Bar.dc.html`. Active = cobalt-600, inactive = ink-300, 11px labels, 30px bottom safe area.

### 04 Pass & attending card — `Portal 04 Pass and Attending Card.dc.html`
- **4a Claim ticket** (cobalt ground, ticket with perforation, QR 220px, works offline). [`/app/pass`]
- **4b Active badge** after print-desk check-in: badge card with brick top bar, today's access (Gate, Royal Conf., IYLC, Breakfast used).
- **4c/4d "I will be attending" generator**: square canvas (photo upload, name, frame picker, Square/Status sizes), Save/Share. Render server-side or client canvas → PNG. [`/app/attending-card`]

### 05 Speakers — `Portal 05 Speakers.dc.html` [`/speakers`, `/speakers/[slug]`]
Desktop grid (hosts, then "Ministered at IMLC 2026"), filter pills; **Learn more opens a 640px right drawer** with photo, role, bio paragraphs. Mobile: 2-col grid, photo-led profile with sheet overlap (6c).

### 06 Shop — `Portal 06 Shop.dc.html` [`/shop`, `/shop/[slug]`, `/shop/checkout`, `/shop/orders/[id]`]
Category (search, category pills/side list, product grid with heart + tag), item (gallery, size chips, colour swatches, qty stepper, Add to bag), checkout (details, Paystack: Card / Bank transfer / USSD, pickup at venue merchandise desk, summary), thank you (success card + pickup QR, "Add to my pass"). Products & images in `designs/assets/merch/` are **placeholders with third-party branding** — replace.

### 07 Teams & apply — `Portal 07 Teams and Apply.dc.html` [`/app/team`, `/app/apply`]
Team leader view (team code e.g. `CLA-7Q4K`, share link, member list with Confirmed/Invited), add-member sheet, minister's team (spouse + up to 3 aides), apply role picker (VIP, Speaker, Vendor, Media) → role form → status tracker timeline. Desktop: team table + CSV import; apply form.

### 08 Live & hotels — `Portal 08 Live and Hotels.dc.html` [`/app/live`, `/app/hotels`]
Live: 16:9 player, LIVE + viewers chip, Video/Radio segmented, up next, replays. Radio mode: audio-only screen (lock-screen media session). Hotels: budget filters, cards (distance chip, conference-rate tag, price/night), detail (amenities, rate code, Call / Book on WhatsApp). Getting there: map, directions, shuttle list. Desktop: player + today rail; hotel list + map.

### 09 Testimonies & feedback — `Portal 09 Testimonies.dc.html` [`/testimonies`, `/app/testimonies`]
Feed (video + written, tag, Amen count), share form (Write/Voice/Video, tags, show-name toggle; moderated), session feedback sheet (5 stars + chips, auto-prompt 10 min after a session ends), whole-conference survey, success card. Desktop: masonry wall + sticky share form.

### 10 Admin & ops — `Portal 10 Admin and Ops.dc.html` [`/admin/*`, `/desk`, `/scan`]
Admin sidebar: Overview, Registrants, Approvals, Teams, Broadcasts, Testimonies, **Publicity kit**, Store orders, Check-in & meals, Settings. Built views: Overview (KPIs, 14-day bar chart, capacity, category breakdown), Approvals (queue + detail with approve/decline), Broadcast composer (Push/SMS/Email/WhatsApp, audience chips, schedule, phone preview), Testimonies moderation, Publicity upload (dropzone, type, sizes, caption, schedule/publish, download & share counts). Unbuilt views (Registrants, Teams, Store orders, Check-in & meals, Settings) follow the same table/card patterns.
**Print desk 16a**: scan/search → attendee card → 3 checks → badge preview → Print (Enter) / clear (Esc).
**Scanner PWA 16b–d**: checkpoint segmented (Gate/Hall/Meal/Merch), viewfinder, offline queue counter, full-screen green OK (auto-return 1.5s) / red refusal with reason + Supervisor override.

### 11 Publicity kit — `Portal 11 Publicity Kit.dc.html` [`/publicity`, `/app/publicity`]
Library with type filters (Flyers, Status, Videos, Designs, Logos), item view (size picker Square 1080×1080 / Status 1080×1920 / Print A4, caption with Copy, Download/Share), share sheet (WhatsApp chat, WhatsApp group, WhatsApp status, Facebook, Instagram, YouTube, X, Copy link; caption auto-copied; optional "I will be attending" overlay). Use Web Share API Level 2 (`navigator.share({files})`) on mobile; deep-link fallbacks (`https://wa.me/?text=`, Facebook sharer, `https://twitter.com/intent/tweet`).


## Prototype interactions (clickable in the HTML)
Some designs are live prototypes — open them in a browser and click:
- **Countdowns** (01, 03) tick every second against `2027-01-19T17:00:00+01:00`.
- **Speakers 6a**: every "Learn more" opens the right-hand profile drawer; click the dimmed backdrop or ✕ to close. Screenshot: `screenshots/05-speakers/6a-STATE-profile-drawer-open.jpg`.
- **Admin 15a**: sidebar items Overview, Approvals, Broadcasts, Testimonies and Publicity kit switch the main panel (other items are placeholders). Screenshots: `screenshots/10-admin-ops/15a-STATE-*.jpg`.
- **Photo boxes** (image slots) accept drag-and-drop in the prototype; in production these are CMS/API images.
- Bottom sheets, success cards and pop-ups (2e, 2f, 9b, 13c, 13e, 17c, 7d) are drawn in their **open** state; build them as overlays triggered by the action described in each label.
Hidden/secondary states to implement even where not drawn: cap-full registration, declined application, failed payment, offline banner, empty lists, loading skeletons.

## Screenshots
`screenshots/` mirrors the design files, one JPG per screen (mobile at 402px wide, desktop at 1280px). The desktop landing page is split into 13 section images (`01-landing/5a-01-hero.jpg` … `5a-13-footer.jpg`). Files named `*-STATE-*` show an interactive state.

## Interactions & behaviour
- Countdown ticks every second; switches to "Happening now" during sessions.
- Registration validates per step; phone is E.164; OTP 6 digits, 60s resend; rate-limit.
- Notification permission is requested **only** from the post-registration sheet (user gesture).
- Pass and badge QR must render offline (cache in IndexedDB via service worker).
- Scanner works offline, queues scans, syncs when online; duplicate meal scans refused.
- Drawer/sheets: 200ms slide, backdrop `rgba(0,10,25,.55)`, close on backdrop/Esc.
- Empty, loading (skeletons) and error states required for every list.

## State
Auth (Sanctum token / session), current attendee + registration status, programme (by day), live state (current session, stream URL), cart, team, applications, notifications preference, scanner queue (offline).

## Assets
- `designs/assets/miv-logo.jpg` — official MIV seal (never recolour).
- `designs/assets/imlc-flyer.jpg` — 37th IMLC flyer.
- `designs/assets/photos/*` — event photos supplied by the client.
- `designs/assets/merch/*` — placeholder mockups (third-party logos; replace before launch).
- Icons: Lucide (2px stroke, round caps) — use `lucide-react`.

## Files
`designs/Portal Index.dc.html` (start here) · `Portal 01 Landing v2` · `Portal 01 Landing` (earlier options, superseded) · `Portal 02 Registration` · `Portal 03 Dashboard` · `Portal 04 Pass and Attending Card` · `Portal 05 Speakers` · `Portal 06 Shop` · `Portal 07 Teams and Apply` · `Portal 08 Live and Hotels` · `Portal 09 Testimonies` · `Portal 10 Admin and Ops` · `Portal 11 Publicity Kit` · shared `Tab Bar`, `QR` · runtime `support.js`, `ios-frame.jsx`, `image-slot.js` · design system `_ds/`.
