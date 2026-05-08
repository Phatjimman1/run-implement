import { ReactNode } from "react";
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerTrigger,
} from "@/components/ui/drawer";
import { ListingWithAnalysis } from "@/hooks/useListings";
import { getEducation } from "@/lib/education";
import { cn } from "@/lib/utils";
import {
  TrendingUp, TrendingDown, Minus, AlertTriangle, Info, Flame, Snowflake,
  Target, Trophy, Gauge, Clock, BookOpen, Coins, ShieldAlert,
} from "lucide-react";

export type DrawerKind =
  | "score" | "recommendation" | "heat" | "hierarchy"
  | "market" | "risk" | "maxBid" | "urgency" | "education";

const KIND_META: Record<DrawerKind, { title: string; icon: any; desc: string }> = {
  score: { title: "Deal Score Breakdown", icon: Gauge, desc: "Vad som driver poängen för denna listning." },
  recommendation: { title: "Rekommendation", icon: Target, desc: "Varför vi rekommenderar detta." },
  heat: { title: "Player Heat", icon: Flame, desc: "Spelarens marknadstrend." },
  hierarchy: { title: "Card Hierarchy", icon: Trophy, desc: "Brand, parallel & samlarprio." },
  market: { title: "Market Anchor", icon: Coins, desc: "Marknadsvärdering vs sålda kort." },
  risk: { title: "Risk Analysis", icon: ShieldAlert, desc: "Detekterade risker." },
  maxBid: { title: "Max Bid Breakdown", icon: Coins, desc: "Hur maxbudet räknas fram." },
  urgency: { title: "Sniper Opportunity", icon: Clock, desc: "Tids- och konkurrenssignaler." },
  education: { title: "Collector Education", icon: BookOpen, desc: "Hobby-kontext för korten du tittar på." },
};

function ConfidenceBadge({ level }: { level?: string | null }) {
  if (!level) return null;
  const cls = level === "HIGH" ? "border-rec-bid/60 bg-rec-bid/10 text-rec-bid"
    : level === "MEDIUM" || level === "MED" ? "border-amber-500/60 bg-amber-500/10 text-amber-600"
    : "border-rec-red/60 bg-rec-red/10 text-rec-red";
  return (
    <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide", cls)}>
      Confidence {level}
    </span>
  );
}

