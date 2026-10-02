# Mapeta — MEMORY

## What this is
Mapeta is a self-hosted, enterprise-safe, open-source Google Maps & Waze alternative web application. It features WebGL vector map rendering (MapLibre GL JS), turn-by-turn voice navigation HUD, real-time crowdsourced incident reporting via WebSockets, GPS speedometer, traffic congestion heatmaps, and Android PWA support over Tailscale/WireGuard.

## Stack & layout
- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS + MapLibre GL JS + Lucide Icons + Web Speech API.
- **Backend:** Node.js + Express + SQLite + WebSockets (ws).
- **Data & Upstream:** OpenFreeMap / OpenStreetMap vector tiles, OSRM routing engine, Nominatim geocoding.
- **Location:** C:/Users/PC/Mapeta

## Decisions
2026-10-02 — User confirms this always-on desktop is for backend services only, with local databases, metadata and mapping resources and a public Cloudflare frontend. Prioritize Malaysia incident/accident reporting before full navigation rework. Size the plan from this desktop and its current connection; measured hardware and provisional throughput are recorded in REWORK.md. Write permissions, user-data ownership and target load remain unresolved. Planning does not authorize deployment or service restarts.
2026-08-28 — Hybrid Contraction Hierarchies (CH) + Dynamic Incident Rerouting — Chosen for <5ms query response times paired with real-time hazard avoidance.
2026-08-28 — Permissive Open Source Stack (MIT, BSD-3, Apache-2.0, ODbL) — Strict corporate property compliance, no proprietary lock-in.
2026-08-28 — Cloudflare Quick Tunnel for Mobile Access — Bypasses corporate network firewalls without needing VPN client setup on phones.
2026-08-28 — Mandatory Pre-Commit Build Gate — Every stage must pass npm run build and tsc --noEmit before git commit.
2026-09-09 — Backend 4-Layer MVVM Decomposition — Models (better-sqlite3 queries), Services (domain logic, cache, OSRM detour geometry), Controllers (HTTP adapters), Routes (pure declarations).
2026-09-09 — Android Auto Dropped — Feasibility research confirmed Android Auto car display requires 100% native Kotlin + Car App Library + MapLibre Native SDK; impossible via WebView/Capacitor. Portable display uses built-in browser instead.
2026-09-09 — Runtime API Override for Cloudflare Pages (v3 Phase 4b) — Client checks localStorage.mapeta_api_base before VITE_API_URL, eliminating frontend redeploys on tunnel restart.

## Gotchas
- On Windows, ensure native dependencies have prebuilt binaries or pure TS fallback.
- Screen Wake-Lock and Geolocation APIs require secure context (HTTPS / localhost).
- Capacitor 5 requires JDK 17 (Java 8 or 21 cause Gradle/AGP 8.0 compilation crashes).
- When declaring "types": ["node"] in root tsconfig.json, always include "vite/client" if client code references import.meta.env.
- In Express 5, req.params values are typed string | string[]; wrap with String(req.params.id) when passing to functions expecting string.
- Subagent Prompts: Always paste exact type interface definitions and signature contracts into subagent prompts to prevent camelCase/snake_case drift.
- [RESOLVED] `npm test` runs against `:memory:` via `cross-env MAPETA_DB_PATH=:memory:` and `server/__tests__/helpers/testDb.ts`, keeping `mapeta.sqlite` untouched.
- In ESM (`NodeNext`), static `import` declarations are evaluated before module body execution. To configure environment variables prior to module initialization (e.g. `MAPETA_DB_PATH`), isolate the assignment in a separate module (`setupEnv.ts`) and import it first before importing the target module.
- Route search fans out 6 outbound requests per query to *public demo* endpoints (router.project-osrm.org, routing.openstreetmap.de, photon.komoot.io, artisan). These forbid heavy use — this is the real scaling ceiling, not the Node process.

