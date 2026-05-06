// Market Anchor (Comps Engine) + Sniper Score + Heat integration
import { ParsedTitle } from "./scoring.ts";

export interface CompMatch {
  median: number;
  low: number;
  high: number;
  count: number;
  confidence: "HIGH" | "MED" | "LOW";
  signature: string;
}

/** Build a stable card signature for matching comps. */
export function buildSignature(p: ParsedTitle): string {
  const player = (p.players[0] ?? "unknown").toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const set = (p.sets[0] ?? p.brands[0] ?? "generic").toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const flags = [
    p.isRookie ? "rc" : "",
    p.isAuto ? "auto" : "",
    p.isRefractor ? "ref" : "",
    p.isXFractor ? "xfr" : "",
    p.isNumbered ? "num" : "",
  ].filter(Boolean).join("-") || "base";
  return `${player}|${set}|${flags}`;
}

/** Looser signatures used in tiered fallback matching. */
export function fallbackSignatures(p: ParsedTitle): string[] {
  const player = (p.players[0] ?? "unknown").toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const flags = [
    p.isAuto ? "auto" : "",
    p.isRefractor ? "ref" : "",
    p.isRookie ? "rc" : "",
  ].filter(Boolean).join("-") || "base";
  return [
    `${player}|*|${flags}`, // same player + similar type
    `${player}|*|*`,        // same player fallback
  ];
}

function median(nums: number[]): number {
  const s = [...nums].sort((a, b) => a - b);
  const n = s.length;
  if (n === 0) return 0;
  return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
}

/** Look up comps with tiered fallback. supabase: SupabaseClient */
export async function lookupComps(supabase: any, p: ParsedTitle): Promise<CompMatch> {
  const exact = buildSignature(p);
  const tiers = [exact, ...fallbackSignatures(p)];
  for (let i = 0; i < tiers.length; i++) {
    const sig = tiers[i];
    let q = supabase
      .from("market_comps")
      .select("sale_price, shipping_cost")
      .order("sold_at", { ascending: false })
      .limit(10);
    if (sig.includes("*")) {
      // pattern: "player|*|flags" or "player|*|*"
      const [player] = sig.split("|");
      q = q.eq("player", player.replace(/-/g, " "));
    } else {
      q = q.eq("card_signature", sig);
    }
    const { data } = await q;
    if (!data || data.length < 3) continue;
    const prices = data.map((r: any) => Number(r.sale_price) + Number(r.shipping_cost ?? 0)).filter((n: number) => n > 0);
    if (prices.length < 3) continue;
    const conf: CompMatch["confidence"] = i === 0 && prices.length >= 5 ? "HIGH" : i === 0 ? "MED" : "LOW";
    return {
      median: Math.round(median(prices)),
      low: Math.round(Math.min(...prices)),
      high: Math.round(Math.max(...prices)),
      count: prices.length,
      confidence: conf,
      signature: exact,
    };
  }
  return { median: 0, low: 0, high: 0, count: 0, confidence: "LOW", signature: exact };
}

export interface MarketAdjust {
  discountPercent: number | null;
  marketBonus: number;
  marketTags: string[];
}

/** Returns scoring delta + tags based on comps vs current price. */
export function applyMarketAnchor(totalCost: number, comp: CompMatch): MarketAdjust {
  if (comp.count < 3 || comp.median <= 0 || totalCost <= 0) {
    return { discountPercent: null, marketBonus: 0, marketTags: [] };
  }
  const ratio = totalCost / comp.median;
  const discountPercent = Math.round((1 - ratio) * 100);
  let bonus = 0;
  const tags: string[] = [];
  if (ratio < 0.6) { bonus += 30; tags.push("Very Good Deal"); }
  else if (ratio < 0.75) { bonus += 20; tags.push("Good Deal"); }
  else if (ratio < 0.9) { bonus += 10; tags.push("Fair Deal"); }
  else if (ratio > 1.2) { bonus -= 20; tags.push("Overpriced"); }
  return { discountPercent, marketBonus: bonus, marketTags: tags };
}

