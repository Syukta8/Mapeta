# Mapeta Pipeline Modernization & Thin-Client Architecture

## 1. Overview & Objectives

This document outlines the architectural transformation of Mapeta to fulfill two core requirements:
1. **Unified & Fixed Domain Accessibility**: Frontend hosted globally on Cloudflare Pages (`https://mapeta.pages.dev`), with a single, permanent URL for the backend hosted on the local machine accessible over any network (4G/5G/Wi-Fi) without manual token or port switching.
2. **Thin-Client Separation of Concerns**: Migration of all core business logic, route computation, toll rate estimation, and incident impact calculation from the React frontend into the Node.js Express backend. The frontend will strictly handle user input, state rendering, and vector map display.

---

## 2. Architecture & Pipeline Topology

```
                  ┌───────────────────────────────────────────────┐
                  │                 USER DEVICES                  │
                  │  (4G / 5G Cellular, In-Car Tablets, Desktop)  │
                  └───────────────────────┬───────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        CLOUDFLARE EDGE INFRASTRUCTURE                           │
│                                                                                 │
│  1. Cloudflare Pages (Global Static CDN)                                        │
│     • URL: https://mapeta.pages.dev                                             │
│     • Serves compiled React 19 SPA (HTML/JS/CSS/Web Workers)                    │
│     • Zero client-side computation of tolls or OSRM geometry                    │
│                                                                                 │
│  2. Cloudflare Zero Trust Named Tunnel (Permanent Ingress)                      │
│     • Fixed Public Hostname: https://api.mapeta.site (or user custom domain)    │
│     • Direct reverse-proxy rule in Pages (_redirects):                          │
│         /api/*  https://api.mapeta.site/api/:splat  200                         │
│         /ws     https://api.mapeta.site/ws          200                         │
│     • Eliminates CORS pre-flights and manual localStorage URL overrides        │
└────────────────────────────────────────┬────────────────────────────────────────┘
                                         │ Secure Encrypted gRPC/QUIC Tunnel
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        LOCAL HOST MACHINE (BACKEND CORE)                        │
│                                                                                 │
│  1. Ingress & Connectivity:                                                     │
│     • cloudflared tunnel run mapeta-service (Headless persistent agent)         │
│     • Express Server running on 127.0.0.1:3000                                  │
│                                                                                 │
│  2. Business Logic & Processing Engine:                                         │
│     • Route Processing & Detour Corridors                                       │
│     • Malaysian LLM Toll Engine (Class 1 passenger car fare breakdown)          │
│     • Incident Corridor Intersection & Delay Penalties                          │
│     • Step Parsing & Maneuver Instruction Generation                            │
│     • Bounded LRU Cache (200 routes, 500 geocodes)                              │
│                                                                                 │
│  3. Data Layer:                                                                 │
│     • SQLite Database (Incidents with auto-purge, Saved Favorites)             │
│     • WebSocket Incident Broadcast Hub                                          │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Thin-Client Business Logic Migration

### Current State (Heavy Frontend)
- **Toll Estimation**: `client/src/utils/tollEngine.ts` (241 lines) contains regex parsing for Malaysian highways (PLUS, ELITE, LDP, MEX, etc.) and distance calculation.
- **Route Normalization & Traffic Impact**: `client/src/utils/routeUtils.ts` (183 lines) parses raw OSRM legs, calculates proximity to active incidents, generates human instructions, and sorts alternatives.
- **Payload Size**: Large raw OSRM geometries and step arrays transferred from backend to frontend unoptimized.

### Target State (Thin Frontend / Enriched Backend)
- **Backend Responsibility**: `server/services/routeService.ts` accepts origin, destination, profile, and incorporates active incidents directly from `incidentModel`. It returns fully enriched `RouteInfo[]` ready for direct presentation.
- **Frontend Responsibility**: Directly binds `RouteInfo[]` to MapLibre layers and UI cards. Zero toll or geometric recalculations executed in the browser.

---

## 4. Affected Files & Change Manifest

### A. Backend Files

| File | Status | Planned Modifications |
|---|---|---|
| [`server/services/tollEngine.ts`](file:///C:/Users/PC/Mapeta/server/services/tollEngine.ts) | **NEW** | Move gazetted Malaysian highway toll calculations (`LLM_EXPRESSWAYS`, open/closed toll matrices) from frontend to backend service layer. |
| [`server/services/routeService.ts`](file:///C:/Users/PC/Mapeta/server/services/routeService.ts) | **MODIFY** | Incorporate step normalization, maneuver instruction generation, toll calculation, and incident delay penalties. Retrieve active incidents directly from `incidentModel`. |
| [`server/controllers/routeController.ts`](file:///C:/Users/PC/Mapeta/server/controllers/routeController.ts) | **MODIFY** | Return normalized, ready-to-render `RouteInfo[]` directly in response payload (`{ success: true, data: { routes: RouteInfo[] } }`). |
| [`server/launcher.js`](file:///C:/Users/PC/Mapeta/server/launcher.js) | **MODIFY** | Support running a Named Cloudflare Tunnel (`cloudflared tunnel run <name>`) alongside the existing quick tunnel fallback. |
| [`server/__tests__/backendMvvm.test.ts`](file:///C:/Users/PC/Mapeta/server/__tests__/backendMvvm.test.ts) | **MODIFY** | Add unit and integration tests for backend toll calculation, maneuver generation, and incident traffic delay calculations. |

### B. Frontend Files

| File | Status | Planned Modifications |
|---|---|---|
| [`client/src/models/RouteService.ts`](file:///C:/Users/PC/Mapeta/client/src/models/RouteService.ts) | **MODIFY** | Simplify into pure API fetcher. Remove dependency on `client/src/utils/routeUtils.ts`. |
| [`client/src/utils/tollEngine.ts`](file:///C:/Users/PC/Mapeta/client/src/utils/tollEngine.ts) | **DELETE / DEPRECATE** | Logic moved to backend. Retain minimal type definitions or delete. |
| [`client/src/utils/routeUtils.ts`](file:///C:/Users/PC/Mapeta/client/src/utils/routeUtils.ts) | **MODIFY** | Retain only client-side presentation helpers (e.g., polyline color picking, icon mapping). Remove business calculation routines. |
| [`client/public/_redirects`](file:///C:/Users/PC/Mapeta/client/public/_redirects) | **NEW** | Cloudflare Pages edge proxy rule routing `/api/*` and `/ws` to the fixed backend domain. |
| [`client/src/config.ts`](file:///C:/Users/PC/Mapeta/client/src/config.ts) | **MODIFY** | Update default resolution to rely primarily on relative `/api` (backed by Cloudflare proxy) with fallback to custom domain. |
| [`client/src/components/UI/ConnectionStatus.tsx`](file:///C:/Users/PC/Mapeta/client/src/components/UI/ConnectionStatus.tsx) | **NEW** | Visual heartbeat indicator showing whether the local backend server is online, reachable, or offline. |

---

## 5. Implementation Phasing

1. **Phase 1: Backend Algorithm Migration**
   - Port `tollEngine.ts` and route post-processing routines into `server/services/`.
   - Update `routeService.ts` to return pre-computed `RouteInfo[]`.
   - Expand backend automated test suites to cover toll and maneuver generation.

2. **Phase 2: Frontend Slimming**
   - Refactor frontend `RouteService` and components to consume pre-computed route data.
   - Remove redundant client-side calculation dependencies.
   - Verify that UI rendering, toll badges, and turn-by-turn maneuvers remain identical.

3. **Phase 3: Cloudflare Fixed Ingress & Proxy**
   - Create `client/public/_redirects` proxy configuration for Cloudflare Pages.
   - Configure Named Tunnel scripts and setup guides for persistent local execution.
   - Add frontend backend heartbeat indicator.
