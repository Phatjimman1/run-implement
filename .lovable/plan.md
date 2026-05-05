## NBA Card Sniper – MVP

Mobil-first webbapp som var 10:e minut skrapar Traderas söksidor efter NBA-kort, kör en regelbaserad scoringmotor och visar köprekommendationer (BUY / BID / WATCH / SKIP / RED FLAG) med maxbud och kort motivering.

Ingen inloggning i MVP – publik app. Watchlist sparas i webbläsarens localStorage.

---

### 1. Datakälla – Tradera scraping via Firecrawl

- Aktivera Lovable Cloud + Firecrawl-connector (ger `FIRECRAWL_API_KEY` server-side).
- Edge function `sync-tradera` som:
  1. Läser aktiva söktermer från `search_terms`-tabellen.
  2. För varje term: anropar Firecrawl `/v2/scrape` på `https://www.tradera.com/search?q={term}&categoryId=20` (samlarbilder) med `formats: ['html','links']`.
  3. Parsar HTML till listings (titel, pris, frakt, sluttid, bild, säljare, item-id, URL).
  4. Upsertar i `listings` på `tradera_item_id`.
  5. Kör `analyzeListing()` och upsertar `analyses`.
  6. Markerar listings som inte setts på 30 min som `ended`.
- Cron via `pg_cron` var 10:e minut.
- Manuell "Refresh"-knapp i UI som triggar samma function.
- Visa "Senast uppdaterad: HH:MM" baserat på senaste `last_run_at`.

Fallback om Firecrawl saknar credits: tydligt felmeddelande i UI + behåll cachad data.

### 2. Söktermer (seedas i DB)

Alla söktermer från spec §5.1 (Topps Chrome, Refractor, X-Fractor, Auto, Prizm, Wembanyama, Cooper Flagg, SGA, Edwards, LeBron, Kobe, Jordan, m.fl.) – redigerbara senare i admin-vy (kommer i v2).

### 3. Scoring-motor (TypeScript, körs i edge function)

Implementeras enligt spec §9–§12:
- **Titelparser** extraherar spelare, brand, set, korttyp, rookie/auto/refractor/x-fractor, numbered (`/99`, `/50`), red flag-termer, antal kort i loter ("34 refractors").
- **Spelarranking**, **brand/set-tier** och **negativa filter** som konstanter i `scoring/constants.ts`.
- Beräknar `valueScore`, `flipScore`, `holdScore`, `riskScore` → `dealScore (0-100)`.
- Översätter till `recommendation`:
  - BUY_NOW 80–100 (grön)
  - BID 65–79 (blå)
  - WATCH 50–64 (gul)
  - SKIP 25–49 (grå)
  - RED_FLAG 0–24 (röd)
- `maxBid = estimatedMarketValue * confidenceMultiplier - shipping - riskDiscount` (avrundas).
- `pricePerCard` för loter.
- Genererar 1–2 meningars motivering enligt mönstret i spec §19/§24.

### 4. Datamodell (Supabase)

- `search_terms` (id, query, active, priority, last_run_at)
- `listings` (id, tradera_item_id unique, title, url, image_urls, current_price, shipping_cost, end_time, seller_name, seller_rating, bid_count, raw_json, first_seen_at, last_seen_at, status)
- `analyses` (id, listing_id fk, detected_players[], detected_brands[], detected_sets[], detected_card_types[], is_rookie, is_auto, is_refractor, is_xfractor, is_numbered, is_insert, is_college, is_reprint_risk, deal_score, value_score, flip_score, hold_score, risk_score, recommendation, max_bid, reasoning, tags[], price_per_card, updated_at)
- RLS: båda tabellerna publik SELECT (read-only data), INSERT/UPDATE endast service role (edge function).
- `watchlist` hoppas över i MVP (localStorage istället).

### 5. Frontend (mobile-first, dark mode)

**Sidor / vyer:**
- `/` Startsida med horisontellt scrollbara sektioner:
  1. Top Deals nu (dealScore desc)
  2. Slutar snart (endTime asc, < 24h)
  3. Autos under 200 kr
  4. Refractors under 100 kr
  5. X-Fractors på stjärnor
  6. Nya senaste 10 min
  7. Red Flags / undvik (kollapsbar)
- `/listings` Full lista med sticky filterrad
- `/listings/:id` Detaljdrawer/sida med större bild, full motivering, taggar, "Öppna på Tradera"-knapp, "Lägg i watchlist"
- `/watchlist` Lokalt sparade favoriter

**Komponenter:**
- `ListingCard` – bild, titel, pris (+ frakt), tid kvar, taggar, **DealScoreBadge**, recommendation-pill, maxbud, motivering, "Öppna på Tradera".
- `DealScoreBadge` – stor cirkel 0–100, färgkodad.
- `RecommendationPill` – färgkodad enligt §13.4.
- `TagPills` – Chrome / Refractor / Auto / RC / Blue Chip / Risk / Swedish Edge etc.
- `FilterDrawer` – maxpris, slutar inom (1h/24h/alla), korttyp, spelare, tillverkare, recommendation-toggle, dölj inserts, dölj red flags, endast svenska spelare.
- `SortDropdown` – Deal Score / Slutar snart / Pris / Nyast / Flip / Hold.
- `LastUpdatedBar` – visar tid + Refresh-knapp.
- Skeleton loading.

**Designsystem:** dark mode default, HSL-tokens i `index.css`. Färgpalett: bg #0B0F14, accenter grön/blå/gul/röd för recommendation. Stora touch-ytor (min 44px). Sticky bottom-nav (Hem / Lista / Watchlist).

### 6. Affärsregler (visas i UI)

- "Osäker analys" om bilder/info saknas.
- Frakt räknas alltid in i `totalCostEstimate`.
- Aldrig "garanterat PSA 10" – bara "PSA X potential".
- Disclaimer i footer: "Endast beslutsstöd. Inga automatiska bud."

### 7. Tekniskt (för transparens)

```
sync-tradera (edge fn)  ──┐
   ▲                      │ upsert
   │ pg_cron 10 min       ▼
   │                  listings ── analyses
manual refresh btn        ▲
                          │ select
                       Frontend (React + Tanstack Query)
```

- Lovable Cloud (Supabase) för DB + edge functions + cron.
- Firecrawl-connector för scraping.
- React Query med 30s stale time + realtime subscription på `analyses` så nya deals dyker upp automatiskt.
- Inga API-nycklar i frontend.

### 8. Avgränsningar (kommer i v2)

eBay-comps, prishistorik-graf, push/Telegram-alerts, OCR/bildanalys, auth + per-user watchlist, admin-UI för söktermer/spelarranking.

### 9. Definition of Done

- Cron synkar Tradera var 10:e min ✅
- Varje listing har Deal Score + recommendation + maxbud + motivering ✅
- Red flags markeras tydligt ✅
- Filter + sortering fungerar på mobil ✅
- "Öppna på Tradera" länkar till källan ✅
- Firecrawl-nyckeln aldrig exponerad client-side ✅