export interface SniperResult {
  sniperScore: number;
  urgency: "LOW" | "MED" | "HIGH";
  competition: "LOW" | "MED" | "HIGH";
}

export function computeSniper(args: {
  dealScore: number;
  totalCost: number;
  endTime: Date | null;
  bidCount: number | null;
  isAuto?: boolean;
  isRefractor?: boolean;
  isRookie?: boolean;
}): SniperResult {
  const { dealScore, totalCost, endTime, bidCount } = args;
  const eligibleType = !!(args.isAuto || args.isRefractor || args.isRookie);
  let urgencyBonus = 0;
  let urgency: SniperResult["urgency"] = "LOW";
  let minsLeft = Infinity;
  if (endTime) {
    minsLeft = (endTime.getTime() - Date.now()) / 60000;
    if (minsLeft > 0 && minsLeft < 15) { urgencyBonus = 20; urgency = "HIGH"; }
    else if (minsLeft > 0 && minsLeft < 60) { urgencyBonus = 15; urgency = "HIGH"; }
    else if (minsLeft > 0 && minsLeft < 120) { urgencyBonus = 10; urgency = "MED"; }
  }
  const bids = bidCount ?? 0;
  let compBonus = 0;
  let competition: SniperResult["competition"] = "MED";
  if (bids === 0) { compBonus = 15; competition = "LOW"; }
  else if (bids < 3) { compBonus = 10; competition = "LOW"; }
  else if (bids > 10) { compBonus = -10; competition = "HIGH"; }

  let pricePenalty = 0;
  if (totalCost > 500) pricePenalty = 15;
  else if (totalCost > 300) pricePenalty = 5;

  let sniperScore = Math.max(0, Math.min(100, Math.round(dealScore + urgencyBonus + compBonus - pricePenalty)));
  // Spec: full Sniper status requires dealScore>70, price<300, eligible card type, timeLeft<2h
  const fullSniperEligible =
    dealScore > 70 && totalCost > 0 && totalCost < 300 && eligibleType && minsLeft < 120;
  if (!fullSniperEligible && sniperScore >= 75) sniperScore = 74;
  return { sniperScore, urgency, competition };
}

export interface HeatInfo {
  score: number;
  label: "HOT" | "WARM" | "COOL" | "COLD";
  trend: "UP" | "STABLE" | "DOWN";
}

/** Pulls cached heat for a player. */
export async function lookupHeat(supabase: any, player: string | undefined): Promise<HeatInfo | null> {
  if (!player) return null;
  const { data } = await supabase
    .from("player_heat")
    .select("heat_score, label, trend")
    .eq("player", player)
    .maybeSingle();
  if (!data) return null;
  return { score: data.heat_score, label: data.label, trend: data.trend };
}

export function heatScoringDelta(label: HeatInfo["label"] | null | undefined): number {
  switch (label) {
    case "HOT": return 10;
    case "WARM": return 5;
    case "COOL": return 0;
    case "COLD": return -10;
    default: return 0;
  }
}

