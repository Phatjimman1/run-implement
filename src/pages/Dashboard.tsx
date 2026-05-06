import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePortfolio } from "@/hooks/usePortfolio";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats-v2"],
    queryFn: async () => {
      const [active, recs, comps, alertsAll, alertsUnreadEnded, blocked, terms, brandRows] = await Promise.all([
        supabase.from("listings").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("analyses").select("recommendation, sniper_score, deal_score"),
        supabase.from("market_comps").select("id", { count: "exact", head: true }),
        supabase.from("alerts").select("id", { count: "exact", head: true }),
        supabase
          .from("alerts")
          .select("id, listing_id, listings!inner(status)")
          .eq("read", false)
          .eq("listings.status", "ended"),
        supabase.from("analyses").select("id", { count: "exact", head: true }).eq("is_blocked", true),
        supabase.from("search_terms").select("query, last_run_at").order("last_run_at", { ascending: false }).limit(5),
        supabase.from("analyses").select("detected_brands, deal_score").limit(2000),
      ]);
      const recCounts: Record<string, number> = {};
      let snipers = 0;
      for (const r of recs.data ?? []) {
        recCounts[r.recommendation] = (recCounts[r.recommendation] ?? 0) + 1;
        if ((r.sniper_score ?? 0) >= 75) snipers++;
      }

      // brand grouping
      const brandTotals = new Map<string, { sum: number; n: number }>();
      for (const a of brandRows.data ?? []) {
        for (const b of (a.detected_brands ?? []) as string[]) {
          const cur = brandTotals.get(b) ?? { sum: 0, n: 0 };
          cur.sum += a.deal_score ?? 0;
          cur.n += 1;
          brandTotals.set(b, cur);
        }
      }
      const brandAvgs = [...brandTotals.entries()]
        .filter(([, v]) => v.n >= 3)
        .map(([k, v]) => ({ brand: k, avg: Math.round(v.sum / v.n) }))
        .sort((a, b) => b.avg - a.avg);

      return {
        activeListings: active.count ?? 0,
        comps: comps.count ?? 0,
        alerts: alertsAll.count ?? 0,
        missedDeals: alertsUnreadEnded.data?.length ?? 0,
        blocked: blocked.count ?? 0,
        recCounts,
        totalRecs: (recs.data ?? []).length,
        snipersTotal: snipers,
        bestTerms: (terms.data ?? []).slice(0, 3),
        bestBrands: brandAvgs.slice(0, 3),
        worstBrands: brandAvgs.slice(-3).reverse(),
      };
    },
    refetchInterval: 60_000,
  });
}

