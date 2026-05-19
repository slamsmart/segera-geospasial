# SYSTEM_MAP.md

## Relationship With AGENTS.md
- `SYSTEM_MAP.md` → architecture, file locations, entrypoints, runtime flow, module boundaries
- `AGENTS.md` → agent behavior, editing discipline, safety rules, response style
- Conflict: follow SYSTEM_MAP for architecture, AGENTS for execution behavior
- Do not rewrite architecture unless explicitly requested

---

## Project Snapshot
- Project name: SEGERA — Sistem Informasi Geospasial Terintegrasi Perikanan
- Project type: Web app (single-page + serverless API)
- Primary users: Public (read-only), Admin Dinas Kelautan dan Perikanan (CRUD)
- Primary goal: Visualisasi & manajemen data usaha perikanan geospasial Jawa Timur
- Repo type: Single app
- Main risks: auth (admin token), data integrity (Convex), Cloudinary upload security

---

## Tech Stack
- Frontend: Single-file HTML (`index.html`) — Tailwind CSS CDN, Leaflet.js, Plus Jakarta Sans
- Backend: Vercel Serverless Functions (TypeScript, `@vercel/node`)
- Database: Convex (realtime, hosted)
- Auth: Bearer token (`ADMIN_API_TOKEN` env var) — server-side only
- Storage: Cloudinary (signed upload via `/api/cloudinary-sign`)
- Queue / Jobs: none
- Infra / Hosting: Vercel
- Observability: visitor tracking via `/api/visitors` + Convex
- Testing: none currently
- External integrations: Leaflet (maps), jsPDF, xlsx.js, Cloudinary

---

## Top-Level Layout
```
index.html              ← entire frontend (public + admin views)
api/
  businesses.ts         ← CRUD usaha (GET public, POST/PUT/DELETE admin)
  visitors.ts           ← visitor tracking
  cloudinary-sign.ts    ← signed upload token
convex/
  schema.ts             ← data model source of truth
  businesses.ts         ← Convex queries & mutations
  visitors.ts           ← Convex visitor queries & mutations
set-up-project-v.1.0/   ← rule templates (AGENTS.md, SYSTEM_MAP.md, mcp.json)
caveman/                ← caveman output skill (git clone)
lean-ctx/               ← lean-ctx context engineering (git clone)
.env.local              ← secrets (CONVEX_URL, ADMIN_API_TOKEN, CLOUDINARY_*)
vercel.json             ← routing: /api/* → serverless, / → index.html
package.json            ← deps: convex, cloudinary, @vercel/node
```

---

## Entry Points
- Web app entry: `index.html` (entire SPA — public view + admin view in one file)
- API entry: `api/businesses.ts`, `api/visitors.ts`, `api/cloudinary-sign.ts`
- Worker entry: none
- Auth entry: `api/businesses.ts` → `requireAdmin()` checks `Authorization: Bearer <token>`
- Admin / dashboard entry: `index.html` → `#admin-view` div (toggled by JS)
- Public docs entry: none
- Runtime config: `.env.local` (local), Vercel env vars (production)

---

## Runtime Flows

### App Bootstrap Flow
- Entry: `index.html` loads
- Providers: Tailwind CDN, Leaflet CDN, jsPDF CDN, xlsx CDN
- Config loaded: none client-side (all secrets server-side)
- Global side effects: Leaflet map init, fetch `/api/businesses` for markers + list
- Output: public map view with sidebar

### Auth Flow
- Entry: Admin clicks "Admin Login" button → login modal
- Identity source: password input compared to `ADMIN_API_TOKEN` env var via API
- Session / token storage: JS variable in memory (no localStorage)
- Guard: `requireAdmin(req)` in each write API handler
- Authorization boundary: server-side only — UI hides admin controls but API enforces
- Failure path: 401 → login error shown

### Main Business Flow (Public)
- Trigger: page load / search / filter
- UI: `index.html` sidebar + Leaflet map
- Service: `GET /api/businesses?region=&category=&status=`
- Persistence: Convex `businesses:list` query
- Output: markers on map + cards in sidebar

### Main Business Flow (Admin CRUD)
- Trigger: admin form submit
- UI: `#admin-view` form in `index.html`
- Service: `POST /api/businesses` (upsert) / `DELETE /api/businesses?legacyId=`
- Persistence: Convex `businesses:upsert` / `businesses:remove`
- Output: toast notification + list refresh

