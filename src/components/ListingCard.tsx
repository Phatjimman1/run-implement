import { ExternalLink, Heart, Zap, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DealScoreBadge } from "./DealScoreBadge";
import { RecommendationPill } from "./RecommendationPill";
import { HeatBadge } from "./HeatBadge";
import { HierarchyBadge } from "./HierarchyBadge";
import { ConditionCheck } from "./ConditionCheck";
import { formatTimeLeft } from "@/lib/recommendation";
import { ListingWithAnalysis, usePlayerHeatMap } from "@/hooks/useListings";
import { useWatchlist } from "@/hooks/useWatchlist";
import { cn } from "@/lib/utils";

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