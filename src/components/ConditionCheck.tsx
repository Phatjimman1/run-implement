import { Microscope, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerTrigger,
} from "@/components/ui/drawer";
import { useConditionAnalysis, useRunConditionAnalysis } from "@/hooks/useConditionAnalysis";
import { cn } from "@/lib/utils";

function parseRatio(r?: string): [number, number] | null {
  if (!r) return null;
  const m = r.match(/(\d+)\s*\/\s*(\d+)/);
  if (!m) return null;
  const a = parseInt(m[1], 10);
  const b = parseInt(m[2], 10);
  if (!a || !b) return null;
  return [a, b];
}

function CardOverlay({ centering }: { centering: any }) {
  const lr = parseRatio(centering?.leftRightRatio);
  const tb = parseRatio(centering?.topBottomRatio);
  // Approximate inner-card boundary as a small inset; adjust horizontal/vertical
  // center lines based on detected ratios.
  const vCenter = lr ? (lr[0] / (lr[0] + lr[1])) * 100 : 50;
  const hCenter = tb ? (tb[0] / (tb[0] + tb[1])) * 100 : 50;
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-0 h-full w-full"
    >
      {/* Card boundary */}
      <rect x="4" y="4" width="92" height="92" fill="none" stroke="hsl(var(--rec-bid))" strokeWidth="0.4" strokeDasharray="2 1" opacity="0.7" />
      {/* Border guide (inner) */}
      <rect x="10" y="10" width="80" height="80" fill="none" stroke="hsl(var(--primary))" strokeWidth="0.3" opacity="0.5" />
      {/* Vertical center */}
      <line x1={vCenter} y1="0" x2={vCenter} y2="100" stroke="hsl(var(--primary))" strokeWidth="0.3" opacity="0.7" />
      {/* Horizontal center */}
      <line x1="0" y1={hCenter} x2="100" y2={hCenter} stroke="hsl(var(--primary))" strokeWidth="0.3" opacity="0.7" />
      {/* Corner markers */}
      {[
        [4, 4],
        [96, 4],
        [4, 96],
        [96, 96],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="1.2" fill="hsl(var(--rec-red))" opacity="0.85" />
      ))}
    </svg>
  );
}

function QualityCheck({ name, level }: { name: string; level?: string }) {
  const lvl = (level ?? "NONE").toUpperCase();
  const color =
    lvl === "SEVERE" ? "border-rec-red text-rec-red" :
    lvl === "MILD"   ? "border-amber-500 text-amber-600" :
                       "border-rec-bid text-rec-bid";
  return (
    <span className={cn("rounded-full border bg-background px-2 py-0.5 text-[10px] font-semibold uppercase", color)}>
      {name}: {lvl}
    </span>
  );
}

function Row({ label, score, lbl, issues }: { label: string; score?: number; lbl?: string; issues?: string[] }) {
  return (
    <div className="rounded-lg border border-border p-2.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold">{label}</span>
        <span className="tabular-nums text-muted-foreground">{score ?? "-"} · {lbl ?? "-"}</span>
      </div>
      {issues && issues.length > 0 && (
        <ul className="mt-1 list-inside list-disc text-[11px] text-muted-foreground">
          {issues.slice(0, 4).map((i, idx) => <li key={idx}>{i}</li>)}
        </ul>
      )}
    </div>
  );
}