function Reasons({ items, tone = "info" }: { items?: string[]; tone?: "info" | "warn" | "good" }) {
  if (!items || items.length === 0) return null;
  const toneCls = tone === "warn"
    ? "border-rec-red/30 bg-rec-red/5 text-rec-red"
    : tone === "good"
      ? "border-rec-bid/30 bg-rec-bid/5"
      : "border-border bg-muted/40";
  return (
    <ul className={cn("space-y-1.5 rounded-lg border p-3 text-sm", toneCls)}>
      {items.map((r, i) => (
        <li key={i} className="flex items-start gap-2">
          {tone === "warn" ? <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> : <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-70" />}
          <span>{r}</span>
        </li>
      ))}
    </ul>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{children}</div>;
}

function ScoreContent({ a }: { a: NonNullable<ListingWithAnalysis["analyses"]> }) {
  const sb: any = a.score_breakdown_json ?? {};
  const pos: any[] = sb.positiveSignals ?? [];
  const neg: any[] = sb.negativeSignals ?? [];
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 p-3">
        <div>
          <div className="text-[11px] uppercase text-muted-foreground">Final Deal Score</div>
          <div className="text-3xl font-bold tabular-nums">{sb.totalScore ?? a.deal_score}</div>
        </div>
        <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
          <Mini label="Sniper" v={a.sniper_score} />
          <Mini label="Risk" v={a.risk_score} />
          <Mini label="Value" v={a.value_score} />
          <Mini label="Flip" v={a.flip_score} />
          <Mini label="Hold" v={a.hold_score} />
          <Mini label="Heat" v={a.heat_score ?? 0} />
        </div>
      </div>
      {pos.length > 0 && (<>
        <SectionTitle>Positiva signaler</SectionTitle>
        <div className="space-y-1.5">
          {pos.map((s: any, i: number) => <SignalRow key={i} s={s} positive />)}
        </div>
      </>)}
      {neg.length > 0 && (<>
        <SectionTitle>Negativa signaler</SectionTitle>
        <div className="space-y-1.5">
          {neg.map((s: any, i: number) => <SignalRow key={i} s={s} />)}
        </div>
      </>)}
      {pos.length === 0 && neg.length === 0 && (
        <p className="text-sm text-muted-foreground">{a.reasoning ?? "Ingen breakdown tillgänglig."}</p>
      )}
    </div>
  );
}

function Mini({ label, v }: { label: string; v: number }) {
  return (
    <div className="rounded-md border border-border bg-background px-1.5 py-1">
      <div className="text-[9px] uppercase text-muted-foreground">{label}</div>
      <div className="text-sm font-bold tabular-nums">{v}</div>
    </div>
  );
}

function SignalRow({ s, positive }: { s: any; positive?: boolean }) {
  const pts = s.points ?? 0;
  return (
    <div className="flex items-start gap-2 rounded-lg border border-border bg-card p-2 text-sm">
      <span className={cn(
        "min-w-[44px] rounded-md px-1.5 py-0.5 text-center text-xs font-bold tabular-nums",
        positive || pts > 0 ? "bg-rec-bid/15 text-rec-bid" : "bg-rec-red/15 text-rec-red",
      )}>
        {pts > 0 ? `+${pts}` : pts}
      </span>
      <div className="flex-1">
        <div className="font-semibold leading-tight">{s.label}</div>
        {s.reasoning && <div className="text-xs text-muted-foreground">{s.reasoning}</div>}
      </div>
    </div>
  );
}

function RecommendationContent({ a }: { a: NonNullable<ListingWithAnalysis["analyses"]> }) {
  const r: any = a.recommendation_explanation_json ?? {};
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-muted/40 p-3">
        <div>
          <div className="text-[11px] uppercase text-muted-foreground">Rekommendation</div>
          <div className="text-xl font-bold">{(r.recommendation ?? a.recommendation).replace("_", " ")}</div>
        </div>
        <ConfidenceBadge level={r.confidence} />
      </div>
      {(r.keyReasons?.length || a.reasoning) && (<>
        <SectionTitle>Varför</SectionTitle>
        {r.keyReasons?.length
          ? <Reasons items={r.keyReasons} tone="good" />
          : <p className="text-sm text-muted-foreground">{a.reasoning}</p>}
      </>)}
      {r.warnings?.length > 0 && (<>
        <SectionTitle>Varningar</SectionTitle>
        <Reasons items={r.warnings} tone="warn" />
      </>)}
    </div>
  );
}

function HeatContent({ a }: { a: NonNullable<ListingWithAnalysis["analyses"]> }) {
  const h: any = a.player_heat_explanation_json ?? {};
  const player = a.detected_players?.[0];
  const label = h.label ?? a.heat_label;
  const trend = h.trend;
  const TrendI = trend === "UP" ? TrendingUp : trend === "DOWN" ? TrendingDown : Minus;
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 p-3">
        <div>
          <div className="text-[11px] uppercase text-muted-foreground">{player ?? "Spelare"}</div>
          <div className="flex items-center gap-2 text-xl font-bold">
            {label === "HOT" && <Flame className="h-5 w-5 text-rec-red" />}
            {label === "COLD" && <Snowflake className="h-5 w-5 text-sky-500" />}
            {label ?? "Okänd"}
          </div>
        </div>
        {trend && <TrendI className="h-6 w-6 text-muted-foreground" />}
      </div>
      <Reasons items={h.reasons ?? ["Ingen heat-data tillgänglig."]} />
    </div>
  );
}

