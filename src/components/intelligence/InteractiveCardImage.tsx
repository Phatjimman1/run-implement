import { useState } from "react";
import { useConditionAnalysis } from "@/hooks/useConditionAnalysis";
import { cn } from "@/lib/utils";

type Mode = "NORMAL" | "CONDITION" | "PARALLEL" | "AUTO" | "NUMBERING";

function parseRatio(r?: string): [number, number] | null {
  if (!r) return null;
  const m = r.match(/(\d+)\s*\/\s*(\d+)/);
  if (!m) return null;
  const a = parseInt(m[1], 10);
  const b = parseInt(m[2], 10);
  if (!a || !b) return null;
  return [a, b];
}

function ConditionOverlay({ centering }: { centering: any }) {
  const lr = parseRatio(centering?.leftRightRatio);
  const tb = parseRatio(centering?.topBottomRatio);
  const vCenter = lr ? (lr[0] / (lr[0] + lr[1])) * 100 : 50;
  const hCenter = tb ? (tb[0] / (tb[0] + tb[1])) * 100 : 50;
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full">
      <rect x="4" y="4" width="92" height="92" fill="none" stroke="hsl(var(--rec-bid))" strokeWidth="0.4" strokeDasharray="2 1" opacity="0.7" />
      <rect x="10" y="10" width="80" height="80" fill="none" stroke="hsl(var(--primary))" strokeWidth="0.3" opacity="0.5" />
      <line x1={vCenter} y1="0" x2={vCenter} y2="100" stroke="hsl(var(--primary))" strokeWidth="0.3" opacity="0.7" />
      <line x1="0" y1={hCenter} x2="100" y2={hCenter} stroke="hsl(var(--primary))" strokeWidth="0.3" opacity="0.7" />
      {[[4,4],[96,4],[4,96],[96,96]].map(([x,y],i) => <circle key={i} cx={x} cy={y} r="1.2" fill="hsl(var(--rec-red))" opacity="0.85" />)}
    </svg>
  );
}

function GenericMarkers({ items }: { items: { x: number; y: number; label: string; color?: string }[] }) {
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full">
      {items.map((it, i) => (
        <g key={i}>
          <circle cx={it.x} cy={it.y} r="3" fill={it.color ?? "hsl(var(--primary))"} opacity="0.85">
            <animate attributeName="r" values="3;4.5;3" dur="1.6s" repeatCount="indefinite" />
          </circle>
          <text x={it.x + 4} y={it.y + 1.5} fontSize="3.5" fill="hsl(var(--foreground))" fontWeight="700">{it.label}</text>
        </g>
      ))}
    </svg>
  );
}

export function InteractiveCardImage({
  listingId,
  imageUrl,
  title,
  isAuto,
  isNumbered,
  parallel,
}: {
  listingId: string;
  imageUrl?: string | null;
  title: string;
  isAuto?: boolean;
  isNumbered?: boolean;
  parallel?: string | null;
}) {
  const [mode, setMode] = useState<Mode>("NORMAL");
  const { data: cond } = useConditionAnalysis(listingId, mode === "CONDITION");

  if (!imageUrl) return null;

  const modes: { id: Mode; label: string; disabled?: boolean }[] = [
    { id: "NORMAL", label: "Normal" },
    { id: "CONDITION", label: "Skick" },
    { id: "PARALLEL", label: "Parallel", disabled: !parallel },
    { id: "AUTO", label: "Auto", disabled: !isAuto },
    { id: "NUMBERING", label: "#", disabled: !isNumbered },
  ];

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1">
        {modes.map((m) => (
          <button
            key={m.id}
            type="button"
            disabled={m.disabled}
            onClick={() => setMode(m.id)}
            className={cn(
              "rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide transition-colors",
              mode === m.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground hover:border-primary/50",
              m.disabled && "cursor-not-allowed opacity-40",
            )}
          >
            {m.label}
          </button>
        ))}
      </div>
      <div className="relative mx-auto inline-block w-full overflow-hidden rounded-lg border border-border bg-muted">
        <img
          src={mode === "CONDITION" && cond?.overlay_image_url ? cond.overlay_image_url : imageUrl}
          alt={title}
          className="mx-auto block max-h-72 w-full object-contain"
        />
        {mode === "CONDITION" && cond && !cond.overlay_image_url && <ConditionOverlay centering={cond.centering} />}
        {mode === "PARALLEL" && (
          <GenericMarkers items={[
            { x: 50, y: 30, label: parallel ?? "Parallel" },
            { x: 25, y: 70, label: "Refractor finish" },
          ]} />
        )}
        {mode === "AUTO" && (
          <GenericMarkers items={[{ x: 55, y: 75, label: "Auto-zon", color: "hsl(var(--rec-buy))" }]} />
        )}
        {mode === "NUMBERING" && (
          <GenericMarkers items={[{ x: 80, y: 90, label: "Serial #", color: "hsl(var(--rec-bid))" }]} />
        )}
      </div>
      {mode === "CONDITION" && !cond && (
        <p className="text-center text-xs text-muted-foreground">Kör Condition Check för att se skick-overlay.</p>
      )}
    </div>
  );
}