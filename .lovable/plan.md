# Gap-Fix Implementation Plan – Strict spec compliance

Goal: extend (never replace) the existing engines so the system matches the spec sections 1–12. All work is additive; no schema migrations beyond two new columns and one new table.

## 1. Hard Block Engine (severity)
File: `supabase/functions/sync-tradera/blocking.ts`
- Replace term list with the full spec list (`wcg, 23kt, 23 kt, gold plated, reprint, custom, replica, facsimile, mystery pack, chaser pack, digital card, unofficial, proxy, novelty, fake auto`).
- Return `{ blocked, reason, severity: 'RED_FLAG' | 'HARD_BLOCK' | 'NEVER_BUY' }`.
  - `NEVER_BUY`: `wcg`, `23kt`, `gold plated`, `fake auto`, `proxy`, `replica`, `facsimile`
  - `HARD_BLOCK`: `reprint`, `custom`, `mystery pack`, `chaser pack`, `digital card`, `unofficial`, `novelty`
  - `RED_FLAG`: anything else flagged
- Migration: add column `analyses.block_severity text` (nullable).
- `sync-tradera/index.ts`: persist `block_severity`. Listings with severity in `('HARD_BLOCK','NEVER_BUY')` are excluded from Sniper, Alerts, BUY_NOW, Top Deals (filter at write time + frontend filter).

## 2. Deal Score completion
File: `scoring.ts`
- Recommendation thresholds aligned to spec:
  - `>=80 BUY_NOW`, `65–79 BID_SNIPA` (we keep enum value `BID` but render label "BID/SNIPA"), `50–64 WATCH`, `25–49 SKIP`, `<=24 RED_FLAG`.
- Add positive signals:
  - Topps Finest +10 (in addition to existing tier bonus)
  - Obsidian RPA / Auto +15
  - Legend card +10 (already partly present – ensure +10)
  - Blue chip player +20 (raise from current +20 confirm)
- Add negative signals:
  - Topps Now -10
  - College / NIL -15
  - No back photo on expensive card -10 (heuristic: `image_urls.length < 2 && totalCost > 300`)
  - Hype price -25 (heuristic: `bidCount >= 8 && totalCost > median*1.3`)
  - Poor images -15 (heuristic: `image_urls.length === 0`)
- `ScoreInput` extended with `imageCount` and (optional) `compMedian` so signals can fire. Index.ts passes them.

## 3. Market Anchor
File: `supabase/functions/sync-tradera/comps.ts`
- Extend `applyMarketAnchor` to return shape matching spec: `{ estimatedValue, medianValue, priceRange:[low,high], discountPercent, confidence, marketBonus, marketTags }`.
- Scoring deltas:
  - `price < median * 0.6` → +30
  - `price < median * 0.75` → +20
  - `price < median * 0.9` → +10
  - `price > median * 1.2` → -20

## 4. Player Heat
File: `comps.ts` (`recomputePlayerHeat`) + `useListings.ts` type.
- Ensure label set is exactly `HOT|WARM|COOL|COLD` and trend `UP|STABLE|DOWN`. Already mostly there; verify thresholds and persist `score` field name alignment (DB column `heat_score` stays).

## 5. Sniper Mode hardening
File: `comps.ts` `computeSniper`
- Require `dealScore > 70 AND totalCost < 300 AND cardType ∈ {auto, refractor, rookie} AND timeLeft < 2h` to give a sniper boost / mark as Sniper. If conditions not met → `sniperScore` capped at <75.
- Index passes `cardTypes` flags.

## 6. Alert Engine
File: `index.ts`
- Trigger exactly `dealScore >= 80 AND total < maxBid AND timeLeft < 30min` (already present – keep). Block if severity in HARD_BLOCK/NEVER_BUY (currently only checks `blocked`; add severity gate).

