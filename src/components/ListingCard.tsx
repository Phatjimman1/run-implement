import { ExternalLink, Heart, Zap, Clock, Users, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DealScoreBadge } from "./DealScoreBadge";
import { RecommendationPill } from "./RecommendationPill";
import { HeatBadge } from "./HeatBadge";
import { HierarchyBadge } from "./HierarchyBadge";
import { ConditionCheck } from "./ConditionCheck";
import { formatTimeLeft } from "@/lib/recommendation";
import { ListingWithAnalysis, usePlayerHeatMap } from "@/hooks/useListings";
import { useWatchlist } from "@/hooks/useWatchlist";
import { cn } from "@/lib/utils";

// Map a warning string/object to the heuristic that contributed to the assigned tier.
function explainHeuristic(w: any, a: NonNullable<ListingWithAnalysis["analyses"]>): string {
  const raw = (typeof w === "string" ? w : w?.message ?? w?.code ?? JSON.stringify(w)) as string;
  const lower = raw.toLowerCase();
  const parts: string[] = [];
  if (lower.includes("rookie")) parts.push(`Rookie-uppgradering (Silver/Refractor → +bonus, prio HIGH).`);
  if (lower.includes("auto")) parts.push(`Auto-heuristik: kräver certified auto för full tier.`);
  if (lower.includes("number") || lower.includes("/")) parts.push(`Numbering-regel (${a.card_hierarchy_numbering ?? "okänd run"}) påverkar rank.`);
  if (lower.includes("parallel") || lower.includes("prizm") || lower.includes("refractor") || lower.includes("xfractor")) {
    parts.push(`Parallel-match: ${a.card_hierarchy_normalized_parallel ?? a.card_hierarchy_parallel ?? "okänd"} → Tier ${a.card_hierarchy_tier}.`);
  }
  if (lower.includes("brand") || lower.includes("unknown")) parts.push(`Brand-detektion osäker → tier kan vara underskattad.`);
  if (lower.includes("reprint") || lower.includes("fake") || lower.includes("custom")) parts.push(`Block-/risk-heuristik kan nedgradera tiern.`);
  if (parts.length === 0) parts.push(`Heuristik: ${a.card_hierarchy_brand ?? "?"} / ${a.card_hierarchy_normalized_parallel ?? a.card_hierarchy_parallel ?? "?"} → Tier ${a.card_hierarchy_tier} (+${a.card_hierarchy_score_bonus ?? 0}).`);
  return parts.join(" ");
}

