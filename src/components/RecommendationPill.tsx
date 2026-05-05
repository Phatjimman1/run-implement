import { Recommendation, RECOMMENDATION_COLORS, RECOMMENDATION_LABEL } from "@/lib/recommendation";
import { cn } from "@/lib/utils";

export function RecommendationPill({ recommendation }: { recommendation: string }) {
  const r = (recommendation as Recommendation) ?? "WATCH";
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wide", RECOMMENDATION_COLORS[r])}>
      {RECOMMENDATION_LABEL[r]}
    </span>
  );
}