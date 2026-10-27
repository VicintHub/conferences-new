# Jan. Conf 2027 portal

Portal for the 37th IMLC & IYLC (19–24 Jan 2027, Ibadan) — The Men of Issachar Vision Inc.

| Path | What |
| --- | --- |
| `apps/api` | Laravel API (Sanctum, Horizon, Reverb, Spatie permission/data/medialibrary, Scramble) |
| `apps/web` | Next.js 15 App Router — public site, participant PWA, admin, desk, scanner |
| `docs/design` | Design handoff (read `CLAUDE.md`, `README.md`, `ARCHITECTURE.md`) |

## Develop

```bash
docker compose up -d mysql redis mailpit minio minio-setup

cd apps/api && cp .env.example .env && composer install && php artisan key:generate && php artisan migrate
php artisan serve                # http://localhost:8000/api/v1/health

cd apps/web && cp .env.example .env.local && pnpm install && pnpm dev   # http://localhost:3000
```

Sign-in is passwordless: an emailed 6-digit code or one-click link (no SMS). Locally, mail goes to Mailpit at http://localhost:8025.

Uploads (testimony audio/video, later publicity files) go to the `public` disk: run `php artisan storage:link` locally. Seed data (`php artisan migrate --seed`) includes the programme, speakers, testimonies and publicity items.

Offline: the service worker only exists in production builds (`pnpm build && pnpm start`). It caches the app shell; the ticket and programme are kept in IndexedDB and cleared on sign-out.

UI kit preview: `/_kitchen-sink` (dev only; set `NEXT_PUBLIC_SHOW_KITCHEN_SINK=1` to expose in a build).

Checks: `composer test`, `vendor/bin/pint --test`, `vendor/bin/phpstan analyse`; `pnpm lint typecheck test build`.
