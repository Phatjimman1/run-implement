import { usePlayerHeat } from "@/hooks/useListings";
import { HeatBadge } from "./HeatBadge";
import { Skeleton } from "@/components/ui/skeleton";

export function PlayerHeatStrip() {
  const { data, isLoading } = usePlayerHeat();
  if (isLoading) {
    return (
      <section className="space-y-2 px-4">
        <h2 className="text-base font-bold">📊 Player Heat Index</h2>
        <Skeleton className="h-20 w-full" />
      </section>
    );
  }
  const players = (data ?? []).filter((p) => p.sample_size > 0 || p.active_listing_count > 0).slice(0, 12);
  if (players.length === 0) return null;

  return (
    <section className="space-y-2">
      <div className="px-4">
        <h2 className="text-base font-bold">📊 Player Heat Index</h2>
        <p className="text-xs text-muted-foreground">Trend de senaste 30 dagarna</p>
      </div>
      <div className="flex gap-2 overflow-x-auto px-4 pb-2 scrollbar-hide">
        {players.map((p) => {
          const change = p.recent_avg_price && p.prior_avg_price
            ? Math.round(((p.recent_avg_price - p.prior_avg_price) / p.prior_avg_price) * 100)
            : null;
          const summary = change === null
            ? `${p.active_listing_count} aktiva`
            : `${change > 0 ? "+" : ""}${change}% snittpris`;
          return (
            <div
              key={p.player}
              className="min-w-[160px] shrink-0 rounded-xl border border-border bg-card p-3 shadow-sm"
            >
              <div className="line-clamp-1 text-sm font-semibold">{p.player}</div>
              <div className="mt-1.5">
                <HeatBadge label={p.label} trend={p.trend} score={p.heat_score} />
              </div>
              <div className="mt-1.5 text-[11px] text-muted-foreground tabular-nums">
                {summary} · {p.sample_size} sålda
              </div>
              {p.recent_avg_price != null && (
                <div className="text-[11px] text-muted-foreground tabular-nums">
                  snitt {Math.round(p.recent_avg_price)} kr
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}