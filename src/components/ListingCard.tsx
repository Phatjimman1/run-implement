import { ExternalLink, Heart, Zap, Clock, Users, Flame, ImageOff, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DealScoreBadge } from "./DealScoreBadge";
import { RecommendationPill } from "./RecommendationPill";
import { HeatBadge } from "./HeatBadge";
import { HierarchyBadge } from "./HierarchyBadge";
import { ConditionCheck } from "./ConditionCheck";
import { IntelligenceDrawer } from "./intelligence/IntelligenceDrawer";
import { InteractiveCardImage } from "./intelligence/InteractiveCardImage";
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerTrigger,
} from "@/components/ui/drawer";
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
  const isHot = heatLabel === "HOT";
  const coverImage = listing.image_urls?.[0];
  // Stable hue for placeholder cover based on listing id.
  const hue = (() => {
    let h = 0;
    for (const c of listing.id) h = (h * 31 + c.charCodeAt(0)) % 360;
    return h;
  })();

  return (
    <article className="group flex flex-col rounded-2xl border border-border bg-card p-3 shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)] hover:border-primary/30">
      <div className="relative h-44 w-full overflow-hidden rounded-xl bg-muted sm:h-56">
        {coverImage ? (
          <Drawer>
            <DrawerTrigger asChild>
              <button
                type="button"
                aria-label="Öppna interaktiv bildanalys"
                className="block h-full w-full focus:outline-none"
              >
                <img
                  src={coverImage}
                  alt={listing.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                />
              </button>
            </DrawerTrigger>
            <DrawerContent className="max-h-[90vh]">
              <DrawerHeader>
                <DrawerTitle className="line-clamp-2 text-base">{listing.title}</DrawerTitle>
                <DrawerDescription>Interaktiv bildanalys — växla läge för olika overlays.</DrawerDescription>
              </DrawerHeader>
              <div className="overflow-y-auto px-4 pb-6">
                <InteractiveCardImage
                  listingId={listing.id}
                  imageUrl={coverImage}
                  title={listing.title}
                  isAuto={a?.is_auto}
                  isNumbered={(a as any)?.is_numbered}
                  parallel={a?.card_hierarchy_parallel}
                />
              </div>
            </DrawerContent>
          </Drawer>
        ) : (
          <div
            aria-label="Ingen bild tillgänglig"
            className="relative flex h-full w-full items-center justify-center overflow-hidden"
            style={{
              background: `linear-gradient(135deg, hsl(${hue} 70% 92%) 0%, hsl(${(hue + 40) % 360} 70% 86%) 100%)`,
            }}
          >
            <div className="absolute inset-0 opacity-[0.07] [background-image:radial-gradient(circle_at_1px_1px,_currentColor_1px,_transparent_0)] [background-size:14px_14px]" />
            <div className="relative flex flex-col items-center gap-1 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/70 text-foreground/70 shadow-sm backdrop-blur">
                <ImageOff className="h-5 w-5" />
              </div>
              <span className="px-2 text-[10px] font-semibold uppercase tracking-wider text-foreground/60">
                Bild saknas
              </span>
            </div>
          </div>
        )}
        {a && (
          <IntelligenceDrawer kind="score" listing={listing}>
            <button
              type="button"
              aria-label={`Visa detaljer för Deal Score ${a.deal_score}`}
              className="absolute right-2 top-2 rounded-full transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:right-3 sm:top-3"
            >
              <DealScoreBadge score={a.deal_score} size="sm" />
            </button>
          </IntelligenceDrawer>
        )}
        {isHot && (
          <IntelligenceDrawer kind="heat" listing={listing}>
            <button
              type="button"
              aria-label="Visa player heat-analys"
              className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-rec-red to-orange-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-md ring-1 ring-white/30 transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:left-3 sm:top-3 sm:px-2.5 sm:py-1 sm:text-xs"
            >
              <Flame className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> Hot
            </button>
          </IntelligenceDrawer>
        )}
      </div>

      <div className="mt-3 flex flex-1 flex-col">
          <h3 className="line-clamp-2 text-sm font-semibold leading-tight">{listing.title}</h3>
          <div className="mt-1 flex items-baseline gap-1.5 text-sm">
            <span className="font-bold text-foreground">{listing.current_price ?? "?"} kr</span>
            {listing.shipping_cost != null && <span className="text-xs text-muted-foreground">+ {listing.shipping_cost} frakt</span>}
            {timeLeft && a && (
              <IntelligenceDrawer kind="urgency" listing={listing}>
                <button type="button" aria-label="Sniper urgency" className="ml-auto text-xs text-muted-foreground underline decoration-dotted underline-offset-2 hover:text-foreground">
                  {timeLeft}
                </button>
              </IntelligenceDrawer>
            )}
          </div>
          {a && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <IntelligenceDrawer kind="recommendation" listing={listing}>
                <button type="button" aria-label="Visa rekommendations-analys" className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                  <RecommendationPill recommendation={a.recommendation} />
                </button>
              </IntelligenceDrawer>
              {heatLabel && (
                <IntelligenceDrawer kind="heat" listing={listing}>
                  <button type="button" aria-label="Visa player heat-analys" className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                    <HeatBadge label={heatLabel} trend={heatTrend} score={heatScore} />
                  </button>
                </IntelligenceDrawer>
              )}
              {a.card_hierarchy_brand && a.card_hierarchy_brand !== "UNKNOWN" && a.card_hierarchy_tier && a.card_hierarchy_tier !== "UNKNOWN" ? (
                <IntelligenceDrawer kind="hierarchy" listing={listing}>
                  <button
                    type="button"
                    aria-label="Visa card hierarchy detaljer"
                    className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <HierarchyBadge
                      brand={a.card_hierarchy_brand}
                      tier={a.card_hierarchy_tier}
                      parallel={a.card_hierarchy_parallel}
                      collectorPriority={a.collector_priority}
                    />
                  </button>
                </IntelligenceDrawer>
              ) : null}
              {a.urgency === "HIGH" && (
                <IntelligenceDrawer kind="urgency" listing={listing}>
                  <button type="button" aria-label="Sniper urgency" className="inline-flex items-center gap-0.5 rounded-full border border-rec-red/60 bg-rec-red/10 px-2 py-0.5 text-[10px] font-bold uppercase text-rec-red focus:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                    <Clock className="h-3 w-3" /> Slut snart
                  </button>
                </IntelligenceDrawer>
              )}
              {a.competition === "LOW" && (
                <span className="inline-flex items-center gap-0.5 rounded-full border border-rec-bid/60 bg-rec-bid/10 px-2 py-0.5 text-[10px] font-bold uppercase text-rec-bid">
                  <Users className="h-3 w-3" /> Låg konk.
                </span>
              )}
              {a.sniper_score >= 75 && (
                <IntelligenceDrawer kind="urgency" listing={listing}>
                  <button type="button" aria-label="Sniper analys" className="inline-flex items-center gap-0.5 rounded-full border border-amber-500 bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                    <Zap className="h-3 w-3" /> Sniper {a.sniper_score}
                  </button>
                </IntelligenceDrawer>
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

      {a && (
        <>
          {a.comp_count >= 3 && a.comp_median ? (
            <IntelligenceDrawer kind="market" listing={listing}>
              <button
                type="button"
                aria-label="Visa market anchor analys"
                className="mt-3 w-full rounded-lg border border-border bg-muted/40 p-2 text-left text-xs transition-colors hover:border-primary/40"
              >
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
                    <span className={cn("font-bold tabular-nums", a.discount_percent > 0 ? "text-rec-bid" : "text-rec-red")}>
                      {a.discount_percent > 0 ? `-${a.discount_percent}%` : `+${Math.abs(a.discount_percent)}%`}
                    </span>
                  </div>
                )}
              </button>
            </IntelligenceDrawer>
          ) : null}
          {a.reasoning && (
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{a.reasoning}</p>
          )}
          {a.risk_score >= 35 && (
            <IntelligenceDrawer kind="risk" listing={listing}>
              <button
                type="button"
                aria-label="Visa risk-analys"
                className="mt-2 inline-flex items-center gap-1 self-start rounded-full border border-rec-red/40 bg-rec-red/5 px-2 py-0.5 text-[10px] font-bold uppercase text-rec-red focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                Risk {a.risk_score}
              </button>
            </IntelligenceDrawer>
          )}
          <div className="mt-3 flex items-center justify-between gap-2">
            <IntelligenceDrawer kind="maxBid" listing={listing}>
              <button type="button" aria-label="Max bid breakdown" className="text-left transition-colors hover:text-primary focus:outline-none">
                <div className="text-xs text-muted-foreground">Maxbud</div>
                <div className="text-base font-bold tabular-nums underline decoration-dotted underline-offset-2">{a.max_bid} kr</div>
              </button>
            </IntelligenceDrawer>
            <div className="flex gap-2">
              <IntelligenceDrawer kind="education" listing={listing}>
                <Button size="sm" variant="outline" aria-label="Collector education">
                  <BookOpen className="h-4 w-4" />
                </Button>
              </IntelligenceDrawer>
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