export function ListingCard({ listing }: { listing: ListingWithAnalysis }) {
  const a = listing.analyses;
  const { isWatched, toggle } = useWatchlist();
  const watched = isWatched(listing.id);
  const total = (listing.current_price ?? 0) + (listing.shipping_cost ?? 0);
  const timeLeft = formatTimeLeft(listing.end_time);
  const heatMap = usePlayerHeatMap();
  const primaryPlayer = a?.detected_players?.[0];
  const playerHeat = primaryPlayer ? heatMap.get(primaryPlayer) : undefined;
  const heatLabel = a?.heat_label ?? playerHeat?.label ?? null;
  const heatScore = a?.heat_score ?? playerHeat?.heat_score ?? null;
  const heatTrend = playerHeat?.trend ?? null;

  return (
    <article className="rounded-2xl border border-border bg-card p-3 shadow-sm">
      <div className="flex gap-3">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-muted sm:h-28 sm:w-28">
          {listing.image_urls[0] ? (
            <img src={listing.image_urls[0]} alt={listing.title} loading="lazy" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">Ingen bild</div>
          )}
          {a && (
            <div className="absolute -bottom-2 -right-2">
              <DealScoreBadge score={a.deal_score} size="sm" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-sm font-semibold leading-tight">{listing.title}</h3>
          <div className="mt-1 flex items-baseline gap-1.5 text-sm">
            <span className="font-bold text-foreground">{listing.current_price ?? "?"} kr</span>
            {listing.shipping_cost != null && <span className="text-xs text-muted-foreground">+ {listing.shipping_cost} frakt</span>}
            {timeLeft && <span className="ml-auto text-xs text-muted-foreground">{timeLeft}</span>}
          </div>
          {a && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <RecommendationPill recommendation={a.recommendation} />
              <HeatBadge label={heatLabel} trend={heatTrend} score={heatScore} />
              <HierarchyBadge
                brand={a.card_hierarchy_brand}
                tier={a.card_hierarchy_tier}
                parallel={a.card_hierarchy_parallel}
                collectorPriority={a.collector_priority}
              />
              {a.urgency === "HIGH" && (
                <span className="inline-flex items-center gap-0.5 rounded-full border border-rec-red/60 bg-rec-red/10 px-2 py-0.5 text-[10px] font-bold uppercase text-rec-red">
                  <Clock className="h-3 w-3" /> Slut snart
                </span>
              )}
              {a.competition === "LOW" && (
                <span className="inline-flex items-center gap-0.5 rounded-full border border-rec-bid/60 bg-rec-bid/10 px-2 py-0.5 text-[10px] font-bold uppercase text-rec-bid">
                  <Users className="h-3 w-3" /> Låg konk.
                </span>
              )}
              {a.sniper_score >= 75 && (
                <span className="inline-flex items-center gap-0.5 rounded-full border border-amber-500 bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-600">
                  <Zap className="h-3 w-3" /> Sniper {a.sniper_score}
                </span>
              )}
              {a.tags.slice(0, 4).map((t) => (
                <span key={t} className={cn(
                  "rounded-full border border-border bg-secondary px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                  ["Red Flag", "Reprint Risk", "Damaged", "Overpriced"].includes(t) && "border-rec-red text-rec-red",
                  t === "Swedish Edge" && "border-rec-bid text-rec-bid",
                  ["Very Good Deal", "Good Deal"].includes(t) && "border-rec-bid text-rec-bid",
                )}>{t}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {a && (
        <>
          {a.comp_count >= 3 && a.comp_median ? (
            <div className="mt-3 rounded-lg border border-border bg-muted/40 p-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Marknad ({a.comp_count} sålda)</span>
                <span className="font-medium tabular-nums">{a.comp_low}–{a.comp_high} kr</span>
              </div>
              <div className="mt-0.5 flex items-center justify-between">
                <span className="text-muted-foreground">Median</span>
                <span className="font-bold tabular-nums">{a.comp_median} kr</span>
              </div>
              {a.discount_percent !== null && (
                <div className="mt-0.5 flex items-center justify-between">
                  <span className="text-muted-foreground">Rabatt</span>
                  <span className={cn(
                    "font-bold tabular-nums",
                    a.discount_percent > 0 ? "text-rec-bid" : "text-rec-red"
                  )}>
                    {a.discount_percent > 0 ? `-${a.discount_percent}%` : `+${Math.abs(a.discount_percent)}%`}
                  </span>
                </div>
              )}
            </div>
          ) : null}
          {a.reasoning && (
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{a.reasoning}</p>
          )}
          {a.card_hierarchy_brand && a.card_hierarchy_brand !== "UNKNOWN" && a.card_hierarchy_tier && a.card_hierarchy_tier !== "UNKNOWN" && (
            <div className="mt-2 rounded-lg border border-border bg-muted/30 p-2 text-[11px] leading-relaxed">
              <div className="font-semibold uppercase tracking-wide text-muted-foreground">Card Hierarchy</div>
              <div className="mt-0.5">
                <span className="font-medium">{a.card_hierarchy_brand === "PANINI_PRIZM" ? "Panini Prizm" : "Topps Chrome"}</span>
                {a.card_hierarchy_parallel ? ` · ${a.card_hierarchy_parallel}` : ""}
                {" "}· Tier {a.card_hierarchy_tier}
                {a.collector_priority ? ` · ${a.collector_priority}` : ""}
                {a.card_hierarchy_numbering ? ` · ${a.card_hierarchy_numbering}` : ""}
              </div>
              <div className="mt-1 flex flex-wrap gap-1">
                {a.card_hierarchy_normalized_parallel && a.card_hierarchy_normalized_parallel !== a.card_hierarchy_parallel && (
                  <span className="rounded-full border border-border bg-background px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                    norm: {a.card_hierarchy_normalized_parallel}
                  </span>
                )}
                {typeof a.card_hierarchy_rank === "number" && (
                  <span className="rounded-full border border-border bg-background px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                    rank {a.card_hierarchy_rank}
                  </span>
                )}
                {typeof a.card_hierarchy_score_bonus === "number" && a.card_hierarchy_score_bonus !== 0 && (
                  <span className={cn(
                    "rounded-full border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                    a.card_hierarchy_score_bonus > 0
                      ? "border-rec-bid/60 bg-rec-bid/10 text-rec-bid"
                      : "border-rec-red/60 bg-rec-red/10 text-rec-red",
                  )}>
                    {a.card_hierarchy_score_bonus > 0 ? `+${a.card_hierarchy_score_bonus}` : a.card_hierarchy_score_bonus} score
                  </span>
                )}
              </div>
              {a.card_hierarchy_reasoning && (
                <div className="mt-1">
                  <div className="font-semibold uppercase tracking-wide text-muted-foreground">Motivering</div>
                  <div className="text-muted-foreground">{a.card_hierarchy_reasoning}</div>
                </div>
              )}
              {Array.isArray(a.card_hierarchy_warnings_json) && a.card_hierarchy_warnings_json.length > 0 && (
                <div className="mt-1">
                  <div className="font-semibold uppercase tracking-wide text-rec-red">Varningar</div>
                  <ul className="mt-0.5 space-y-0.5 pl-0">
                    {a.card_hierarchy_warnings_json.map((w: any, i: number) => {
                      const label = typeof w === "string" ? w : (w?.message ?? w?.code ?? JSON.stringify(w));
                      return (
                        <li key={i} className="flex items-start gap-1 text-rec-red">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                className="inline-flex items-center gap-1 text-left underline decoration-dotted underline-offset-2 hover:text-rec-red/80"
                              >
                                <Info className="mt-0.5 h-3 w-3 shrink-0" />
                                <span>{label}</span>
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs text-xs leading-snug">
                              <div className="font-semibold">Heuristik bakom tiern</div>
                              <div className="mt-1 text-muted-foreground">{explainHeuristic(w, a)}</div>
                            </TooltipContent>
                          </Tooltip>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          )}
          <div className="mt-3 flex items-center justify-between gap-2">
            <div className="text-xs">
              <div className="text-muted-foreground">Maxbud</div>
              <div className="text-base font-bold tabular-nums">{a.max_bid} kr</div>
            </div>
            <div className="flex gap-2">
              <ConditionCheck listingId={listing.id} imageUrl={listing.image_urls[0]} title={listing.title} />
              <Button
                size="sm"
                variant="outline"
                onClick={() => toggle(listing.id, a?.max_bid)}
                aria-label="Bevaka"
              >
                <Heart className={cn("h-4 w-4", watched && "fill-rec-red text-rec-red")} />
              </Button>
              <Button asChild size="sm">
                <a href={listing.url} target="_blank" rel="noreferrer">
                  Tradera <ExternalLink className="ml-1 h-3.5 w-3.5" />
                </a>
              </Button>
            </div>
          </div>
        </>
      )}
    </article>
  );
}