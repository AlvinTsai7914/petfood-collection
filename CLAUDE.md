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
- `GET /api/filters` — All filter options (brands, types, flavors, etc.)

API responses wrap in `{ success: bool, data: {...} }`. Errors use `{ success: false, error: { code, message } }`.

### Filter System

Filters sync to URL query params (`brand`, `type`, `form`, `flavor`, `age`, `func`, `special`, `page`). Logic: OR within same field, AND across fields. Clicking a product card tag adds it to the active filters.

- **Filtering is server-side**: frontend collects query params, calls API, displays results. Frontend does NOT filter data locally — this is designed for scalability (Phase 2-3: thousands of products).
- **`/api/filters` is static**: fetched once on app load and cached. It does NOT change based on current filter selections (no faceted search in Phase 1).
- **Desktop**: instant filtering with 300ms debounce — each selection change triggers API call after debounce.
- **Mobile**: Drawer with "apply" button — API call only fires on apply. Drawer opens reading from URL state; apply writes back to URL via `router.push()`.
- **URL sync**: URL always reflects the currently displayed results. `useRoute().query` serves as the source of truth for `useFetch` params.

### Key Filter Fields (in sidebar order)

1. type (cat/dog)
2. form (wet/dry)
3. age (kitten/adult/senior/all)
4. brand (dynamic from API)
5. flavor (dynamic from API)
6. functional formula (kidney/urinary/digest/skin/joint/hairball/weight)
7. special formula (grain-free/hypoallergenic)

### Component Structure (planned)

```
components/
  layout/    — AppHeader, AppFooter, AppLayout
  filter/    — FilterSidebar, FilterDrawer, FilterGroup, FilterCheckbox, FilterActiveTag
  product/   — ProductCard, ProductTag, ProductGrid, ProductNutrition
  ui/        — Pagination, LoadingSpinner, EmptyState, ErrorState
```

### Current implementation status (as of 2026-04-21)

Built and runnable via `npm run dev`:
- `tailwind.config.ts` — color / font / type-scale / radius=0 / spacing tokens
- `app.config.ts` — Nuxt UI theme override (primary=orange, gray=neutral, all components `rounded-none`)
- `assets/css/main.css` — font imports, CSS variables, `accent-bar-*` utilities, global tabular-nums
- `components/product/ProductCard.vue` — full card with ID header, meta row, functional/special tag bars, 3-color macro bars, phosphorus/calories rows, price footer
- `pages/index.vue` — demo grid (1/2/3/4 col responsive), inline active-tags bar, mock product data with picsum images
- `nuxt.config.ts` / `app.vue` / `tsconfig.json` / `.gitignore` / `package.json`

Not yet built (priority order):
1. FilterSidebar / FilterGroup / FilterCheckbox (desktop filter)
2. ActiveTags extracted into its own component
3. Pagination
4. Mock API (Nuxt server routes) — `/api/products`, `/api/filters`
5. FilterDrawer (mobile)
6. EmptyState / ErrorState / Skeleton
7. AppHeader / AppFooter + static pages (about / contact / privacy / 404)

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
| Image load failure | Fallback to `/default-product.png` via `@error` event |
| Network offline | Show "network error" message |

Use `useFetch` `default` option to provide empty fallback data, preventing SSR from crashing on API failure.

## Data Model

Product fields: id, name, brand, type, form, flavors[], age, functional[], special[], volume, price (TWD), image (URL), nutrition { protein, fat, carbs, phosphorus, calories }. All labels returned from backend in Chinese; nutrition values include units.

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
| Website name | Joint | Pending | — |
| Per-page meta descriptions | Joint | Pending | — |
| OG image design | Joint | Pending | — |
