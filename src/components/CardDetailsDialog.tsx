import { ReactNode } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ListingWithAnalysis } from "@/hooks/useListings";
import { cn } from "@/lib/utils";
import { Info } from "lucide-react";

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

type Mode = "deal" | "hierarchy";

export function CardDetailsDialog({
  listing,
  mode,
  children,
}: {
  listing: ListingWithAnalysis;
  mode: Mode;
  children: ReactNode;
}) {
  const a = listing.analyses;
  if (!a) return <>{children}</>;
  const title = mode === "deal" ? `Deal Score · ${a.deal_score}` : `Card Hierarchy · Tier ${a.card_hierarchy_tier ?? "?"}`;
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <div className="line-clamp-2 text-xs text-muted-foreground">{listing.title}</div>

          {mode === "deal" && (
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2 text-xs">
                <Stat label="Deal" value={a.deal_score} />
                <Stat label="Sniper" value={a.sniper_score} />
                <Stat label="Risk" value={a.risk_score} />
                <Stat label="Value" value={a.value_score} />
                <Stat label="Flip" value={a.flip_score} />
                <Stat label="Hold" value={a.hold_score} />
              </div>
              <div className="rounded-lg border border-border bg-muted/40 p-2 text-xs">
                <div className="flex justify-between"><span className="text-muted-foreground">Maxbud</span><span className="font-bold tabular-nums">{a.max_bid} kr</span></div>
                {a.estimated_market_value != null && (
                  <div className="flex justify-between"><span className="text-muted-foreground">Marknadsvärde</span><span className="font-bold tabular-nums">{a.estimated_market_value} kr</span></div>
                )}
                {a.discount_percent != null && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rabatt</span>
                    <span className={cn("font-bold tabular-nums", a.discount_percent > 0 ? "text-rec-buy" : "text-rec-red")}>
                      {a.discount_percent > 0 ? `-${a.discount_percent}%` : `+${Math.abs(a.discount_percent)}%`}
                    </span>
                  </div>
                )}
                <div className="flex justify-between"><span className="text-muted-foreground">Urgency</span><span className="font-medium">{a.urgency}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Konkurrens</span><span className="font-medium">{a.competition}</span></div>
              </div>
              {a.reasoning && <p className="text-xs leading-relaxed text-muted-foreground">{a.reasoning}</p>}
            </div>
          )}

          {mode === "hierarchy" && (
            <div className="space-y-2">
              <div className="rounded-lg border border-border bg-muted/40 p-2 text-xs">
                <div className="font-medium">
                  {a.card_hierarchy_brand === "PANINI_PRIZM" ? "Panini Prizm" : a.card_hierarchy_brand === "TOPPS_CHROME" ? "Topps Chrome" : a.card_hierarchy_brand ?? "Okänt brand"}
                  {a.card_hierarchy_parallel ? ` · ${a.card_hierarchy_parallel}` : ""}
                  {" "}· Tier {a.card_hierarchy_tier ?? "?"}
                  {a.collector_priority ? ` · ${a.collector_priority}` : ""}
                </div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {a.card_hierarchy_normalized_parallel && a.card_hierarchy_normalized_parallel !== a.card_hierarchy_parallel && (
                    <span className="rounded-full border border-border bg-background px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                      norm: {a.card_hierarchy_normalized_parallel}
                    </span>
                  )}
                  {a.card_hierarchy_numbering && (
                    <span className="rounded-full border border-border bg-background px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                      {a.card_hierarchy_numbering}
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
                        ? "border-rec-buy/60 bg-rec-buy/10 text-rec-buy"
                        : "border-rec-red/60 bg-rec-red/10 text-rec-red",
                    )}>
                      {a.card_hierarchy_score_bonus > 0 ? `+${a.card_hierarchy_score_bonus}` : a.card_hierarchy_score_bonus} score
                    </span>
                  )}
                </div>
              </div>
              {a.card_hierarchy_reasoning && (
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Motivering</div>
                  <p className="text-xs text-muted-foreground">{a.card_hierarchy_reasoning}</p>
                </div>
              )}
              {Array.isArray(a.card_hierarchy_warnings_json) && a.card_hierarchy_warnings_json.length > 0 && (
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-rec-red">Varningar</div>
                  <ul className="mt-1 space-y-1.5">
                    {a.card_hierarchy_warnings_json.map((w: any, i: number) => {
                      const label = typeof w === "string" ? w : (w?.message ?? w?.code ?? JSON.stringify(w));
                      return (
                        <li key={i} className="rounded-md border border-rec-red/30 bg-rec-red/5 p-2 text-xs">
                          <div className="flex items-start gap-1.5 font-medium text-rec-red">
                            <Info className="mt-0.5 h-3 w-3 shrink-0" />
                            <span>{label}</span>
                          </div>
                          <div className="mt-1 pl-4 text-[11px] text-muted-foreground">{explainHeuristic(w, a)}</div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-border bg-muted/40 px-2 py-1.5 text-center">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-sm font-bold tabular-nums">{value}</div>
    </div>
  );
}