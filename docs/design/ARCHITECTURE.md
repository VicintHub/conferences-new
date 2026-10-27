# Architecture — Laravel API + Next.js

## Repository (monorepo)
```
jan-conf-portal/
├─ apps/
│  ├─ api/            Laravel 11 (PHP 8.3) — REST API, admin logic, queues
│  └─ web/            Next.js 15 App Router (TypeScript) — public site, participant PWA, admin, desk, scanner
├─ packages/
│  └─ api-types/      OpenAPI-generated TS types shared by web
├─ docs/design/       this handoff (README, designs/)
├─ docker-compose.yml MySQL 8, Redis, Mailpit, MinIO (S3), api, web
└─ .github/workflows/ ci.yml (lint, test, build for both apps)
```

## Backend — `apps/api` (Laravel 11)
- **Auth**: Laravel Sanctum. Attendees: phone + OTP (SMS) → token. Staff: email + password + 2FA; roles via `spatie/laravel-permission` (super-admin, registration, media, desk, scanner, store).
- **Structure**: domain modules under `app/Domain/{Registration,Programme,Pass,Teams,Applications,Store,Live,Hotels,Testimonies,Publicity,Broadcasts,CheckIn}` each with `Models`, `Actions` (single-purpose invokables), `Data` (spatie/laravel-data DTOs), `Policies`, `Events`. Thin controllers in `app/Http/Controllers/Api/V1`, Form Requests for validation, API Resources for output.
- **API**: versioned `/api/v1`, JSON:API-style resources, cursor pagination, OpenAPI via `dedoc/scramble` → generates `packages/api-types`.
- **Queues**: Redis + Horizon for SMS, push, email, badge PDF/PNG rendering, publicity image resizing.
- **Storage**: S3-compatible (MinIO locally) for photos, publicity files, videos; signed URLs; image variants via `spatie/laravel-medialibrary` (square 1080, status 1080×1920, print A4 PDF).
- **Payments**: Paystack (webhook-verified, idempotent order state machine: pending → paid → collected / refunded).
- **Messaging**: SMS (Termii or Africa's Talking), Web Push (`laravel-notification-channels/webpush`, VAPID), email (Mailgun/SES), WhatsApp Cloud API optional.
- **Realtime**: Laravel Reverb for live counters (capacity, viewers, admin dashboard) and "happening now".
- **Capacity**: onsite cap enforced in a DB transaction with row lock; overflow defaults to online.
- **Scanner sync**: `POST /scans/batch` idempotent by client UUID; server rules per checkpoint (gate, hall, meal once per meal window, merch pickup).
- **Testing**: Pest, factories/seeders reproducing the design sample data.

### Core tables
attendees, registrations (category, mode, days, status, claim_code), otp_codes, badges (printed_at, desk_id), teams, team_members, minister_aides, applications (role, payload json, status, documents), sessions (day, start, end, hall, stream_url), speakers, testimonies (type, body, media, tags, show_name, status, amen_count), feedback_responses, products, product_variants, orders, order_items, payments, hotels, shuttles, publicity_items (type, caption, sizes, published_at, downloads, shares), broadcasts (channels, audience, scheduled_at, sent_at), scans (checkpoint, attendee_id, result, client_uuid, device_id), push_subscriptions, staff_users.

## Frontend — `apps/web` (Next.js 15)
- **Routing (App Router, route groups)**:
  - `(public)` `/`, `/speakers`, `/speakers/[slug]`, `/testimonies`, `/publicity`, `/shop/*`, `/register`
  - `(app)` `/app`, `/app/programme`, `/app/pass`, `/app/live`, `/app/more`, `/app/team`, `/app/apply`, `/app/hotels`, `/app/testimonies`, `/app/publicity`, `/app/attending-card` — bottom TabBar layout on mobile, sidebar ≥1024px
  - `(staff)` `/admin/*`, `/desk`, `/scan` — role-guarded via middleware
- **Data**: Server Components fetch public data (ISR, `revalidate` 60s); client data via TanStack Query against the API; mutations through typed fetch client generated from OpenAPI.
- **Auth**: httpOnly cookie holding Sanctum token, set by a Next route handler; `middleware.ts` protects `(app)` and `(staff)`.
- **UI**: Tailwind CSS with tokens from README mapped to `theme.extend`; Radix primitives (Dialog/Sheet, Tabs, Toggle); `lucide-react`; `next/font` Oswald + Barlow; `qrcode.react` for QR.
- **Forms**: react-hook-form + zod (schemas mirror Laravel Form Requests).
- **PWA**: `@serwist/next` service worker — precache app shell, cache pass/badge + programme for offline, background sync for scanner queue; Web Push subscription after the post-registration sheet; manifest with MIV seal icons.
- **Media**: `navigator.share` with files for publicity/attending card; canvas or server-rendered PNG.
- **Quality**: ESLint + Prettier, Vitest + Testing Library, Playwright e2e (register → OTP → pass; shop checkout; scanner offline), Lighthouse PWA budget in CI.

## Environments & CI/CD
- GitHub Actions: on PR run `composer test`, `pint --test`, `larastan`, `pnpm lint`, `pnpm test`, `pnpm build`, Playwright.
- Deploy: web → Vercel; api → Forge/Laravel Cloud (or Docker on VPS) with Horizon + Reverb workers; MySQL managed; S3 bucket + CDN.
- Secrets via environment variables only (`.env.example` in both apps).
