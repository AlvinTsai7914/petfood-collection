# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Pet Food Product Database — a filterable, browsable pet food product database website targeting the Taiwan market. Users can compare brands, flavors, nutritional content, and prices across pet food products. Phase 1 focuses on wet food (主食罐) with hundreds of entries; future phases expand to dry food, treats, and thousands of products.

Spec document: `pet-food-db-spec-v1.7.docx`

## Tech Stack

- **Frontend framework**: Nuxt 3 + Vue 3 (SSR for product listing, SSG for static pages)
- **Styling**: Tailwind CSS
- **UI components**: Nuxt UI (100+ components, Tailwind-integrated)
- **State management**: Vue composables (no Pinia in Phase 1). Filter/pagination state lives in URL query params. Product data fetched via `useFetch`.
- **Backend API**: Nuxt Server Routes or FastAPI (TBD by backend team)
- **Database**: TBD by backend team

## Design System

Editorial minimal direction — deliberately differentiated from the typical rounded + colorful pet shop aesthetic. Feels closer to editorial magazine / Substack / Linear / data catalog. Decided 2026-04-20.

### Core rules
- **`border-radius: 0` everywhere.** Cards, buttons, inputs, tags, images, drawers, modals all sharp corners. Nuxt UI components overridden to `rounded-none` in `app.config.ts`.
- **No shadows.** Use 1px `neutral-200` borders to layer; hover darkens to `neutral-400`, no translate.
- **Grayscale base + 3-accent system.** Accents are markers (2px bars, thin horizontal bars, colored numbers) — never large solid fills like `bg-orange-500`.

### Color accent semantics
| Accent | Hex | Used on |
|--------|-----|---------|
| `accent-primary` (orange) | `#f97316` | Main CTA, price, special-formula tag left bar, **protein** macro bar |
| `accent-secondary` (teal) | `#14b8a6` | Functional-formula tag left bar, **carb** macro bar |
| `accent-tertiary` (violet) | `#7c3aed` | **Fat** macro bar |
| `danger` | `#dc2626` | Error states only |

Token values, neutral scale, type scale and font families live in `tailwind.config.ts` + `assets/css/main.css` — treat those files as source of truth.

### Typography
- `font-sans`: Inter + Noto Sans TC (body, UI, labels)
- `font-mono`: JetBrains Mono (all numbers, product IDs, units, tabular data)
- Tabular nums enabled globally via `font-feature-settings: 'tnum' on` in `html`

### Type scale (tokens in `tailwind.config.ts`)
`text-h1` 32/40 bold · `text-h2` 24/32 semibold · `text-h3` 18/28 semibold · `text-body` 15/24 · `text-small` 13/20 · `text-caption` 12/16.

### Data display conventions
- **Product IDs** rendered as `PROD-XXX` — mono, uppercase, `tracking-widest`, `neutral-400`. Stored raw as `prod_001`; formatted in component.
- **All numbers use `font-mono` + `tabular-nums`** — nutrition values, volume, price, IDs.
- **Macronutrient bars** (protein / fat / carbs): reference max varies by food form (wet food 15%, dry food 45%, treat 60%; see `MACRO_MAX_BY_FORM` in `ProductCard.vue`) because wet food macros are diluted by water content while dry/treat are not. Applicable max is displayed as `/ XX% max` label above the bars. Bar height `h-1`, each macronutrient has its dedicated accent color (see table above). Note: Phase 2+ cross-form comparison (e.g. mixing wet and dry in one filter result) will render bars on different scales — consider dry-matter normalization when that becomes a real use case.
- **Phosphorus / calories** shown as label-value rows below macros — value prominent mono, unit `text-[10px]` gray.
- **Price** — mono number in `accent-primary`; `NT$` prefix in `font-sans` neutral to create data/context contrast.
- **Meta row** (type / form / age / flavor on card) — plain text separated by middot `·`, no backgrounds.
- **Functional-formula tags** — 2px teal left bar (`.accent-bar-secondary` utility in `main.css`).
- **Special-formula tags** — 2px orange left bar (`.accent-bar-primary`).

## Build & Dev Commands

```bash
npm install            # Install dependencies
npm run dev            # Start dev server (default: http://localhost:3000)
npm run build          # Build for production
npm run preview        # Preview production build locally
npx nuxi generate     # Generate static pages (SSG)
```

## Architecture

### Rendering Strategy

| Page | Mode | Reason |
|------|------|--------|
| `/` (homepage + product list) | SSR | Dynamic filters, large dataset, SEO |
| `/about`, `/contact`, `/privacy`, `404` | SSG | Static content |

