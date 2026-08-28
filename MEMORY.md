# Mapeta — MEMORY

## What this is
Mapeta is a self-hosted, enterprise-safe, open-source Google Maps & Waze alternative web application. It features WebGL vector map rendering (MapLibre GL JS), turn-by-turn voice navigation HUD, real-time crowdsourced incident reporting via WebSockets, GPS speedometer, traffic congestion heatmaps, and Android PWA support over Tailscale/WireGuard.

## Stack & layout
- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS + MapLibre GL JS + Lucide Icons + Web Speech API.
- **Backend:** Node.js + Express + SQLite + WebSockets (ws).
- **Data & Upstream:** OpenFreeMap / OpenStreetMap vector tiles, OSRM routing engine, Nominatim geocoding.
- **Location:** C:/Users/PC/Mapeta

## Decisions
2026-08-28 — Hybrid Contraction Hierarchies (CH) + Dynamic Incident Rerouting — Chosen for <5ms query response times paired with real-time hazard avoidance.
2026-08-28 — Permissive Open Source Stack (MIT, BSD-3, Apache-2.0, ODbL) — Strict corporate property compliance, no proprietary lock-in.
2026-08-28 — Cloudflare Quick Tunnel for Mobile Access — Bypasses corporate network firewalls without needing VPN client setup on phones.
2026-08-28 — Mandatory Pre-Commit Build Gate — Every stage must pass npm run build and tsc --noEmit before git commit.

## Gotchas
- On Windows, ensure native dependencies have prebuilt binaries or pure TS fallback.
- Screen Wake-Lock and Geolocation APIs require secure context (HTTPS / localhost).

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
2026-08-28 — Implemented 4-Route Dynamic Corridor Engine with nearest road node snapping (/nearest/v1/driving), guaranteeing up to 4 diverse distinct routes (Fastest Toll Highway vs Federal Trunk vs Alternate Corridors) with interactive map polyline selection and differential toll/time badges.
