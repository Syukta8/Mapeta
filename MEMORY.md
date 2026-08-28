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
2026-08-28 — Tailscale / WireGuard Remote Mesh Access — Zero-config, encrypted private access from Android phones on cellular data without opening router ports.
2026-08-28 — Mandatory Pre-Commit Build Gate — Every stage must pass npm run build and tsc --noEmit before git commit.

## Gotchas
- On Windows, ensure native dependencies have prebuilt binaries or pure TS fallback.
- Screen Wake-Lock and Geolocation APIs require secure context (HTTPS / localhost).

## Log
2026-08-28 — Repository initialized and architectural plan approved.