First page load uses SSR (Nuxt server calls API, renders full HTML). Subsequent filter/page interactions use CSR (browser JS calls API directly, updates DOM). This is Nuxt 3 `useFetch` default behavior — no extra config needed.

### API Endpoints

- `GET /api/products` — Product listing with filtering & pagination (24 per page)
- `GET /api/products/{id}` — Single product for the detail page (mock route + page built; live backend has no such endpoint yet, see backend-issues #13)
- `GET /api/filters` — All filter options (5 + 1 groups per alignment doc §2.3)

API responses wrap in `{ success: bool, data: {...} }`. Errors use `{ success: false, error: { code, message } }`.

**Live-proxy switch**: setting `NUXT_LIVE_API=1` (mapped via `runtimeConfig.liveApi`) makes all three server routes proxy the live backend at `feedradar-production.up.railway.app` instead of serving the local mock — useful for previewing real data. Default (unset) serves the mock. Live `/api/filters` was intermittently 500 as of 2026-08-04; the proxy degrades to `success: false` so the UI falls back to empty filter options.

### Filter System

Filters sync to URL query params (`petType`, `form`, `age`, `brand`, `ingredient`, `excludeIngredient`, `isPrescription`, `page`). Logic: OR within same field, AND across fields; `excludeIngredient` is AND-NOT; `isPrescription` is a boolean toggle (`true` or absent). Clicking a product card tag (brand / petType / form / age) adds it to the active filters. `utils/filter-state.ts` (`parseFilterQuery` / `toQueryParams`) is the only URL boundary.

- **Filtering is server-side**: frontend collects query params, calls API, displays results. Frontend does NOT filter data locally — this is designed for scalability (Phase 2-3: thousands of products).
- **`/api/filters` is static**: fetched once on app load and cached. It does NOT change based on current filter selections (no faceted search in Phase 1).
- **Desktop**: instant filtering with 300ms debounce — each selection change triggers API call after debounce.
- **Mobile**: Drawer with "apply" button — API call only fires on apply. Drawer opens reading from URL state; apply writes back to URL via `router.push()`.
- **URL sync**: URL always reflects the currently displayed results. `useRoute().query` serves as the source of truth for `useFetch` params.

### Key Filter Fields (in sidebar order; "5 + 1" per alignment doc §2.3)

1. petType (cat/dog)
2. form (wet/dry)
3. age (kitten/adult/senior/all — enum still disputed with live backend, see backend-issues #2)
4. brand (dynamic from API; Chinese label doubles as value in Phase 1)
5. ingredient — include (OR) / exclude (AND NOT) dual lists backed by the backend-governed ingredient dictionary; matched by substring against `ingredientsText` (SQL LIKE semantics)
6. isPrescription — boolean toggle (the "+1")

The pre-alignment fields flavor / functional / special were removed from Phase 1 (kept as always-empty schema placeholders in the API).

### Component Structure (planned)

```
components/
  layout/    — AppHeader, AppFooter, AppLayout
  filter/    — FilterSidebar, FilterDrawer, FilterGroup, FilterCheckbox, FilterActiveTag
  product/   — ProductCard, ProductTag, ProductGrid, ProductNutrition
  ui/        — Pagination, LoadingSpinner, EmptyState, ErrorState
```

### Current implementation status (as of 2026-08-05)

**Backend-v2 contract alignment (completed 2026-08-05; work started 2026-07-21):**
- `composables/useApi.ts` — normalizer layer: backend v2 shape → frontend `Product` / `FilterOptions` models; `useFilters` / `useProducts` / `useProduct` composables (useAsyncData + $fetch). UI never touches raw backend fields.
- `utils/filter-state.ts` — rewritten to the 5 + 1 model (`MULTI_FILTER_KEYS` + `isPrescription` toggle); added `toQueryParams` as the write-side URL boundary.
- `components/filter/IngredientFilter.vue` — ingredient include/exclude dual lists (dropdown + chips; exclude uses danger bar + line-through).
- `components/filter/FilterToggle.vue` — reusable boolean toggle (prescription now; grain-free etc. later).
- `ProductCard.vue` — structured nutrition numbers (no string parsing), hardcoded enum labels, `PROD-{n}` ids, prescription tag, `images[0]` preview.
- `server/utils/catalog.ts` — mock rebuilt to v2 shape (integer ids, `ingredientsText` raw string, ingredient dictionary, structured nutrition, `findProduct` for detail).
- `server/api/products/[id].get.ts` — detail mock route wired to `findProduct` (NOT_FOUND business error for missing ids).
- Live-proxy switch `NUXT_LIVE_API=1` on all three server routes (see API Endpoints above).

**Detail page (F16, completed 2026-08-14):**
- `pages/products/[id].vue` — display strategy adjusted per backend-issues v3 attribution analysis: `nutritionText` raw string is the primary guaranteed-analysis display (highest data coverage, 88-93%), structured fields render as supplementary rows (null rows omitted); images render in a scroll-snap horizontal swiper (touch/trackpad, no dependency) with thumbnail navigation and an n-of-total counter shown only when `images.length > 1` (live currently has one image per product); `ingredientsText` as a plain paragraph, no chip interaction (§2.4/§3.0); conditional feedingGuide / origin / sourceUrl sections appear automatically once the backend supplies them.
- `utils/product-labels.ts` — shared enum→Chinese label maps (extracted from ProductCard).
- `Product` model extended with `nutritionText` / `sourceUrl` (maps live top-level `url`) / `feedingGuide` / `origin`; mock synthesizes `nutritionText` from structured fields.
- ProductCard is fully clickable via a stretched link (absolute-inset NuxtLink); tag-filter buttons sit above it at z-10 so they still add filters instead of navigating.

### Pre-alignment status (as of 2026-04-27)

**Built and runnable via `npm run dev`:**

Foundation
- `tailwind.config.ts` — color / font / type-scale / radius=0 / spacing tokens
- `app.config.ts` — Nuxt UI theme override (primary=orange, gray=neutral, all components `rounded-none`)
- `assets/css/main.css` — font imports, CSS variables, `accent-bar-*` utilities, global tabular-nums, body overflow lock
- `utils/filter-state.ts` — shared `FILTER_KEYS` / `FilterState` type / `emptyFilterState` / `cloneFilterState` / `countSelected` / `parseFilterQuery` (auto-imported)

Server (mock)
- `server/utils/catalog.ts` — 30 mock products + label maps + `buildOptions` + `queryProducts` (filter/paginate)
- `server/api/filters.get.ts` — returns spec §5.4 filter options with global counts
- `server/api/products.get.ts` — server-side filtering + pagination + slug→label transform per §5.3

Layout / app shell
- `app.vue` — `<NuxtLayout><NuxtPage /></NuxtLayout>` mount
- `layouts/default.vue` — sticky-footer pattern wrapping AppHeader + slot + AppFooter (used by static pages)
- `components/layout/AppHeader.vue` — `compact` prop drives the scroll-shrink state; uses NuxtLink (auto-import name: `<LayoutAppHeader>`)
- `components/layout/AppFooter.vue` — logotype + version + nav + spec §9.4 disclaimer (auto-import name: `<LayoutAppFooter>`)

Product listing
- `pages/index.vue` — opts out of default layout via `definePageMeta({ layout: false })`; full-height flex with independent sidebar/main scrollbars; URL-driven filter state with 300ms debounce; sticky shrinking header
- `components/product/ProductCard.vue` — full card with ID header, meta row, functional/special tag bars, 3-color macro bars (form-aware MACRO_MAX), phosphorus/calories rows, price footer; **null-safe**: handles `null` for price, volume, image, and any nutrition field per the API contract

Filters
- `components/filter/FilterCheckbox.vue` — accessible custom checkbox using absolute-overlay pattern (avoids sr-only focus-scroll bug)
- `components/filter/FilterGroup.vue` — single filter category with `>10` show-more toggle
- `components/filter/FilterSidebar.vue` — desktop sidebar with all 7 spec groups; auto-import name: `<FilterSidebar>`
- `components/filter/FilterDrawer.vue` — mobile bottom-sheet with staging state + apply/clear footer (commits filters only on apply per spec §4.2)
- `components/filter/FilterActiveTag.vue` — single removable chip used by both sticky bars

UI states
- `components/ui/Pagination.vue` — center-on-current truncation (`<UiPagination>`)
- `components/ui/ProductSkeleton.vue` — animated placeholder (`<UiProductSkeleton>`)
- `components/ui/EmptyState.vue` — 「NO RESULTS」editorial layout (`<UiEmptyState>`)
- `components/ui/ErrorState.vue` — 「ERROR」layout with retry callback (`<UiErrorState>`)

Static pages (placeholder copy in `text-neutral-500` for easy find-and-replace)
- `pages/about.vue` — about + 資料來源 + 免責聲明
- `pages/contact.vue` — email + 社群 + 問題回報
- `pages/privacy.vue` — 收集 / cookie / 第三方 / 聯絡(待 tracking 決定後補完)
- `error.vue` (root) — 自訂 404/5xx 頁,大字號狀態碼

Documentation
- `docs/API.md` — backend handoff (550 lines): endpoints, query semantics, slug dictionary governance, null contract, **§10 live-backend discrepancy log**, **§11 detail-page proposed fields**

**Not yet built:**
1. SEO basics — `public/robots.txt` + sitemap module + global default `useSeoMeta`
2. Live-backend cutover — proxy switch exists (`NUXT_LIVE_API=1`) but defaulting to live blocks on backend fixing backend-issues-260515 P0s (#0 intermittent 500s, #13 missing detail endpoint, #3 ingredientsText, plus scope decision on wet food)
3. (Spec §17) Website name / per-page meta description / OG image — joint decision pending

### Responsive Design

- Mobile (<768px): single column cards (image left), filter via bottom Drawer (80% height)
- Tablet (768-1024px): 2-column grid, sidebar filter
- Desktop (>1024px): 3-4 column grid, sidebar filter

### Loading States

- Initial load: skeleton cards (3-4 placeholders)
- Filter/page change: keep old data with fade overlay
- No results: EmptyState with clear-filter button
- API error: ErrorState with retry button

### Error Handling Strategy

| Scenario | Handling |
|----------|----------|
| SSR API failure | Return HTTP 200 with empty product list + ErrorState component (never throw 500) |
| CSR API failure (filter/page) | Keep previous data visible, show error toast via Nuxt UI `useToast()` |
| API returns `success: false` | Treat as business error, same as CSR failure |
| Image load failure or `image: null` | Replace `<img>` with `NO IMAGE` placeholder via `imageErrored` ref; never falls back to a 404'ing path that loops |
| Network offline | Show "network error" message |

Use `useFetch` `default` option to provide empty fallback data, preventing SSR from crashing on API failure.

## Data Model

Frontend `Product` model (see `composables/useApi.ts`, the source of truth): id (int), title, brand, petType, form, age (nullable), volume, price (TWD), priceSource, priceUpdatedAt, images[], ingredientsText (raw label string, never parsed by frontend), isPrescription, isGrainFree (Phase 2 placeholder), functional[] (Phase 2 placeholder), nutrition { proteinPct, fatPct, fiberPct, carbsPct, phosphorusPct, caloriesKcalPerKg } — all numbers, all nullable. Enum → Chinese labels are hardcoded in the frontend (closed sets); brand is Chinese and doubles as filter value.

## Important Conventions

- All API field keys are in English; Chinese labels are provided by the backend via `*Label` fields or `{ value, label }` pairs in filter options
- Filter options with >10 items show first 10 + "show more" button (mainly affects brand and flavor)
- Images: Phase 1 uses external URLs with `@error` fallback to placeholder. Need to verify actual URLs from backend are not blocked by hotlink protection before relying on external images.
- Cache: `/api/filters` 1hr, `/api/products` 5min
- Security: product list page uses SSR so API calls happen server-side (not exposed to browser)

## Pending Backend Decisions / Open Questions

Items the backend team or joint decision needs to resolve. Mirrors spec v1.7 §17 plus items discovered during frontend buildout.

| Item | Owner | Status | Notes |
|------|-------|--------|-------|
| Database choice (PostgreSQL / MongoDB / other) | Backend | Pending | — |
| API stack (Nuxt Server Routes vs FastAPI) | Backend | Pending | — |
| Crawler update frequency (daily / weekly / manual) | Backend | Pending | — |
| Standardized value lists for brands / flavors / functional formulas | Backend | Pending | Frontend filter option values depend on this |
| Add `moisture` field to `nutrition` object | Backend | **Proposed 2026-04-21** | Enables dry-matter-basis (DMB) conversion so protein/fat/carb bars can be compared fairly across wet (≈75% water) and dry (≈10% water) products. Phase 1 (wet-only) uses form-aware macro max and does not strictly need this, but Phase 2+ results that mix wet + dry will render bars on different scales and become misleading without DMB. Low crawl cost — moisture is standard on all pet food "guaranteed analysis" labels. |
| **Live-backend contract gaps (`flavor` mis-used as ingredients, `id` integer vs string, `special` returns slug, images all null)** | Backend | **Logged 2026-04-26** | See `docs/API.md` §10 for full table. Three are ship-blocking: rename `flavor` → `ingredients` + add real `flavors[]`; return Chinese labels for `special`/`functional`; align `id` type. Frontend will mirror live shape once resolved. |
| **Detail-page extension fields** (`ingredients`, `images[]`, `feedingGuide`, `origin`, `guaranteedAnalysis`, `sourceUrl`, optional `slug`) | Backend | **Proposed 2026-04-26** | See `docs/API.md` §11. `ingredients` highest priority — backend already scrapes the data, just placed it in the wrong field. `images[]` replaces the singular `image` for both list and detail. |
| Website name | Joint | Pending | — |
| Per-page meta descriptions | Joint | Pending | — |
| OG image design | Joint | Pending | — |
