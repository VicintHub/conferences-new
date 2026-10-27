# Instructions for Claude Code

You are implementing the Jan. Conf 2027 portal from the design handoff in this folder. Read `README.md` (screens, tokens, behaviour) and `ARCHITECTURE.md` (stack) before writing code.

## 1. Create the GitHub repository
```bash
gh auth status || gh auth login
mkdir jan-conf-portal && cd jan-conf-portal && git init -b main
gh repo create <your-org-or-user>/jan-conf-portal --private --source=. --remote=origin
```
Copy this handoff folder into `docs/design/` and commit it first: `git add docs && git commit -m "docs: design handoff"`.

## 2. Scaffold
```bash
mkdir -p apps packages
composer create-project laravel/laravel apps/api
cd apps/api && php artisan install:api && composer require laravel/sanctum laravel/horizon laravel/reverb spatie/laravel-permission spatie/laravel-data spatie/laravel-medialibrary dedoc/scramble && composer require --dev pestphp/pest larastan/larastan laravel/pint && cd ../..
pnpm create next-app@latest apps/web --ts --tailwind --eslint --app --src-dir --import-alias "@/*"
cd apps/web && pnpm add @tanstack/react-query react-hook-form zod @hookform/resolvers lucide-react qrcode.react @radix-ui/react-dialog @radix-ui/react-tabs @serwist/next && cd ../..
```
Add `docker-compose.yml` (mysql, redis, mailpit, minio) and `.github/workflows/ci.yml`.

## 3. Build order (one PR each)
1. Design tokens + base components (Button, Chip, Segmented, Sheet, Card, Input, TabBar, Countdown, QR) with a `/_kitchen-sink` page.
2. Public landing `/` (match `designs/Portal 01 Landing v2.dc.html` option 5a; every button "Register Now" except "PARTNER").
3. Registration + OTP + confirmation + notification sheet (API: attendees, registrations, otp).
4. App shell + Home + Programme + Pass (offline).
5. Speakers, Testimonies, Publicity kit (public + app).
6. Shop + Paystack.
7. Teams, minister's team, applications.
8. Live & radio, hotels & travel.
9. Admin console (overview, approvals, broadcasts, moderation, publicity upload, remaining tables).
10. Print desk + scanner PWA (offline queue).

## Rules
- Match the HTML designs exactly (open them via `npx serve docs/design/designs`). Do not ship the HTML.
- No JetBrains Mono. Fonts: Oswald (display), Barlow (UI/body).
- Colours only from the token list; accents are cobalt + brick.
- Sample content in designs is placeholder — seed it, but load real data from the API.
- Write tests with each feature; keep controllers thin; validate with Form Requests + zod.
- Commit with Conventional Commits; open PRs against `main`.