export function ConditionCheck({ listingId, imageUrl, title }: { listingId: string; imageUrl?: string; title: string }) {
  const { data, isLoading } = useConditionAnalysis(listingId);
  const run = useRunConditionAnalysis();
  const a = data;

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button size="sm" variant="outline" aria-label="Condition check">
          <Microscope className="h-4 w-4" />
          {a && <span className="ml-1 text-[10px] font-bold tabular-nums">{a.condition_score}</span>}
        </Button>
      </DrawerTrigger>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader>
          <DrawerTitle className="line-clamp-2 text-base">{title}</DrawerTitle>
          <DrawerDescription>Visuell skickanalys – ej en garanti för PSA-grade.</DrawerDescription>
        </DrawerHeader>
        <div className="overflow-y-auto px-4 pb-6">
          {imageUrl && (
            <div className="relative mx-auto mb-3 inline-block w-full">
              <img
                src={a?.overlay_image_url || imageUrl}
                alt={title}
                className="mx-auto block max-h-64 rounded-lg border border-border object-contain"
              />
              {a && !a.overlay_image_url && <CardOverlay centering={a.centering} />}
            </div>
          )}
          {!a && (
            <div className="flex flex-col items-center gap-3 py-6">
              <p className="text-center text-sm text-muted-foreground">
                Ingen analys ännu. Kör Condition Check för att bedöma centrering, hörn, kanter och yta.
              </p>
              <Button
                onClick={() => run.mutate(listingId)}
                disabled={run.isPending || isLoading || !imageUrl}
              >
                {run.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyserar…</> : "Analysera bild"}
              </Button>
            </div>
          )}
          {a && (
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-lg bg-muted p-3">
                <div>
                  <div className="text-xs text-muted-foreground">Skick</div>
                  <div className="text-2xl font-bold tabular-nums">{a.condition_score}</div>
                  <div className="text-xs font-semibold uppercase">{a.condition_label}</div>
                </div>
                <div className="text-right text-xs">
                  <div className={cn("font-bold uppercase", a.psa_potential === "PSA_10_POTENTIAL" && "text-rec-bid")}>{a.psa_potential.replace(/_/g, " ")}</div>
                  <div className="text-muted-foreground">Confidence: {a.confidence}</div>
                  <div className="mt-1 text-[10px] font-semibold uppercase">{a.condition_advice.replace(/_/g, " ")}</div>
                </div>
              </div>
              <Row label="Centrering" score={a.centering?.score} lbl={`${a.centering?.label ?? ""} ${a.centering?.leftRightRatio ?? ""} | ${a.centering?.topBottomRatio ?? ""}`} issues={a.centering?.explanation ? [a.centering.explanation] : []} />
              <Row label="Hörn" score={a.corners?.score} lbl={a.corners?.label} issues={a.corners?.issues} />
              <Row label="Kanter" score={a.edges?.score} lbl={a.edges?.label} issues={a.edges?.issues} />
              <Row label="Yta" score={a.surface?.score} lbl={a.surface?.label} issues={a.surface?.issues} />
              <Row label="Bildkvalitet" score={a.image_quality?.score} lbl={a.image_quality?.label} issues={a.image_quality?.issues} />
              {a.image_quality?.checks && (
                <div className="flex flex-wrap gap-1.5 rounded-lg border border-border p-2">
                  <QualityCheck name="Glare" level={a.image_quality.checks.glare} />
                  <QualityCheck name="Blur" level={a.image_quality.checks.blur} />
                  <QualityCheck name="Angle" level={a.image_quality.checks.angle} />
                  <QualityCheck name="Crop" level={a.image_quality.checks.crop} />
                  <QualityCheck name="Sleeve" level={a.image_quality.checks.sleeve} />
                  <QualityCheck name="Reflection" level={a.image_quality.checks.reflection} />
                </div>
              )}
              {a.explanation && <p className="rounded-lg bg-muted/50 p-2 text-xs text-muted-foreground">{a.explanation}</p>}
              {Array.isArray(a.warnings) && a.warnings.length > 0 && (
                <div className="rounded-lg border border-rec-red/40 bg-rec-red/10 p-2 text-xs">
                  <div className="mb-1 flex items-center gap-1 font-semibold text-rec-red"><AlertTriangle className="h-3 w-3" /> Varningar</div>
                  <ul className="list-inside list-disc">{a.warnings.map((w: string, i: number) => <li key={i}>{w}</li>)}</ul>
                </div>
              )}
              <Button variant="outline" size="sm" className="w-full" disabled={run.isPending} onClick={() => run.mutate(listingId)}>
                {run.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Kör om…</> : "Kör om analys"}
              </Button>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
