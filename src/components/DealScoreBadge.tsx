import { dealScoreColor } from "@/lib/recommendation";
import { cn } from "@/lib/utils";

export function DealScoreBadge({ score, size = "md" }: { score: number; size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: "h-10 w-10 text-sm",
    md: "h-14 w-14 text-lg",
    lg: "h-20 w-20 text-2xl",
  };
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full border-2 font-bold tabular-nums bg-card shadow-[var(--shadow-card)]",
        sizes[size],
        dealScoreColor(score),
      )}
    >
      {score}
    </div>
  );
}