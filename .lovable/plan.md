# Implementation Plan

Big restructure — keeping all visual design, theme, typography, animations untouched. Only data, routing, navigation, and feature logic change.

## 1. New Catalog Data (`src/data/catalog.ts`)

New file (leave `src/data/site.ts` alone except where products are consumed). Structure:

```ts
type Tier = "regular" | "premium";
type SubCategory = { slug; name; tier?: Tier; products: Product[] };
type Category = { slug; name; image; hasTiers: boolean; regular?: SubCategory[]; premium?: SubCategory[]; items?: SubCategory[] };
```

All 10 categories from the brief encoded with their subcategories. Each subcategory gets 2–4 placeholder products (reusing existing category images) so listings aren't empty. Products carry `id, name, categorySlug, subSlug, tier, fabric, gsm, price, images[6], colors[], description, material`.

## 2. Routing (`src/App.tsx`)

Add routes (existing ones kept):
- `/category/:cat` → tier picker (or subcategory list if no tiers)
- `/category/:cat/:tier` → subcategory grid (tier ∈ regular|premium)
- `/category/:cat/:tier/:sub` → product listing
- `/category/:cat/:sub` → listing for tier-less cats (accessories, joining kits, arrheniux)
- `/product/:id` (existing) — reads from new catalog
- `/auth` (existing)

`Category.tsx` rewritten to branch on URL depth. New small page components: `CategoryTiers.tsx`, `SubcategoryList.tsx`, `ProductList.tsx` — all styled with existing tokens (cream, ink, font-display).

## 3. Mega Menu (`src/components/Navbar.tsx` + new `MegaMenu.tsx`)

Hover trigger on "Categories" nav item. Panel layout:

```text
┌─────────────┬──────────────┬──────────────────────┐
│ Categories  │ Regular /    │ Subcategories        │
│ (vertical)  │ Premium      │ (links to listing)   │
└─────────────┴──────────────┴──────────────────────┘
```

Three columns; left selects category (hover), middle shows tier tabs, right shows subcategories. Tier-less categories collapse middle column. Uses existing border/ink/cream tokens — no new theme.

Mobile: accordion fallback inside existing mobile sheet.

## 4. Product Details (`src/pages/ProductDetail.tsx` rewrite, same look)

- Left: main image + 6-thumbnail gallery (vertical strip on desktop, horizontal scroll on mobile). Click thumb → swaps main.
- Right: name, description, material, colors (if present).
- **Per-size quantity table** — XS S M L XL XXL 3XL, each row with `[-] qty [+]`. Total auto-calculated.
- MOQ banner = 20. Order button disabled with helper text when total < 20.
- WhatsApp message includes product name + each selected size + qty per size + total + note "Send your custom logo as next message".
- Share row: "Share via WhatsApp" (wa.me with product URL), "Copy Product Link" (navigator.clipboard + toast).
- Login gate: if not logged in, Order button routes to `/auth?next=<current path>` instead.

## 5. Latest Collection

`Releases.tsx` removed from `Index.tsx`. Add `LatestCollection.tsx` showing last 9 products from catalog (sorted by `addedAt` desc, fallback to array order).

## 6. Factory Page additions

Append three sections to existing Factory section content — `WhoWeAre`, `WhatWeDo`, `WhyDifferent`. Card grid with lucide icons, existing border/ink palette, subtle hover animation (`transition-transform`). No theme changes.

## 7. Reviews

- Rename "Reviews"/"ClientReactions" heading to **Client Reactions**.
- Convert to CSS-keyframe horizontal marquee (right→left, infinite, pause on hover). Duplicate list for seamless loop.
- New `ReviewForm.tsx` — fields: rating (1–5 stars), subject (Company/Product/Service), text. Submitted reviews stored in `authStore` (`reviews[]` in localStorage) and merged into the marquee. Submission requires login → otherwise redirect `/auth?next=/#reviews`.

## 8. Auth gating

Helper in `authStore`: `requireAuth(navigate, currentPath)` → if no user, navigate `/auth?next=...`. `Auth.tsx` reads `next` query param and redirects there after login/signup (admins still go to `/admin`).

Used only by: PDP Order button, Review submit. All other pages remain public.

## 9. Files

**New:** `src/data/catalog.ts`, `src/components/MegaMenu.tsx`, `src/components/sections/LatestCollection.tsx`, `src/components/sections/WhyWhatWho.tsx`, `src/components/ReviewForm.tsx`, `src/pages/CategoryTiers.tsx`, `src/pages/SubcategoryList.tsx`, `src/pages/ProductList.tsx`.

**Edited:** `src/App.tsx` (routes), `src/components/Navbar.tsx` (mega menu hook-in), `src/pages/ProductDetail.tsx` (size matrix, share, login gate), `src/pages/Index.tsx` (swap Releases→LatestCollection, append Why/What/Who to Factory area), `src/components/sections/Reviews.tsx` or `ClientReactions.tsx` (marquee + form), `src/lib/authStore.ts` (reviews CRUD + requireAuth + `next` redirect support), `src/pages/Auth.tsx` (honor `?next=`).

**Untouched:** index.css, tailwind.config, all UI primitives, Footer, Hero, Logo, all visual tokens.

## 10. Notes / non-goals

- OAuth stays demo (per earlier decision) — Google/Facebook buttons keep current behavior.
- Product images: each product reuses its category hero image 6× as gallery placeholders until real images are supplied.
- No backend changes — still localStorage-based.

Confirm and I'll build it in one pass.