### Photo Upload Flow
- Trigger: admin selects photo in form
- UI: photo upload area in `index.html`
- Service: `POST /api/cloudinary-sign` → get signed params → direct upload to Cloudinary
- Persistence: Cloudinary URL stored in `businesses.photos[]`
- Output: photo preview in form

### Visitor Tracking Flow
- Trigger: page load
- Service: `POST /api/visitors` with IP, userAgent, page, city
- Persistence: Convex `visitors:add`
- Output: visitor count in admin dashboard

---

## Boundaries
- UI / Presentation: `index.html` (all CSS + HTML + JS inline)
- Client State: JS variables in `index.html` (no framework, no store)
- API / Transport: `api/*.ts` Vercel functions — REST JSON
- Domain Logic: `convex/businesses.ts`, `convex/visitors.ts`
- Persistence: Convex hosted DB
- External Services: Cloudinary (photos), Leaflet tiles (map)
- Shared Utilities: none (no shared lib folder)

---

## Integration Points
- Auth provider: none (custom Bearer token)
- Payment provider: none
- Email / SMS: none
- File storage: Cloudinary (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`)
- Search: client-side JS filter in `index.html`
- Maps / GIS: Leaflet.js + OpenStreetMap tiles
- AI / ML: none
- Analytics: custom visitor tracking
- Third-party APIs: none

---

## Key Files
- `AGENTS.md`: agent behavior and safety rules
- `SYSTEM_MAP.md`: this file — architecture navigation map
- `mcp.json`: local MCP server registry
- `index.html`: root app entry + entire frontend
- `api/businesses.ts`: main API handler (CRUD)
- `api/cloudinary-sign.ts`: photo upload auth
- `convex/schema.ts`: data model source of truth
- `convex/businesses.ts`: core business logic (queries + mutations)
- `.env.local`: runtime secrets
- `vercel.json`: routing config

---

## Data Model (convex/schema.ts)

### businesses
| Field | Type | Notes |
|-------|------|-------|
| legacyId | number | unique business ID, indexed |
| name | string | required |
| owner | string | required |
| address | string | required |
| region | string | indexed (Malang Raya, Pasuruan, etc.) |
| category | string | indexed (Penangkapan/Budidaya/P3KP/Perdagangan/Pembenihan/KPP) |
| kbli | string | KBLI code |
| kbliDesc | string | KBLI description |
| phone | string? | optional |
| lat / lng | number | coordinates for map marker |
| status | string | indexed (Terverifikasi / Proses) |
| verifiedDate | string? | optional |
| products | string? | optional |
| capacity | string? | optional |
| photos | string[] | Cloudinary URLs |
| customFields | record | dynamic key-value fields |
| updatedAt | number | timestamp |

### visitors
| Field | Type |
|-------|------|
| ip | string |
| timestamp | string |
| page | string |
| userAgent | string |
| city | string |
| createdAt | number |

---

## Critical User Journeys
- Public: load page → view map → filter by kategori/region → klik marker → lihat detail usaha
- Admin: login → tambah/edit usaha → upload foto → export data → monitor visitor
- Failure recovery: API 503 (CONVEX_URL missing) → error toast shown

---

## Deployment Map
- Environments: local (`vercel dev`), production (Vercel)
- Deployment platform: Vercel
- Build pipeline: `vercel.json` — static `index.html` + serverless `api/*.ts`
- Secret management: Vercel env vars + `.env.local` (gitignored)
- Runtime config: `CONVEX_URL`, `ADMIN_API_TOKEN`, `CLOUDINARY_*`
- Rollback path: Vercel dashboard → previous deployment

---

## Strict Exclusions
`node_modules`, `.vercel`, `dist`, `build`, `.git`, `*.lock`, `caveman/`, `lean-ctx/`, `set-up-project-v.1.0/`

---

## Token Optimization Rules
- Start from `api/businesses.ts` or `convex/businesses.ts` for most tasks
- `index.html` is 2300+ lines — use targeted search, not full read
- Avoid reading `caveman/`, `lean-ctx/`, `node_modules/` — not project source
- Use this map first for architecture or flow tracing

---

## Open Questions / Known Gaps
- No test suite currently
- `index.html` monolith — hard to maintain at scale, candidate for split
- Admin auth is single shared token — no per-user auth
- No rate limiting on API endpoints
- Visitor city detection mechanism unclear (client-sent, not server-detected)

---

## Maintenance Rule
Update when: entrypoints change, new API routes added, Convex schema changes, new integrations added.