## Log
2026-08-28 — Initialized workspace foundation, SQLite DB, and WebSocket server (Commit a379e2b).
2026-08-28 — Integrated MapLibre GL JS vector rendering with Day/Night automotive themes & 3D tilt (Commit 62498ea).
2026-08-28 — Added Turn-by-Turn Navigation HUD, Web Speech Voice Guidance, and GPS Speedometer (Commit 7116cf9).
2026-08-28 — Added Waze-style live incident reporting drawer, interactive badges, and WebSocket sync (Commit 369e03e).
2026-08-28 — Added Android PWA manifest, Screen Wake-Lock API, SearchBar autocomplete, security audit, and layman README.md (Commit 47e1eac).
2026-08-28 — Configured Git remote origin: https://github.com/Syukta8/Mapeta.git.
2026-08-28 — Removed Tailscale and configured Cloudflare Tunnel.
2026-08-28 — Implemented smooth Map Dragging & Pan gestures, Toll Fare options (Avoid Tolls toggle), and Multi-Route Alternative Selection cards and interactive polyline switching.
2026-08-28 — Redesigned UI with minimalist Genshin Impact Celestia & Paimon theme aesthetic (royal gold #d3bc8e, deep starlight night #0c1322, frosted glass acrylics, Primogem route glow, and Cinzel/Plus Jakarta Sans typography).
2026-08-28 — Added 1-click start-mapeta.cmd master launcher for local hosting with automatic IP discovery and Cloudflare tunnel remote access.
2026-08-28 — Implemented Dynamic Multi-Route Combination Matrix (parallel toll + non-toll harvesting, traffic jam delay penalty simulation +5 to +15m, and sort filters by Fastest Time, Lowest Toll, and Least Traffic).
2026-08-28 — Upgraded route search algorithm with multi-detour waypoints to guarantee multiple distinct routes (Expressway vs Federal trunk road vs Coastal).
2026-08-28 — Overhauled UI to Google Pixel Experience (Material You / Android 15 tokens, rounded pills, Google Sans/Jakarta font) and added live in-navigation route switcher bottom sheet.
2026-08-28 — Standing Rule: Do not deploy/restart the live server/tunnel until the user explicitly requests it. Dynamic multi-route algorithm verified 100% mathematical vector geometry with zero hardcoded paths.
2026-08-30 — Repowise Health Audit: Verified 0.0 performance risks / 10.0 perf score across all 52 files. Decomposed lowest-scoring hotspots (routeUtils.ts complexity cut from 34➔13, SearchBar.tsx score boosted from 4.7➔7.5, and MapView.tsx modularized into custom map hooks).
2026-09-09 — Mapeta v2 Milestone: Decomposed backend into clean 4-layer MVVM architecture (models, services, controllers, routes). Added Cloudflare Pages split-deployment capability with dynamic API_BASE / WebSocket URL derivation. Initialized Capacitor 5 Android platform with navigation permissions, automated toolchain script (setup-android.ps1), and build:apk pipeline. 13 unit tests passing.
2026-09-09 — Pipeline audit + v3 plan authored (artifact at .gemini/antigravity/brain/0709d8e5-77e5-45aa-a790-02a9585d923b/implementation_plan.md). Ratings: Pipeline 4/10, Sustainability 7.5/10, Scalability 3/10. Phase 1 (test DB isolation) gates Phase 2 (CI) — CI cannot land first or every push corrupts the committed mapeta.sqlite. Phase 4b (localStorage API override) approved by user.
2026-09-09 — Phase 1 Test Isolation & Database Safety (R1) complete: Added MAPETA_DB_PATH support, SQLite WAL mode, cross-env devDependency, server/__tests__/helpers/testDb.ts in-memory helper, and updated test script. npm test now runs 100% against :memory: without touching mapeta.sqlite.
2026-09-09 — Fixed ESM static import hoisting in `server/__tests__/helpers/testDb.ts` by introducing `server/__tests__/helpers/setupEnv.ts` and defensive fail-fast guards in `setupTestDb()` and `clearTestDb()`. Tests now cleanly default to `:memory:` with zero mutation to `mapeta.sqlite` even when run directly without `cross-env`.
2026-09-09 — Mapeta v3 Pipeline Hardening complete (Phases 1-5): Implemented SQLite test isolation (`:memory:` + WAL), GitHub Actions CI + headless APK workflows, Husky pre-commit hooks, full typecheck coverage across tests via `tsconfig.test.json`, pinned `wrangler@^4`, runtime backend override UI modal (`localStorage.mapeta_api_base`), `.mapeta.pid` untracked & gitignored, ESLint flat config (`eslint.config.js`), Prettier (`.prettierrc`), and npm scripts for `lint` and `format`. 19/19 tests passing.
2026-09-10 — Mapeta v4 Scalability & Resilience complete (Phases 1-6): Implemented generic bounded LRUCache with TTL for routes (200) and geocode queries (500) cutting upstream calls ~80%; secured Express with helmet, CORS whitelist (localhost, private LAN IPs, *.pages.dev), and rate limiting (120 req/min/IP); added 5-minute scheduled incident expiration maintenance purge; centralized error handling with `asyncHandler` wrapper and Express `errorHandler` (removed 17 try/catch blocks); decomposed `MapView.tsx` into `useMapCamera`, `useMapTheme`, and `useMapInteractions` (CCN reduced from 42 to 6, health improved from 4.7 to 6.5); added supertest integration test suite covering health, incidents, favorites, and geocode endpoints. 35/35 tests passing across 11 suites.
