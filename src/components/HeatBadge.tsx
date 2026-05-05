import { Flame, Snowflake, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

type Label = "HOT" | "WARM" | "COOL" | "COLD";
type Trend = "UP" | "STABLE" | "DOWN";

const labelStyles: Record<Label, string> = {
  HOT: "border-rec-red/60 bg-rec-red/10 text-rec-red",
  WARM: "border-amber-500/60 bg-amber-500/10 text-amber-600",
  COOL: "border-sky-500/60 bg-sky-500/10 text-sky-600",
  COLD: "border-slate-400/60 bg-slate-400/10 text-slate-500",
};

const labelIcon: Record<Label, JSX.Element | null> = {
  HOT: <Flame className="h-3 w-3" />,
  WARM: null,
  COOL: null,
  COLD: <Snowflake className="h-3 w-3" />,
};

export function HeatBadge({
  label,
  trend,
  score,
  size = "sm",
}: {
  label: Label | null | undefined;
  trend?: Trend | null;
  score?: number | null;
  size?: "sm" | "md";
}) {
  if (!label) return null;
  const TrendIcon = trend === "UP" ? TrendingUp : trend === "DOWN" ? TrendingDown : Minus;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-bold uppercase tracking-wide",
        labelStyles[label],
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
      )}
      title={trend ? `Trend ${trend.toLowerCase()}` : undefined}
    >
      {labelIcon[label]}
      <span>{label}</span>
      {score != null && <span className="opacity-70">{score}</span>}
      {trend && <TrendIcon className="h-3 w-3" />}
    </span>
  );
}