function HierarchyContent({ a }: { a: NonNullable<ListingWithAnalysis["analyses"]> }) {
  const h: any = a.hierarchy_explanation_json ?? {};
  const brandLabel = (h.brand ?? a.card_hierarchy_brand) === "PANINI_PRIZM" ? "Panini Prizm"
    : (h.brand ?? a.card_hierarchy_brand) === "TOPPS_CHROME" ? "Topps Chrome"
    : (h.brand ?? a.card_hierarchy_brand) ?? "Okänt brand";
  const warns: any[] = h.warnings ?? a.card_hierarchy_warnings_json ?? [];
  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
        <div className="font-bold">{brandLabel} · {h.parallel ?? a.card_hierarchy_parallel ?? "—"}</div>
        <div className="mt-1 flex flex-wrap gap-1.5">
          <Pill>Tier {h.tier ?? a.card_hierarchy_tier ?? "?"}</Pill>
          {(h.collectorPriority ?? a.collector_priority) && <Pill>{h.collectorPriority ?? a.collector_priority}</Pill>}
          {a.card_hierarchy_numbering && <Pill>{a.card_hierarchy_numbering}</Pill>}
          {h.rookieRelevance && <Pill>Rookie</Pill>}
          {h.autoRelevance && <Pill>Auto</Pill>}
          {typeof a.card_hierarchy_score_bonus === "number" && a.card_hierarchy_score_bonus !== 0 && (
            <Pill tone={a.card_hierarchy_score_bonus > 0 ? "good" : "bad"}>
              {a.card_hierarchy_score_bonus > 0 ? `+${a.card_hierarchy_score_bonus}` : a.card_hierarchy_score_bonus} score
            </Pill>
          )}
        </div>
      </div>
      <SectionTitle>Varför det spelar roll</SectionTitle>
      <Reasons items={h.reasoning ?? (a.card_hierarchy_reasoning ? [a.card_hierarchy_reasoning] : [])} tone="good" />
      {warns.length > 0 && (<>
        <SectionTitle>Varningar</SectionTitle>
        <Reasons items={warns.map((w: any) => typeof w === "string" ? w : (w?.message ?? w?.code ?? JSON.stringify(w)))} tone="warn" />
      </>)}
    </div>
  );
}

function MarketContent({ a }: { a: NonNullable<ListingWithAnalysis["analyses"]> }) {
  const m: any = a.market_anchor_explanation_json ?? {};
  const range = m.priceRange ?? [a.comp_low, a.comp_high];
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <Stat label="Estimerat värde" value={`${m.estimatedValue ?? a.estimated_market_value ?? "?"} kr`} />
        <Stat label="Median" value={`${m.medianValue ?? a.comp_median ?? "?"} kr`} />
        <Stat label="Intervall" value={range[0] && range[1] ? `${range[0]}–${range[1]} kr` : "—"} />
        <Stat label="Rabatt" value={a.discount_percent != null ? (a.discount_percent > 0 ? `-${a.discount_percent}%` : `+${Math.abs(a.discount_percent)}%`) : "—"}
          tone={a.discount_percent != null ? (a.discount_percent > 0 ? "good" : "bad") : undefined} />
      </div>
      <div><ConfidenceBadge level={m.confidence ?? a.comp_confidence} /> <span className="ml-2 text-xs text-muted-foreground">{a.comp_count} sålda jämförbara</span></div>
      <Reasons items={m.reasoning ?? []} />
    </div>
  );
}

function RiskContent({ a }: { a: NonNullable<ListingWithAnalysis["analyses"]> }) {
  const r: any = a.risk_analysis_json ?? {};
  const sev = r.severity ?? (a.risk_score > 60 ? "HIGH" : a.risk_score > 35 ? "MEDIUM" : "LOW");
  const sevCls = sev === "EXTREME" || sev === "HIGH" ? "bg-rec-red/15 text-rec-red"
    : sev === "MEDIUM" ? "bg-amber-500/15 text-amber-600"
    : "bg-rec-bid/15 text-rec-bid";
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 p-3">
        <div>
          <div className="text-[11px] uppercase text-muted-foreground">Severity</div>
          <div className={cn("inline-flex rounded-md px-2 py-0.5 text-lg font-bold", sevCls)}>{sev}</div>
        </div>
        <div className="text-right text-xs text-muted-foreground">Risk Score<br /><span className="text-base font-bold text-foreground">{a.risk_score}</span></div>
      </div>
      {r.reasons?.length > 0 && (<><SectionTitle>Detekterade risker</SectionTitle><Reasons items={r.reasons} tone="warn" /></>)}
      {r.detectedTerms?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {r.detectedTerms.map((t: string) => <Pill key={t} tone="bad">{t}</Pill>)}
        </div>
      )}
      {r.warnings?.length > 0 && (<><SectionTitle>Övriga varningar</SectionTitle><Reasons items={r.warnings} /></>)}
    </div>
  );
}

function MaxBidContent({ a }: { a: NonNullable<ListingWithAnalysis["analyses"]> }) {
  const m: any = a.max_bid_breakdown_json ?? {};
  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border bg-muted/40 p-3">
        <div className="text-[11px] uppercase text-muted-foreground">Rekommenderat maxbud</div>
        <div className="text-3xl font-bold tabular-nums">{m.recommendedMaxBid ?? a.max_bid} kr</div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Stat label="Estimerat värde" value={`${m.estimatedValue ?? "?"} kr`} />
        <Stat label="Confidence ×" value={`${m.confidenceMultiplier ?? "?"}`} />
        <Stat label="Frakt" value={`-${m.shippingCost ?? 0} kr`} />
        <Stat label="Riskavdrag" value={`-${m.riskDiscount ?? 0} kr`} />
      </div>
      <Reasons items={m.reasoning ?? []} />
    </div>
  );
}

