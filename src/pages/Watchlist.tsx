import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { ListingCard } from "@/components/ListingCard";
import { useWatchlist } from "@/hooks/useWatchlist";
import { useListings } from "@/hooks/useListings";
import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function statusFor(item: { user_max_bid: number | null; recommended_max_bid: number | null }, listing: { current_price: number | null; end_time: string | null }): "WAIT" | "BID_NOW" | "SKIP" {
  const price = listing.current_price ?? 0;
  const max = item.user_max_bid ?? item.recommended_max_bid ?? 0;
  if (max > 0 && price > max) return "SKIP";
  if (listing.end_time) {
    const mins = (new Date(listing.end_time).getTime() - Date.now()) / 60000;
    if (mins > 0 && mins < 15) return "BID_NOW";
  }
  return "WAIT";
}

export default function Watchlist() {
  const { items, update } = useWatchlist();
  const { data: listings, isLoading } = useListings();

  const rows = useMemo(() => {
    const map = new Map((listings ?? []).map((l) => [l.id, l]));
    return items
      .map((w) => ({ w, l: map.get(w.listing_id) }))
      .filter((r) => r.l);
  }, [items, listings]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <TopBar />
      <main className="mx-auto w-full max-w-3xl flex-1 space-y-4 px-4 py-4">
        <h1 className="text-xl font-bold">Bevakade kort & budplan</h1>
        {isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : rows.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Inga bevakade kort ännu. Tryck på hjärtat på en annons för att lägga till.
          </p>
        ) : (
          rows.map(({ w, l }) => {
            const status = statusFor(w, l!);
            return (
              <div key={w.id} className="space-y-2">
                <ListingCard listing={l!} />
                <div className="rounded-xl border border-border bg-card p-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Min budplan</span>
                    <Badge className={cn(
                      status === "BID_NOW" && "bg-rec-buy text-white",
                      status === "SKIP" && "bg-rec-red text-white",
                      status === "WAIT" && "bg-secondary text-foreground",
                    )}>{status}</Badge>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <label className="text-[11px] text-muted-foreground">
                      Mitt maxbud (kr)
                      <Input
                        type="number"
                        defaultValue={w.user_max_bid ?? ""}
                        onBlur={(e) => {
                          const v = e.target.value ? parseInt(e.target.value, 10) : null;
                          update({ id: w.id, user_max_bid: v });
                        }}
                        className="mt-1 h-8"
                      />
                    </label>
                    <label className="text-[11px] text-muted-foreground">
                      Rek. maxbud
                      <Input value={`${l!.analyses?.max_bid ?? "—"} kr`} disabled className="mt-1 h-8" />
                    </label>
                  </div>
                  <label className="mt-2 block text-[11px] text-muted-foreground">
                    Anteckningar
                    <Input
                      defaultValue={w.notes ?? ""}
                      placeholder="t.ex. kolla skick på baksidan"
                      onBlur={(e) => update({ id: w.id, notes: e.target.value })}
                      className="mt-1 h-8"
                    />
                  </label>
                </div>
              </div>
            );
          })
        )}
      </main>
      <BottomNav />
    </div>
  );
}