## 7. Dashboard expansion
File: `src/pages/Dashboard.tsx`
- Add metric cards: total recommendations, successful deals, avg ROI (already), missed deals, sniper hit rate, recommendation quality, best/worst search terms, best/worst categories (brand), false positives, false negatives.
- Definitions:
  - successful deals = portfolio items where `sold_price > total_cost`
  - missed deals = alerts with `read=false` and listing already ended
  - sniper hit rate = portfolio items with `analyses.sniper_score >= 75` that became wins / total such
  - recommendation quality = % BUY_NOW that became wins
  - best/worst categories = brand grouping by avg deal_score
  - false positives = BUY_NOW that ended with sold_price < total_cost
  - false negatives = SKIP/RED_FLAG that later sold higher (best-effort using market_comps)
- Implemented with one combined query hook `useDashboardStats`.

## 8. Exit Strategy
File: `src/lib/exitStrategy.ts`
- Extend return type to spec:
  ```ts
  { platform: 'EBAY'|'TRADERA', expectedRange:[number,number], strategy:'AUCTION'|'BUY_NOW'|'LOT'|'HOLD', reasoning: string }
  ```
- Strategy logic: lots → `LOT`; value > 1000 & blue chip → `HOLD`; value > 300 → `AUCTION`; else `BUY_NOW`. Rename `reason`→`reasoning` (update Portfolio page).

## 9. Condition Engine completion
Files: `supabase/functions/analyze-condition/index.ts`, `src/components/ConditionCheck.tsx`
- AI prompt extended to also return `image_quality.checks: { glare, blur, angle, crop, sleeve, reflection }` (each `NONE|MILD|SEVERE`). Persist into existing `image_quality` jsonb.
- `ConditionCheck` UI: add overlay panel on the image with:
  - detected card boundary box (from AI: `centering` provides ratios → approximate via percentage borders)
  - vertical & horizontal center lines
  - border guide
  - corner markers
  Implemented as absolutely positioned SVG overlay over the existing `<img>`.
- New badges row showing the six image-quality checks.

## 10. Filters
File: `src/pages/Listings.tsx`
- Add filter controls (chips/selects): card type (Auto / Refractor / Rookie), player (datalist from analyses), brand, auto-only, refractor-only, hide red flags (exists), Swedish edge, blue chip only, ending soon.
- All filters in same sticky bar, horizontally scrollable on mobile.

## 11. Sorting
File: `src/pages/Listings.tsx`
- Sort options: Deal Score, Sniper Score, Ending Soon, Lowest Price, Newest, Best Flip, Best Hold.

## 12. Mobile UX
- Sticky filter bar already in place; verify horizontal scroll on small viewports.
- Loading skeletons already used; add to Dashboard sections.
- "Last updated" timestamp added in `TopBar` from `useLastSync` (already exists – ensure visible).
- Drawer-based detail: ConditionCheck is already a drawer; add a generic listing detail drawer trigger from `ListingCard`.

## Database changes
Single migration:
```sql
ALTER TABLE public.analyses ADD COLUMN IF NOT EXISTS block_severity text;
```
No table additions needed for dashboard metrics – computed client-side from existing tables.

## Out of scope (explicit)
- No auth changes (single-user mode preserved).
- No new tables for analytics; metrics derived live.
- No rewrite of working parsers, comp ingestion, or Tradera scrape pipeline.

## Files touched (summary)
Backend
- `supabase/functions/sync-tradera/blocking.ts`
- `supabase/functions/sync-tradera/scoring.ts`
- `supabase/functions/sync-tradera/comps.ts`
- `supabase/functions/sync-tradera/index.ts`
- `supabase/functions/analyze-condition/index.ts`
- new migration adding `block_severity`

Frontend
- `src/hooks/useListings.ts` (type extension)
- `src/pages/Listings.tsx` (filters + sorts)
- `src/pages/Dashboard.tsx` (expanded metrics)
- `src/lib/exitStrategy.ts`
- `src/pages/Portfolio.tsx` (rename `reason` → `reasoning`, show `strategy`)
- `src/components/ConditionCheck.tsx` (overlay + quality checks)
- `src/components/TopBar.tsx` (verify last-updated visible)

## Definition of done
- All 12 spec sections implemented.
- No existing working test breaks; sync-tradera still upserts listings/analyses; ConditionCheck still runs.
- HARD_BLOCK / NEVER_BUY listings never appear in Sniper, Alerts, BUY_NOW, or Top Deals.
- Dashboard renders all 11 metrics without errors even when portfolio is empty.