function UrgencyContent({ a }: { a: NonNullable<ListingWithAnalysis["analyses"]> }) {
  const reasons: string[] = [];
  if (a.urgency === "HIGH") reasons.push("Mindre än 60 min kvar — sniper-fönster aktivt.");
  else if (a.urgency === "MED") reasons.push("Mindre än 2 h kvar.");
  else reasons.push("Ingen omedelbar tidspress.");
  if (a.competition === "LOW") reasons.push("Få bud — låg konkurrens.");
  else if (a.competition === "HIGH") reasons.push("Många bud — heated bidding.");
  reasons.push(`Sniper Score ${a.sniper_score}/100.`);
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Urgency" value={a.urgency} />
        <Stat label="Konkurrens" value={a.competition} />
        <Stat label="Sniper" value={`${a.sniper_score}`} />
      </div>
      <Reasons items={reasons} />
    </div>
  );
}

function EducationContent({ a }: { a: NonNullable<ListingWithAnalysis["analyses"]> }) {
  const tags = [
    ...(a.educational_notes_json ?? []),
    a.card_hierarchy_normalized_parallel,
    a.card_hierarchy_brand === "PANINI_PRIZM" ? "Panini Prizm" : a.card_hierarchy_brand === "TOPPS_CHROME" ? "Topps Chrome" : null,
    a.is_auto ? "Auto" : null,
    a.is_rookie ? "Rookie" : null,
    a.is_numbered ? "Numbered" : null,
  ].filter(Boolean) as string[];
  const entries = getEducation(tags);
  if (entries.length === 0) return <p className="text-sm text-muted-foreground">Ingen kuraterad hobby-information matchar detta kort ännu.</p>;
  return (
    <div className="space-y-3">
      {entries.map((e) => (
        <div key={e.tag} className="rounded-lg border border-border bg-muted/40 p-3">
          <div className="text-sm font-bold">{e.title}</div>
          <p className="mt-1 text-sm text-muted-foreground">{e.body}</p>
        </div>
      ))}
    </div>
  );
}

function Pill({ children, tone }: { children: ReactNode; tone?: "good" | "bad" }) {
  const cls = tone === "good" ? "border-rec-bid/60 bg-rec-bid/10 text-rec-bid"
    : tone === "bad" ? "border-rec-red/60 bg-rec-red/10 text-rec-red"
    : "border-border bg-background text-muted-foreground";
  return <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide", cls)}>{children}</span>;
}

function Stat({ label, value, tone }: { label: string; value: string | number; tone?: "good" | "bad" }) {
  return (
    <div className="rounded-md border border-border bg-card px-2 py-1.5">
      <div className="text-[10px] uppercase text-muted-foreground">{label}</div>
      <div className={cn("text-sm font-bold tabular-nums",
        tone === "good" && "text-rec-bid",
        tone === "bad" && "text-rec-red",
      )}>{value}</div>
    </div>
  );
}

export function IntelligenceDrawer({
  kind, listing, children,
}: {
  kind: DrawerKind;
  listing: ListingWithAnalysis;
  children: ReactNode;
}) {
  const a = listing.analyses;
  const meta = KIND_META[kind];
  const Icon = meta.icon;
  return (
    <Drawer>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2 text-base">
            <Icon className="h-4 w-4 text-primary" />
            {meta.title}
          </DrawerTitle>
          <DrawerDescription className="line-clamp-1 text-xs">{listing.title}</DrawerDescription>
        </DrawerHeader>
        <div className="overflow-y-auto px-4 pb-6">
          {!a ? (
            <p className="text-sm text-muted-foreground">Analys saknas.</p>
          ) : (
            <>
              {kind === "score" && <ScoreContent a={a} />}
              {kind === "recommendation" && <RecommendationContent a={a} />}
              {kind === "heat" && <HeatContent a={a} />}
              {kind === "hierarchy" && <HierarchyContent a={a} />}
              {kind === "market" && <MarketContent a={a} />}
              {kind === "risk" && <RiskContent a={a} />}
              {kind === "maxBid" && <MaxBidContent a={a} />}
              {kind === "urgency" && <UrgencyContent a={a} />}
              {kind === "education" && <EducationContent a={a} />}
            </>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}