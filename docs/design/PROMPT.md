You are building the Jan. Conf 2027 portal (37th IMLC & IYLC) for The Men of Issachar Vision Inc.

Repository: {{REPO_URL}} (already created — clone it and work on branches, open PRs against main).

The design handoff is in docs/design/ (unzip design_handoff_jan_conf_portal.zip there if it is not committed yet). Read, in order:
1. docs/design/CLAUDE.md — build order and rules
2. docs/design/README.md — every screen, tokens, behaviour, prototype interactions
3. docs/design/ARCHITECTURE.md — Laravel 11 API + Next.js 15 App Router monorepo
4. docs/design/screenshots/ — the visual target for every screen and state
5. docs/design/designs/*.dc.html — open with `npx serve docs/design/designs` to click through the live prototypes (speaker drawer, admin sidebar views, countdowns)

Start with step 1 of the build order in CLAUDE.md (scaffold apps/api and apps/web, docker-compose, CI, design tokens + base components). Match the designs exactly, use only the listed tokens, Oswald + Barlow fonts, no JetBrains Mono. Commit with Conventional Commits and summarise what you built and what is next at the end of each step.