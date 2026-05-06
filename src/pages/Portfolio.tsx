import { useState } from "react";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { usePortfolio, PortfolioItem } from "@/hooks/usePortfolio";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import { recommendExit } from "@/lib/exitStrategy";
import { cn } from "@/lib/utils";

export default function Portfolio() {
  const { items, add, update, remove, isLoading } = usePortfolio();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", player: "", purchase_price: "", shipping: "", estimated_value: "" });

  const totals = items.reduce((acc, i) => {
    acc.cost += Number(i.total_cost);
    acc.value += Number(i.estimated_value);
    return acc;
  }, { cost: 0, value: 0 });
  const pl = totals.value - totals.cost;

  const submit = async () => {
    if (!form.title || !form.purchase_price) return;
    await add({
      listing_id: null,
      title: form.title,
      player: form.player || null,
      purchase_price: parseFloat(form.purchase_price),
      shipping: parseFloat(form.shipping || "0"),
      estimated_value: parseFloat(form.estimated_value || "0"),
      status: "HOLD",
      exit_platform: null,
      notes: null,
    });
    setForm({ title: "", player: "", purchase_price: "", shipping: "", estimated_value: "" });
    setOpen(false);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <TopBar />
      <main className="mx-auto w-full max-w-3xl flex-1 space-y-4 px-4 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Portfölj</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="mr-1 h-4 w-4" /> Lägg till</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nytt kort i portföljen</DialogTitle></DialogHeader>
              <div className="space-y-2">
                <Input placeholder="Titel" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                <Input placeholder="Spelare (valfritt)" value={form.player} onChange={(e) => setForm({ ...form, player: e.target.value })} />
                <div className="grid grid-cols-3 gap-2">
                  <Input type="number" placeholder="Pris" value={form.purchase_price} onChange={(e) => setForm({ ...form, purchase_price: e.target.value })} />
                  <Input type="number" placeholder="Frakt" value={form.shipping} onChange={(e) => setForm({ ...form, shipping: e.target.value })} />
                  <Input type="number" placeholder="Värde" value={form.estimated_value} onChange={(e) => setForm({ ...form, estimated_value: e.target.value })} />
                </div>
                <Button onClick={submit} className="w-full">Spara</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <StatCard label="Totalt köpt" value={`${Math.round(totals.cost)} kr`} />
          <StatCard label="Värde" value={`${Math.round(totals.value)} kr`} />
          <StatCard label="P/L" value={`${pl >= 0 ? "+" : ""}${Math.round(pl)} kr`} accent={pl >= 0 ? "good" : "bad"} />
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Laddar…</p>
        ) : items.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Inga kort i portföljen ännu.</p>
        ) : (
          items.map((it) => <PortfolioRow key={it.id} item={it} onUpdate={update} onDelete={remove} />)
        )}
      </main>
      <BottomNav />
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: "good" | "bad" }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="text-[11px] uppercase text-muted-foreground">{label}</div>
      <div className={cn(
        "mt-0.5 text-base font-bold tabular-nums",
        accent === "good" && "text-rec-bid",
        accent === "bad" && "text-rec-red",
      )}>{value}</div>
    </div>
  );
}

function PortfolioRow({ item, onUpdate, onDelete }: {
  item: PortfolioItem;
  onUpdate: (p: Partial<PortfolioItem> & { id: string }) => Promise<unknown>;
  onDelete: (id: string) => Promise<unknown>;
}) {
  const pl = Number(item.estimated_value) - Number(item.total_cost);
  const exit = recommendExit({ player: item.player, estimatedValue: Number(item.estimated_value) });
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-1 text-sm font-semibold">{item.title}</h3>
          {item.player && <p className="text-[11px] text-muted-foreground">{item.player}</p>}
        </div>
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onDelete(item.id)} aria-label="Ta bort">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
        <div>
          <div className="text-muted-foreground">Kostnad</div>
          <div className="font-bold tabular-nums">{Math.round(Number(item.total_cost))} kr</div>
        </div>
        <div>
          <div className="text-muted-foreground">Värde</div>
          <Input
            type="number"
            defaultValue={item.estimated_value}
            className="mt-1 h-7 text-xs"
            onBlur={(e) => onUpdate({ id: item.id, estimated_value: parseFloat(e.target.value || "0") })}
          />
        </div>
        <div>
          <div className="text-muted-foreground">P/L</div>
          <div className={cn("flex items-center gap-1 font-bold tabular-nums", pl >= 0 ? "text-rec-bid" : "text-rec-red")}>
            {pl >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {pl >= 0 ? "+" : ""}{Math.round(pl)} kr
          </div>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {(["HOLD", "SELL", "GRADE"] as const).map((s) => (
          <Button
            key={s}
            size="sm"
            variant={item.status === s ? "default" : "outline"}
            className="h-7 px-2 text-[11px]"
            onClick={() => onUpdate({ id: item.id, status: s })}
          >{s}</Button>
        ))}
        <Badge variant="outline" className="ml-auto text-[10px]">
          {exit.strategy} på {exit.platform} · {exit.expectedRange[0]}–{exit.expectedRange[1]} kr
        </Badge>
      </div>
      <p className="mt-1 text-[10px] text-muted-foreground">{exit.reasoning}</p>
    </div>
  );
}