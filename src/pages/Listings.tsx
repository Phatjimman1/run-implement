import { useMemo, useState } from "react";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { ListingCard } from "@/components/ListingCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useListings } from "@/hooks/useListings";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Sort = "deal" | "sniper" | "ending" | "price" | "newest" | "flip" | "hold" | "hierarchy" | "priority";

const TIER_RANK: Record<string, number> = { S: 1, A: 2, B: 3, C: 4, D: 5, E: 6, F: 7, UNKNOWN: 99 };
const PRIORITY_RANK: Record<string, number> = { GRAIL: 1, ELITE: 2, HIGH: 3, MEDIUM: 4, LOW: 5, BASE: 6, UNKNOWN: 99 };

export default function Listings() {
  const { data, isLoading } = useListings();
  const [search, setSearch] = useState("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [recFilter, setRecFilter] = useState<string>("all");
  const [cardType, setCardType] = useState<string>("all");
  const [brand, setBrand] = useState<string>("all");
  const [hideInserts, setHideInserts] = useState(false);
  const [hideRedFlags, setHideRedFlags] = useState(true);
  const [endingSoon, setEndingSoon] = useState(false);
  const [autoOnly, setAutoOnly] = useState(false);
  const [refractorOnly, setRefractorOnly] = useState(false);
  const [swedishOnly, setSwedishOnly] = useState(false);
  const [blueChipOnly, setBlueChipOnly] = useState(false);
  const [hierarchyTier, setHierarchyTier] = useState<string>("all");
  const [collectorPriority, setCollectorPriority] = useState<string>("all");
  const [prizmOnly, setPrizmOnly] = useState(false);
  const [chromeOnly, setChromeOnly] = useState(false);
  const [grailsOnly, setGrailsOnly] = useState(false);
  const [rookieHierarchyOnly, setRookieHierarchyOnly] = useState(false);
  const [sort, setSort] = useState<Sort>("deal");

  const brandOptions = useMemo(() => {
    const set = new Set<string>();
    for (const l of data ?? []) for (const b of l.analyses?.detected_brands ?? []) set.add(b);
    return [...set].sort();
  }, [data]);

  const listings = useMemo(() => {
    let l = (data ?? []).filter((x) => x.analyses);
    if (search) {
      const s = search.toLowerCase();
      l = l.filter((x) => x.title.toLowerCase().includes(s) || (x.analyses?.detected_players ?? []).some((p) => p.toLowerCase().includes(s)));
    }
    if (maxPrice) {
      const max = parseInt(maxPrice, 10);
      if (!isNaN(max)) l = l.filter((x) => (x.current_price ?? 0) <= max);
    }
    if (recFilter !== "all") {
      l = l.filter((x) => {
        const r = x.analyses!.recommendation === "BID" ? "BID_SNIPA" : x.analyses!.recommendation;
        return r === recFilter;
      });
    }
    if (cardType !== "all") {
      l = l.filter((x) => {
        const a = x.analyses!;
        if (cardType === "auto") return a.is_auto;
        if (cardType === "refractor") return a.is_refractor || a.is_xfractor;
        if (cardType === "rookie") return a.is_rookie;
        return true;
      });
    }
    if (brand !== "all") l = l.filter((x) => (x.analyses!.detected_brands ?? []).includes(brand));
    if (autoOnly) l = l.filter((x) => x.analyses!.is_auto);
    if (refractorOnly) l = l.filter((x) => x.analyses!.is_refractor || x.analyses!.is_xfractor);
    if (hideInserts) l = l.filter((x) => !x.analyses!.is_insert);
    if (hideRedFlags) l = l.filter((x) => x.analyses!.recommendation !== "RED_FLAG");
    if (swedishOnly) l = l.filter((x) => (x.analyses!.tags ?? []).includes("Swedish Edge"));
    if (blueChipOnly) l = l.filter((x) => (x.analyses!.tags ?? []).includes("Blue Chip"));
    if (hierarchyTier !== "all") l = l.filter((x) => x.analyses!.card_hierarchy_tier === hierarchyTier);
    if (collectorPriority !== "all") l = l.filter((x) => x.analyses!.collector_priority === collectorPriority);
    if (prizmOnly) l = l.filter((x) => x.analyses!.card_hierarchy_brand === "PANINI_PRIZM");
    if (chromeOnly) l = l.filter((x) => x.analyses!.card_hierarchy_brand === "TOPPS_CHROME");
    if (grailsOnly) l = l.filter((x) => x.analyses!.collector_priority === "GRAIL");
    if (rookieHierarchyOnly) l = l.filter((x) => x.analyses!.is_rookie && (x.analyses!.card_hierarchy_brand === "PANINI_PRIZM" || x.analyses!.card_hierarchy_brand === "TOPPS_CHROME"));
    if (endingSoon) {
      l = l.filter((x) => {
        if (!x.end_time) return false;
        const mins = (new Date(x.end_time).getTime() - Date.now()) / 60000;
        return mins > 0 && mins < 120;
      });
    }

    switch (sort) {
      case "deal": l = [...l].sort((a, b) => b.analyses!.deal_score - a.analyses!.deal_score); break;
      case "sniper": l = [...l].sort((a, b) => b.analyses!.sniper_score - a.analyses!.sniper_score); break;
      case "ending": l = [...l].filter((x) => x.end_time).sort((a, b) => new Date(a.end_time!).getTime() - new Date(b.end_time!).getTime()); break;
      case "price": l = [...l].sort((a, b) => (a.current_price ?? 9e9) - (b.current_price ?? 9e9)); break;
      case "newest": l = [...l].sort((a, b) => new Date(b.first_seen_at).getTime() - new Date(a.first_seen_at).getTime()); break;
      case "flip": l = [...l].sort((a, b) => b.analyses!.flip_score - a.analyses!.flip_score); break;
      case "hold": l = [...l].sort((a, b) => b.analyses!.hold_score - a.analyses!.hold_score); break;
      case "hierarchy": l = [...l].sort((a, b) => (TIER_RANK[a.analyses!.card_hierarchy_tier ?? "UNKNOWN"] ?? 99) - (TIER_RANK[b.analyses!.card_hierarchy_tier ?? "UNKNOWN"] ?? 99)); break;
      case "priority": l = [...l].sort((a, b) => (PRIORITY_RANK[a.analyses!.collector_priority ?? "UNKNOWN"] ?? 99) - (PRIORITY_RANK[b.analyses!.collector_priority ?? "UNKNOWN"] ?? 99)); break;
    }
    return l;
  }, [data, search, maxPrice, recFilter, cardType, brand, autoOnly, refractorOnly, hideInserts, hideRedFlags, swedishOnly, blueChipOnly, hierarchyTier, collectorPriority, prizmOnly, chromeOnly, grailsOnly, rookieHierarchyOnly, endingSoon, sort]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopBar />
      <div className="sticky top-[57px] z-20 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-3xl space-y-2 px-4 py-3">
          <div className="flex gap-2">
            <Input placeholder="Sök titel, spelare…" value={search} onChange={(e) => setSearch(e.target.value)} />
            <Input type="number" inputMode="numeric" placeholder="Max kr" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="w-24" />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <Select value={recFilter} onValueChange={setRecFilter}>
              <SelectTrigger className="h-8 w-[130px] shrink-0 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla rekommend.</SelectItem>
                <SelectItem value="BUY_NOW">BUY NOW</SelectItem>
                <SelectItem value="BID_SNIPA">BID/SNIPA</SelectItem>
                <SelectItem value="WATCH">WATCH</SelectItem>
                <SelectItem value="SKIP">SKIP</SelectItem>
                <SelectItem value="RED_FLAG">RED FLAG</SelectItem>
              </SelectContent>
            </Select>
            <Select value={cardType} onValueChange={setCardType}>
              <SelectTrigger className="h-8 w-[120px] shrink-0 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla typer</SelectItem>
                <SelectItem value="auto">Auto</SelectItem>
                <SelectItem value="refractor">Refractor</SelectItem>
                <SelectItem value="rookie">Rookie</SelectItem>
              </SelectContent>
            </Select>
            <Select value={brand} onValueChange={setBrand}>
              <SelectTrigger className="h-8 w-[120px] shrink-0 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla brands</SelectItem>
                {brandOptions.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={(v) => setSort(v as Sort)}>
              <SelectTrigger className="h-8 w-[140px] shrink-0 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="deal">Deal Score</SelectItem>
                <SelectItem value="sniper">Sniper Score</SelectItem>
                <SelectItem value="ending">Slutar snart</SelectItem>
                <SelectItem value="price">Pris lägst</SelectItem>
                <SelectItem value="newest">Nyast</SelectItem>
                <SelectItem value="flip">Bästa Flip</SelectItem>
                <SelectItem value="hold">Bästa Hold</SelectItem>
                <SelectItem value="hierarchy">Bästa Hierarki</SelectItem>
                <SelectItem value="priority">Collector Priority</SelectItem>
              </SelectContent>
            </Select>
            <Select value={hierarchyTier} onValueChange={setHierarchyTier}>
              <SelectTrigger className="h-8 w-[120px] shrink-0 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla tiers</SelectItem>
                {(["S","A","B","C","D","E","F"] as const).map((t) => <SelectItem key={t} value={t}>Tier {t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={collectorPriority} onValueChange={setCollectorPriority}>
              <SelectTrigger className="h-8 w-[140px] shrink-0 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla priorities</SelectItem>
                {(["GRAIL","ELITE","HIGH","MEDIUM","LOW","BASE"] as const).map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <Toggle on={endingSoon} onClick={() => setEndingSoon(v => !v)}>Slutar snart</Toggle>
            <Toggle on={autoOnly} onClick={() => setAutoOnly(v => !v)}>Auto only</Toggle>
            <Toggle on={refractorOnly} onClick={() => setRefractorOnly(v => !v)}>Refractor only</Toggle>
            <Toggle on={hideInserts} onClick={() => setHideInserts(v => !v)}>Dölj inserts</Toggle>
            <Toggle on={hideRedFlags} onClick={() => setHideRedFlags(v => !v)}>Dölj red flags</Toggle>
            <Toggle on={swedishOnly} onClick={() => setSwedishOnly(v => !v)}>Swedish edge</Toggle>
            <Toggle on={blueChipOnly} onClick={() => setBlueChipOnly(v => !v)}>Blue chip</Toggle>
            <Toggle on={prizmOnly} onClick={() => setPrizmOnly(v => !v)}>Prizm only</Toggle>
            <Toggle on={chromeOnly} onClick={() => setChromeOnly(v => !v)}>Chrome only</Toggle>
            <Toggle on={grailsOnly} onClick={() => setGrailsOnly(v => !v)}>Grails</Toggle>
            <Toggle on={rookieHierarchyOnly} onClick={() => setRookieHierarchyOnly(v => !v)}>Rookie hierarki</Toggle>
          </div>
        </div>
      </div>

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-4">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-80 w-full rounded-2xl" />)}
          </div>
        ) : listings.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Inga annonser matchar filtret.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {listings.map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
}

function Toggle({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <Button size="sm" variant={on ? "default" : "outline"} className="h-8 shrink-0 text-xs" onClick={onClick}>
      {children}
    </Button>
  );
}
