import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLastSync } from "@/hooks/useListings";
import { AlertsBell } from "./AlertsBell";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export function TopBar() {
  const { data: lastSync } = useLastSync();
  const [loading, setLoading] = useState(false);
  const qc = useQueryClient();

  const refresh = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke("sync-tradera", { body: { limit: 4 } });
      if (error) throw error;
      toast.success("Synk klar – nya deals laddade");
      qc.invalidateQueries({ queryKey: ["listings"] });
      qc.invalidateQueries({ queryKey: ["last-sync"] });
    } catch (e) {
      toast.error("Kunde inte synka", { description: e instanceof Error ? e.message : "Okänt fel" });
    } finally {
      setLoading(false);
    }
  };

  const lastTxt = lastSync
    ? new Date(lastSync).toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" })
    : "—";

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <div>
          <h1 className="text-lg font-bold leading-tight">
            <span className="text-primary">NBA</span> Card Sniper
          </h1>
          <p className="text-[11px] text-muted-foreground">Senast uppdaterad: {lastTxt}</p>
        </div>
        <div className="flex items-center gap-2">
          <AlertsBell />
          <Button size="sm" variant="outline" onClick={refresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            <span className="ml-1.5 hidden sm:inline">Synka</span>
          </Button>
        </div>
      </div>
    </header>
  );
}