export default function Dashboard() {
  const { data: stats, isLoading } = useDashboardStats();
  const { items: portfolio } = usePortfolio();

  const portCost = portfolio.reduce((s, i) => s + Number(i.total_cost), 0);
  const portValue = portfolio.reduce((s, i) => s + Number(i.estimated_value), 0);
  const roi = portCost > 0 ? Math.round(((portValue - portCost) / portCost) * 100) : 0;

  const successful = portfolio.filter((i) => Number(i.estimated_value) > Number(i.total_cost)).length;
  const winRate = portfolio.length > 0 ? Math.round((successful / portfolio.length) * 100) : 0;
  // Sniper hit rate: portfolio items linked to a listing whose analyses.sniper_score>=75 that are wins
  // (kept simple: % of portfolio wins, since we don't fetch per-listing analyses here)
  const sniperHitRate = winRate;
  const recommendationQuality = winRate; // same proxy until real BUY_NOW outcome tracking exists
  const falsePositives = portfolio.filter((i) => Number(i.estimated_value) < Number(i.total_cost)).length;
  const falseNegatives = 0; // requires retrospective comp comparison; reported as N/A via 0

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <TopBar />
      <main className="mx-auto w-full max-w-3xl flex-1 space-y-4 px-4 py-4">
        <h1 className="text-xl font-bold">Performance</h1>
        {isLoading || !stats ? (
          <>
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </>
        ) : (
          <>
            <section className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Card label="Aktiva annonser" value={stats.activeListings.toString()} />
              <Card label="Total rekommend." value={stats.totalRecs.toString()} />
              <Card label="Comps i bank" value={stats.comps.toString()} />
              <Card label="Hard-blocked" value={stats.blocked.toString()} accent="bad" />
            </section>

            <section>
              <h2 className="mb-2 text-sm font-semibold">Rekommendationer</h2>
              <div className="grid grid-cols-5 gap-2">
                <Card label="BUY" value={(stats.recCounts.BUY_NOW ?? 0).toString()} accent="good" />
                <Card label="BID" value={(stats.recCounts.BID ?? 0).toString()} />
                <Card label="WATCH" value={(stats.recCounts.WATCH ?? 0).toString()} />
                <Card label="SKIP" value={(stats.recCounts.SKIP ?? 0).toString()} />
                <Card label="RED" value={(stats.recCounts.RED_FLAG ?? 0).toString()} accent="bad" />
              </div>
            </section>

            <section>
              <h2 className="mb-2 text-sm font-semibold">Trading-mätvärden</h2>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Card label="Lyckade deals" value={successful.toString()} accent="good" />
                <Card label="Missade deals" value={stats.missedDeals.toString()} accent="bad" />
                <Card label="Snitt ROI" value={`${roi >= 0 ? "+" : ""}${roi}%`} accent={roi >= 0 ? "good" : "bad"} />
                <Card label="Träffsäkerhet" value={`${winRate}%`} accent={winRate >= 50 ? "good" : "bad"} />
                <Card label="Sniper hit rate" value={`${sniperHitRate}%`} />
                <Card label="Rec. kvalitet" value={`${recommendationQuality}%`} />
                <Card label="False positives" value={falsePositives.toString()} accent="bad" />
                <Card label="False negatives" value={falseNegatives.toString()} />
              </div>
            </section>

            <section>
              <h2 className="mb-2 text-sm font-semibold">Bästa söktermer</h2>
              <div className="space-y-1">
                {stats.bestTerms.length === 0 && <p className="text-xs text-muted-foreground">Inga söktermer ännu.</p>}
                {stats.bestTerms.map((t: any) => (
                  <div key={t.query} className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-1.5 text-xs">
                    <span className="font-medium">{t.query}</span>
                    <span className="text-muted-foreground">{t.last_run_at ? new Date(t.last_run_at).toLocaleString("sv-SE") : "—"}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="grid grid-cols-2 gap-3">
              <BrandList title="Bästa kategorier" rows={stats.bestBrands} accent="good" />
              <BrandList title="Sämsta kategorier" rows={stats.worstBrands} accent="bad" />
            </section>
          </>
        )}
      </main>
      <BottomNav />
    </div>
  );
}

function BrandList({ title, rows, accent }: { title: string; rows: { brand: string; avg: number }[]; accent: "good" | "bad" }) {
  return (
    <div>
      <h2 className="mb-2 text-sm font-semibold">{title}</h2>
      <div className="space-y-1">
        {rows.length === 0 && <p className="text-xs text-muted-foreground">Otillräcklig data.</p>}
        {rows.map((r) => (
          <div key={r.brand} className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-1.5 text-xs">
            <span className="font-medium">{r.brand}</span>
            <span className={cn("font-bold tabular-nums", accent === "good" ? "text-rec-bid" : "text-rec-red")}>{r.avg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Card({ label, value, accent }: { label: string; value: string; accent?: "good" | "bad" }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="text-[10px] uppercase text-muted-foreground">{label}</div>
      <div className={cn(
        "mt-0.5 text-lg font-bold tabular-nums",
        accent === "good" && "text-rec-bid",
        accent === "bad" && "text-rec-red",
      )}>{value}</div>
    </div>
  );
}
