import { cn } from "@/lib/utils";

type Props = {
  brand?: string | null;
  tier?: string | null;
  parallel?: string | null;
  collectorPriority?: string | null;
  className?: string;
};

const TIER_STYLES: Record<string, string> = {
  S: "border-amber-500 bg-amber-500/15 text-amber-600",
  A: "border-fuchsia-500 bg-fuchsia-500/15 text-fuchsia-600",
  B: "border-rec-bid bg-rec-bid/10 text-rec-bid",
  C: "border-sky-500 bg-sky-500/10 text-sky-600",
  D: "border-border bg-secondary text-foreground",
  E: "border-border bg-muted text-muted-foreground",
  F: "border-border bg-muted text-muted-foreground",
};

export function HierarchyBadge({ brand, tier, parallel, collectorPriority, className }: Props) {
  if (!brand || brand === "UNKNOWN" || !tier || tier === "UNKNOWN") return null;
  const brandLabel = brand === "PANINI_PRIZM" ? "Prizm" : brand === "TOPPS_CHROME" ? "Chrome" : brand;
  const style = TIER_STYLES[tier] ?? TIER_STYLES.D;
  return (
    <span
      title={`${brandLabel}${parallel ? ` · ${parallel}` : ""}${collectorPriority ? ` · ${collectorPriority}` : ""}`}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
        style,
        className,
      )}
    >
      {brandLabel} {tier}
      {collectorPriority === "GRAIL" && <span className="ml-0.5">· Grail</span>}
      {collectorPriority === "ELITE" && <span className="ml-0.5">· Elite</span>}
    </span>
  );
}