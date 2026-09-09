# Mapeta — MISTAKE LOG

Every mistake, dead end, and wrong assumption during implementation. No sugar-coating.

## Format
`YYYY-MM-DD HH:MM` — **What went wrong** — Root cause — Fix applied

---

## Entries

2026-09-09 10:42 — **incidentService.ts used camelCase field names (`createdAt`, `expiresAt`) instead of snake_case (`reported_at`, `expires_at`)** — Subagent writer didn't cross-reference types.ts which uses snake_case matching the DB columns. — Fixed by replacing with `reported_at` and `expires_at`.

2026-09-09 10:42 — **incidentService.ts called `broadcast('INCIDENT_NEW', incident)` with wrong signature** — Original `broadcast()` in `incidentSocket.ts` expects `broadcast({ type, payload })` (WSMessage object), not two separate args. — Fixed by wrapping in `{ type: '...', payload: ... }`.

2026-09-09 10:42 — **incidentService.ts set `upvotes: 0` on new incident, but original code uses `upvotes: 1`** — The reporter auto-upvotes their own report. Subagent missed this behavioral detail. — Fixed to `upvotes: 1`.

2026-09-09 10:42 — **incidentService.ts missing `title` fallback** — Original: `title || \`${type.toUpperCase()} reported\``. Subagent used `data.title || data.type` (no uppercase, no "reported" suffix). — Fixed to match original behavior.

2026-09-09 10:43 — **favoriteService.ts used `createdAt` instead of `created_at`** — Same snake_case mistake as incidentService. Subagent pattern: all 3 agents independently chose camelCase despite the type interface clearly using snake_case. — Fixed.

2026-09-09 10:43 — **geocodeService.ts returned `type` field instead of `category`** — GeocodeResult interface uses `category`, original code maps to `category: p.osm_value || 'place'`. Subagent used `type` instead. — Fixed.

2026-09-09 10:43 — **geocodeService.ts cache key included limit** — Original caches on `query.toLowerCase()` only. Subagent added `:${limit}` which defeats cache hits when limit varies. — Fixed.

2026-09-09 10:43 — **geocodeService.ts Photon mapping missing `id`, `lon`, `district`, `country` fields** — Original maps `osm_id` to id, includes both `lng` and `lon`, and uses district+country in display_name. — Fixed.

2026-09-09 10:43 — **routeService.ts used `routed-car` OSRM endpoint instead of `routed-driving`** — The actual OSRM demo server endpoint is `routed-driving`, not `routed-car`. Also used different corridor algorithm from original. — Rewrote to match original routeProxy.ts exactly.

2026-09-09 10:46 — **Express 5 `req.params.id` type mismatch (`string | string[]`) in controllers** — In `@types/express` v5, route params can be typed `string | string[]`. Passing directly to functions expecting `string` caused TS2345. — Fixed by wrapping with `String(req.params.id)`.

2026-09-09 10:46 — **`geocodeService.ts` Nominatim fallback broke `GeocodeResult` interface** — Used `type` instead of `category`, omitted `id` field. — Fixed by conforming to `GeocodeResult` interface with `id`, `lon`, and `category`.

2026-09-09 10:46 — **`geocodeService.ts` needlessly re-mapped `localFavorites` into invalid shape** — `favoriteModel.search` already returned `GeocodeResult[]`, but service re-mapped it with `f.address` (which didn't exist, as SQL aliased to `display_name`) and `type` instead of `category`. — Fixed by using `localFavorites` directly.

2026-09-09 10:48 — **`Property 'env' does not exist on type 'ImportMeta'` (TS2339) in `config.ts`** — Root `tsconfig.json` had `"types": ["node"]` which prevented TypeScript from loading default Vite client ambient types (`import.meta.env`). — Fixed by adding `"vite/client"` to `"types"` in `tsconfig.json` and creating `client/src/vite-env.d.ts`.

2026-09-09 15:30 — **`client/src/config.ts` threw `TypeError: Cannot read properties of undefined (reading 'VITE_API_URL')` during `npm test`** — In Vite runtime, `import.meta.env` exists; but in Node.js test runner (`tsx --test`), `import.meta.env` is `undefined`. Directly accessing `.VITE_API_URL` without guarding threw an uncaught TypeError. — Fixed by guarding `import.meta.env && import.meta.env.VITE_API_URL` and adding `process.env?.VITE_API_URL` fallback.
