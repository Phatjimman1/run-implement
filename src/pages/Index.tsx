import { useMemo } from "react";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { Section } from "@/components/Section";
import { Skeleton } from "@/components/ui/skeleton";
import { useListings, ListingWithAnalysis } from "@/hooks/useListings";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Index = () => {
  const { data, isLoading } = useListings();
  const listings = data ?? [];

  const sections = useMemo(() => {
    const withA = listings.filter((l) => l.analyses);
    const totalCost = (l: ListingWithAnalysis) => (l.current_price ?? 0) + (l.shipping_cost ?? 0);
    const isEndingSoon = (l: ListingWithAnalysis) => {
      if (!l.end_time) return false;
      const ms = new Date(l.end_time).getTime() - Date.now();
      return ms > 0 && ms < 24 * 3600 * 1000;
    };

    return {
      top: [...withA].sort((a, b) => (b.analyses!.deal_score - a.analyses!.deal_score)).slice(0, 6),
      sniper: [...withA]
        .filter((l) => {
          const a = l.analyses!;
          if (a.sniper_score < 70) return false;
          if ((l.current_price ?? 0) > 300) return false;
          if (!l.end_time) return false;
          const mins = (new Date(l.end_time).getTime() - Date.now()) / 60000;
          return mins > 0 && mins < 120;
        })
        .sort((a, b) => b.analyses!.sniper_score - a.analyses!.sniper_score)
        .slice(0, 8),
      hotPlayers: withA.filter((l) => l.analyses!.heat_label === "HOT").slice(0, 6),
      ending: withA.filter(isEndingSoon).sort((a, b) => new Date(a.end_time!).getTime() - new Date(b.end_time!).getTime()).slice(0, 6),
      autosUnder200: withA.filter((l) => l.analyses!.is_auto && totalCost(l) > 0 && totalCost(l) < 200).slice(0, 6),
      refractorsUnder100: withA.filter((l) => l.analyses!.is_refractor && totalCost(l) > 0 && totalCost(l) < 100).slice(0, 6),
      xfractors: withA.filter((l) => l.analyses!.is_xfractor && (l.analyses!.tags.includes("Blue Chip") || l.analyses!.tags.includes("Rookie Upside") || l.analyses!.tags.includes("Legend"))).slice(0, 6),
      newest: [...withA].sort((a, b) => new Date(b.first_seen_at).getTime() - new Date(a.first_seen_at).getTime()).slice(0, 6),
      redFlags: withA.filter((l) => l.analyses!.recommendation === "RED_FLAG").slice(0, 4),
    };
  }, [listings]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopBar />
      <main className="flex-1 mx-auto w-full max-w-3xl py-4 space-y-6">
        {isLoading ? (
          <div className="space-y-3 px-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
          </div>
        ) : listings.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <Section title="🎯 SNIPER DEALS" subtitle="Hög sannolikhet, låg konkurrens, slutar snart" listings={sections.sniper} />
            <Section title="🔥 HOT players" subtitle="Spelare som trendar uppåt" listings={sections.hotPlayers} />
            <Section title="🔥 Top Deals nu" subtitle="Högst Deal Score just nu" listings={sections.top} />
            <Section title="⏰ Slutar snart" subtitle="Auktioner som löper ut inom 24 h" listings={sections.ending} />
            <Section title="✍️ Autos under 200 kr" listings={sections.autosUnder200} />
            <Section title="💎 Refractors under 100 kr" listings={sections.refractorsUnder100} />
            <Section title="⭐ X-Fractors på stjärnor" listings={sections.xfractors} />
            <Section title="🆕 Nya senaste 10 min" listings={sections.newest} />
            <Section title="🚩 Red Flags – undvik" listings={sections.redFlags} />
          </>
        )}
        <p className="px-4 text-[10px] leading-relaxed text-muted-foreground">
          Endast beslutsstöd. Inga automatiska bud. Verifiera alltid bilder, skick och äkthet på Tradera innan köp.
        </p>
      </main>
      <BottomNav />
    </div>
  );
};

function EmptyState() {
  return (
    <div className="mx-4 rounded-2xl border border-dashed border-border p-6 text-center">
      <h2 className="text-base font-semibold">Inga annonser ännu</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Tryck på <strong>Synka</strong> uppe till höger för att hämta NBA-kort från Tradera.
      </p>
      <p className="mt-3 text-xs text-muted-foreground">Eller öppna fulla listan när data finns:</p>
      <Button asChild variant="outline" size="sm" className="mt-2">
        <Link to="/listings">Öppna lista</Link>
      </Button>
    </div>
  );
}

export default Index;
