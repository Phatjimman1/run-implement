import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { parseTraderaHtml } from "./parser.ts";
import { scoreListing } from "./scoring.ts";
import {
  buildSignature,
  lookupComps,
  applyMarketAnchor,
  computeSniper,
  lookupHeat,
  heatScoringDelta,
  recomputePlayerHeat,
  ingestEndedAsComp,
} from "./comps.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FIRECRAWL_URL = "https://api.firecrawl.dev/v2/scrape";

interface SearchTerm { id: string; query: string; }

// Tradera-kategori 1001059 = Basketkort (NBA m.fl.)
const BASKETBALL_CARDS_CATEGORY = 1001059;

async function scrapeTradera(query: string, apiKey: string): Promise<string | null> {
  const url = `https://www.tradera.com/search?q=${encodeURIComponent(query)}&categoryId=${BASKETBALL_CARDS_CATEGORY}`;
  const res = await fetch(FIRECRAWL_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url,
      formats: ["html"],
      onlyMainContent: false,
      waitFor: 1500,
    }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    console.error(`Firecrawl ${res.status} for "${query}":`, txt.slice(0, 300));
    return null;
  }
  const data = await res.json();
  return data?.data?.html ?? data?.html ?? null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
  if (!FIRECRAWL_API_KEY) {
    return new Response(JSON.stringify({ error: "FIRECRAWL_API_KEY not configured" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  let body: { limit?: number; query?: string } = {};
  try { body = await req.json(); } catch (_) { /* GET / cron */ }

  // Fetch active search terms (limit per run to stay under timeouts)
  const { data: terms, error: termsErr } = body.query
    ? { data: [{ id: "manual", query: body.query }] as SearchTerm[], error: null as any }
    : await supabase
        .from("search_terms")
        .select("id, query")
        .eq("active", true)
        .order("last_run_at", { ascending: true, nullsFirst: true })
        .limit(body.limit ?? 6);

  if (termsErr) {
    return new Response(JSON.stringify({ error: termsErr.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let listingsUpserted = 0;
  let analysesUpserted = 0;
  const errors: string[] = [];

  for (const term of terms ?? []) {
    try {
      const html = await scrapeTradera(term.query, FIRECRAWL_API_KEY);
      if (!html) {
        errors.push(`scrape failed: ${term.query}`);
        continue;
      }
      const parsed = parseTraderaHtml(html);
      console.log(`[${term.query}] parsed ${parsed.length} listings`);

      for (const item of parsed) {
        // upsert listing
        const { data: listing, error: lErr } = await supabase
          .from("listings")
          .upsert({
            tradera_item_id: item.traderaItemId,
            title: item.title,
            url: item.url,
            image_urls: item.imageUrls,
            current_price: item.currentPrice,
            shipping_cost: item.shippingCost,
            end_time: item.endTime?.toISOString() ?? null,
            bid_count: item.bidCount,
            seller_name: item.sellerName,
            status: "active",
            last_seen_at: new Date().toISOString(),
          }, { onConflict: "tradera_item_id" })
          .select("id")
          .single();
        if (lErr || !listing) {
          errors.push(`upsert listing ${item.traderaItemId}: ${lErr?.message}`);
          continue;
        }
        listingsUpserted++;

        const score = scoreListing({
          title: item.title,
          currentPrice: item.currentPrice,
          shippingCost: item.shippingCost,
          endTime: item.endTime,
          bidCount: item.bidCount,
        });

        // Market Anchor (comps)
        const signature = buildSignature(score);
        const comp = await lookupComps(supabase, score);
        const totalCost = (item.currentPrice ?? 0) + (item.shippingCost ?? 0);
        const market = applyMarketAnchor(totalCost, comp);

        // Player Heat
        const primaryPlayer = score.players[0];
        const heat = await lookupHeat(supabase, primaryPlayer);
        const heatDelta = heatScoringDelta(heat?.label ?? null);

        // Adjusted deal score with market + heat signals
        const adjustedDealScore = Math.max(0, Math.min(100, score.dealScore + market.marketBonus + heatDelta));
        const sniper = computeSniper({
          dealScore: adjustedDealScore,
          totalCost,
          endTime: item.endTime,
          bidCount: item.bidCount,
        });

        const extraTags = [...market.marketTags];
        if (heat?.label === "HOT") extraTags.push("Hot Player");
        if (heat?.label === "COLD") extraTags.push("Cold Player");

        const { error: aErr } = await supabase
          .from("analyses")
          .upsert({
            listing_id: listing.id,
            detected_players: score.players,
            detected_brands: score.brands,
            detected_sets: score.sets,
            detected_card_types: score.cardTypes,
            is_rookie: score.isRookie,
            is_auto: score.isAuto,
            is_certified_auto: score.isCertifiedAuto,
            is_refractor: score.isRefractor,
            is_xfractor: score.isXFractor,
            is_numbered: score.isNumbered,
            is_insert: score.isInsert,
            is_college: score.isCollege,
            is_reprint_risk: score.isReprintRisk,
            is_damaged: score.isDamaged,
            numbered_print_run: score.numberedPrintRun,
            card_count: score.cardCount,
            price_per_card: score.pricePerCard,
            value_score: score.valueScore,
            flip_score: score.flipScore,
            hold_score: score.holdScore,
            risk_score: score.riskScore,
            deal_score: adjustedDealScore,
            recommendation: score.recommendation,
            max_bid: score.maxBid,
            estimated_market_value: comp.median > 0 ? comp.median : score.estimatedMarketValue,
            reasoning: score.reasoning,
            tags: [...score.tags, ...extraTags],
            card_signature: signature,
            comp_median: comp.median || null,
            comp_low: comp.low || null,
            comp_high: comp.high || null,
            comp_count: comp.count,
            comp_confidence: comp.confidence,
            discount_percent: market.discountPercent,
            sniper_score: sniper.sniperScore,
            urgency: sniper.urgency,
            competition: sniper.competition,
            heat_score: heat?.score ?? null,
            heat_label: heat?.label ?? null,
            updated_at: new Date().toISOString(),
          }, { onConflict: "listing_id" });
        if (aErr) errors.push(`upsert analysis: ${aErr.message}`);
        else analysesUpserted++;
      }

      if (term.id !== "manual") {
        await supabase.from("search_terms").update({ last_run_at: new Date().toISOString() }).eq("id", term.id);
      }
    } catch (e) {
      errors.push(`${term.query}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  // Mark stale listings as ended and harvest comps from final prices
  const cutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString();
  const { data: ending } = await supabase
    .from("listings")
    .select("id")
    .lt("last_seen_at", cutoff)
    .eq("status", "active")
    .limit(500);
  for (const row of ending ?? []) {
    await ingestEndedAsComp(supabase, row.id);
  }
  await supabase.from("listings").update({ status: "ended" })
    .lt("last_seen_at", cutoff)
    .eq("status", "active");

  // Refresh player heat aggregates
  let heatUpdated = 0;
  try { heatUpdated = await recomputePlayerHeat(supabase); } catch (e) { errors.push(`heat: ${e}`); }

  return new Response(JSON.stringify({
    ok: true,
    termsRun: terms?.length ?? 0,
    listingsUpserted,
    analysesUpserted,
    compsIngested: ending?.length ?? 0,
    playerHeatUpdated: heatUpdated,
    errors: errors.slice(0, 10),
  }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});