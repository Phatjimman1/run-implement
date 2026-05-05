import { useMemo, useState } from "react";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { ListingCard } from "@/components/ListingCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useListings } from "@/hooks/useListings";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Sort = "deal" | "ending" | "price" | "newest";

export default function Listings() {
  const { data, isLoading } = useListings();
  const [search, setSearch] = useState("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [recFilter, setRecFilter] = useState<string>("all");
  const [hideInserts, setHideInserts] = useState(false);
  const [hideRedFlags, setHideRedFlags] = useState(true);
  const [sort, setSort] = useState<Sort>("deal");

  const listings = useMemo(() => {
    let l = (data ?? []).filter((x) => x.analyses);
    if (search) {
      const s = search.toLowerCase();
      l = l.filter((x) => x.title.toLowerCase().includes(s));
    }
    if (maxPrice) {
      const max = parseInt(maxPrice, 10);
      if (!isNaN(max)) l = l.filter((x) => (x.current_price ?? 0) <= max);
    }
    if (recFilter !== "all") l = l.filter((x) => x.analyses!.recommendation === recFilter);
    if (hideInserts) l = l.filter((x) => !x.analyses!.is_insert);
    if (hideRedFlags) l = l.filter((x) => x.analyses!.recommendation !== "RED_FLAG");

    switch (sort) {
      case "deal": l = [...l].sort((a, b) => b.analyses!.deal_score - a.analyses!.deal_score); break;
      case "ending": l = [...l].filter((x) => x.end_time).sort((a, b) => new Date(a.end_time!).getTime() - new Date(b.end_time!).getTime()); break;
      case "price": l = [...l].sort((a, b) => (a.current_price ?? 9e9) - (b.current_price ?? 9e9)); break;
      case "newest": l = [...l].sort((a, b) => new Date(b.first_seen_at).getTime() - new Date(a.first_seen_at).getTime()); break;
    }
    return l;
  }, [data, search, maxPrice, recFilter, hideInserts, hideRedFlags, sort]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopBar />
      <div className="sticky top-[57px] z-20 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-3xl space-y-2 px-4 py-3">
          <div className="flex gap-2">
            <Input placeholder="Sök titel, spelare…" value={search} onChange={(e) => setSearch(e.target.value)} />
            <Input type="number" inputMode="numeric" placeholder="Max kr" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="w-24" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={recFilter} onValueChange={setRecFilter}>
              <SelectTrigger className="h-8 w-[140px] text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla rekommend.</SelectItem>
                <SelectItem value="BUY_NOW">BUY NOW</SelectItem>
                <SelectItem value="BID">BID</SelectItem>
                <SelectItem value="WATCH">WATCH</SelectItem>
                <SelectItem value="SKIP">SKIP</SelectItem>
                <SelectItem value="RED_FLAG">RED FLAG</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={(v) => setSort(v as Sort)}>
              <SelectTrigger className="h-8 w-[140px] text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="deal">Deal Score</SelectItem>
                <SelectItem value="ending">Slutar snart</SelectItem>
                <SelectItem value="price">Pris lägst</SelectItem>
                <SelectItem value="newest">Nyast</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" variant={hideInserts ? "default" : "outline"} className="h-8" onClick={() => setHideInserts((v) => !v)}>
              Dölj inserts
            </Button>
            <Button size="sm" variant={hideRedFlags ? "default" : "outline"} className="h-8" onClick={() => setHideRedFlags((v) => !v)}>
              Dölj red flags
            </Button>
          </div>
        </div>
      </div>

      <main className="flex-1 mx-auto w-full max-w-3xl px-4 py-4 space-y-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)
        ) : listings.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Inga annonser matchar filtret.</p>
        ) : (
          listings.map((l) => <ListingCard key={l.id} listing={l} />)
        )}
      </main>
      <BottomNav />
    </div>
  );
}