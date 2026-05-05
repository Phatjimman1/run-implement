import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePortfolio } from "@/hooks/usePortfolio";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function useStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [active, recs, comps, alerts, blocked] = await Promise.all([
        supabase.from("listings").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("analyses").select("recommendation"),
        supabase.from("market_comps").select("id", { count: "exact", head: true }),
        supabase.from("alerts").select("id", { count: "exact", head: true }),
        supabase.from("analyses").select("id", { count: "exact", head: true }).eq("is_blocked", true),
      ]);
      const recCounts: Record<string, number> = {};
      for (const r of recs.data ?? []) {
        recCounts[r.recommendation] = (recCounts[r.recommendation] ?? 0) + 1;
      }
      return {
        activeListings: active.count ?? 0,
        comps: comps.count ?? 0,
        alerts: alerts.count ?? 0,
        blocked: blocked.count ?? 0,
        recCounts,
      };
    },
    refetchInterval: 60_000,
  });
}

export default function Dashboard() {
  const { data: stats, isLoading } = useStats();
  const { items: portfolio } = usePortfolio();

  const portCost = portfolio.reduce((s, i) => s + Number(i.total_cost), 0);
  const portValue = portfolio.reduce((s, i) => s + Number(i.estimated_value), 0);
  const roi = portCost > 0 ? Math.round(((portValue - portCost) / portCost) * 100) : 0;
  const wins = portfolio.filter((i) => Number(i.estimated_value) > Number(i.total_cost)).length;
  const winRate = portfolio.length > 0 ? Math.round((wins / portfolio.length) * 100) : 0;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <TopBar />
      <main className="mx-auto w-full max-w-3xl flex-1 space-y-4 px-4 py-4">
        <h1 className="text-xl font-bold">Performance</h1>
        {isLoading || !stats ? (
          <Skeleton className="h-32 w-full" />
        ) : (
          <>
            <section className="grid grid-cols-2 gap-2">
              <Card label="Aktiva annonser" value={stats.activeListings.toString()} />
              <Card label="Hard-blocked" value={stats.blocked.toString()} accent="bad" />
              <Card label="Comps i bank" value={stats.comps.toString()} />
              <Card label="Notiser totalt" value={stats.alerts.toString()} />
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
              <h2 className="mb-2 text-sm font-semibold">Portfölj-ROI</h2>
              <div className="grid grid-cols-2 gap-2">
                <Card label="Snitt ROI" value={`${roi >= 0 ? "+" : ""}${roi}%`} accent={roi >= 0 ? "good" : "bad"} />
                <Card label="Träffsäkerhet" value={`${winRate}%`} accent={winRate >= 50 ? "good" : "bad"} />
              </div>
            </section>
          </>
        )}
      </main>
      <BottomNav />
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