/** Recompute and upsert player_heat from recent comps + active listings. */
export async function recomputePlayerHeat(supabase: any): Promise<number> {
  // Pull recent comps grouped by player (last 30 days) and prior 30-60 days
  const now = Date.now();
  const d30 = new Date(now - 30 * 86400_000).toISOString();
  const d60 = new Date(now - 60 * 86400_000).toISOString();

  const { data: recent } = await supabase
    .from("market_comps")
    .select("player, sale_price, sold_at")
    .gte("sold_at", d30)
    .not("player", "is", null);
  const { data: prior } = await supabase
    .from("market_comps")
    .select("player, sale_price, sold_at")
    .gte("sold_at", d60)
    .lt("sold_at", d30)
    .not("player", "is", null);

  // Active listings count per player from analyses joined to listings
  const { data: activeRows } = await supabase
    .from("analyses")
    .select("detected_players, listings!inner(status)")
    .eq("listings.status", "active")
    .limit(2000);

  const activeMap = new Map<string, number>();
  for (const r of activeRows ?? []) {
    for (const p of (r.detected_players ?? []) as string[]) {
      activeMap.set(p, (activeMap.get(p) ?? 0) + 1);
    }
  }

  const recentMap = new Map<string, number[]>();
  for (const r of recent ?? []) {
    const list = recentMap.get(r.player) ?? [];
    list.push(Number(r.sale_price));
    recentMap.set(r.player, list);
  }
  const priorMap = new Map<string, number[]>();
  for (const r of prior ?? []) {
    const list = priorMap.get(r.player) ?? [];
    list.push(Number(r.sale_price));
    priorMap.set(r.player, list);
  }

  const players = new Set<string>([
    ...recentMap.keys(),
    ...priorMap.keys(),
    ...activeMap.keys(),
  ]);

  const rows: any[] = [];
  for (const player of players) {
    const r = recentMap.get(player) ?? [];
    const pr = priorMap.get(player) ?? [];
    const recentAvg = r.length ? r.reduce((a, b) => a + b, 0) / r.length : null;
    const priorAvg = pr.length ? pr.reduce((a, b) => a + b, 0) / pr.length : null;
    let trendDelta = 10;
    let trend: HeatInfo["trend"] = "STABLE";
    if (recentAvg !== null && priorAvg !== null && priorAvg > 0) {
      const change = (recentAvg - priorAvg) / priorAvg;
      if (change > 0.1) { trendDelta = 20; trend = "UP"; }
      else if (change < -0.1) { trendDelta = -10; trend = "DOWN"; }
    }
    const listingFreq = Math.min(40, (activeMap.get(player) ?? 0) * 4);
    const demand = Math.min(40, r.length * 5); // recent sale count proxy
    const score = Math.max(0, Math.min(100, Math.round(trendDelta * 0.4 + listingFreq * 0.3 + demand * 0.3 + 50)));
    let label: HeatInfo["label"] = "COOL";
    if (score > 70) label = "HOT";
    else if (score >= 50) label = "WARM";
    else if (score >= 30) label = "COOL";
    else label = "COLD";
    rows.push({
      player,
      heat_score: score,
      trend,
      label,
      sample_size: r.length + pr.length,
      recent_avg_price: recentAvg,
      prior_avg_price: priorAvg,
      active_listing_count: activeMap.get(player) ?? 0,
      updated_at: new Date().toISOString(),
    });
  }
  if (rows.length) {
    await supabase.from("player_heat").upsert(rows, { onConflict: "player" });
  }
  return rows.length;
}

/** When a listing transitions to ended, persist its final price as a comp. */
export async function ingestEndedAsComp(supabase: any, listingId: string): Promise<void> {
  const { data: l } = await supabase
    .from("listings")
    .select("id, title, current_price, shipping_cost, bid_count, end_time")
    .eq("id", listingId)
    .maybeSingle();
  if (!l || !l.current_price) return;
  const { data: a } = await supabase
    .from("analyses")
    .select("card_signature, detected_players, detected_brands, detected_sets, detected_card_types, is_rookie, is_auto, is_refractor, is_numbered")
    .eq("listing_id", listingId)
    .maybeSingle();
  if (!a || !a.card_signature) return;

  await supabase.from("market_comps").upsert({
    card_signature: a.card_signature,
    player: a.detected_players?.[0] ?? null,
    brand: a.detected_brands?.[0] ?? null,
    set_name: a.detected_sets?.[0] ?? null,
    card_type: (a.detected_card_types ?? []).join(","),
    is_rookie: a.is_rookie,
    is_auto: a.is_auto,
    is_refractor: a.is_refractor,
    is_numbered: a.is_numbered,
    sale_price: l.current_price,
    shipping_cost: l.shipping_cost,
    bid_count: l.bid_count,
    source: "tradera",
    source_listing_id: l.id,
    sold_at: l.end_time ?? new Date().toISOString(),
    raw_title: l.title,
  }, { onConflict: "source,source_listing_id" });
}