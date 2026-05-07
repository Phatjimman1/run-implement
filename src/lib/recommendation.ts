export type Recommendation = "BUY_NOW" | "BID_SNIPA" | "WATCH" | "SKIP" | "RED_FLAG";

export const RECOMMENDATION_LABEL: Record<Recommendation, string> = {
  BUY_NOW: "BUY NOW",
  BID_SNIPA: "BID/SNIPA",
  WATCH: "WATCH",
  SKIP: "SKIP",
  RED_FLAG: "RED FLAG",
};

export const RECOMMENDATION_COLORS: Record<Recommendation, string> = {
  BUY_NOW: "text-white shadow-[0_4px_12px_hsl(var(--rec-buy)/0.35)] [background:var(--gradient-buy)]",
  BID_SNIPA: "text-white shadow-[var(--shadow-glow-bid)] [background:var(--gradient-bid)]",
  WATCH: "bg-rec-watch text-white shadow-sm",
  SKIP: "bg-secondary text-muted-foreground border border-border",
  RED_FLAG: "border border-rec-red/60 bg-rec-red/10 text-rec-red",
};

export function dealScoreColor(score: number): string {
  if (score >= 80) return "text-rec-buy border-rec-buy";
  if (score >= 65) return "text-rec-bid border-rec-bid";
  if (score >= 50) return "text-rec-watch border-rec-watch";
  if (score >= 25) return "text-rec-skip border-rec-skip";
  return "text-rec-red border-rec-red";
}

export function formatTimeLeft(endTime: string | null): string | null {
  if (!endTime) return null;
  const ms = new Date(endTime).getTime() - Date.now();
  if (ms <= 0) return "Slut";
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} h`;
  return `${Math.floor(hours / 24)} d`;
}