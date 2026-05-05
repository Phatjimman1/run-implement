import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Alert = {
  id: string;
  listing_id: string;
  type: "HIGH_VALUE" | "ENDING_SOON";
  triggered_at: string;
  read: boolean;
  message: string | null;
  deal_score: number | null;
  sniper_score: number | null;
};

export function useAlerts() {
  const qc = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("alerts-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "alerts" }, () => {
        qc.invalidateQueries({ queryKey: ["alerts"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [qc]);

  const query = useQuery({
    queryKey: ["alerts"],
    queryFn: async (): Promise<Alert[]> => {
      const { data, error } = await supabase
        .from("alerts")
        .select("*")
        .order("triggered_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as Alert[];
    },
    staleTime: 15_000,
  });

  const unreadCount = (query.data ?? []).filter((a) => !a.read).length;

  const markAllRead = async () => {
    await supabase.from("alerts").update({ read: true }).eq("read", false);
    qc.invalidateQueries({ queryKey: ["alerts"] });
  };

  const markRead = async (id: string) => {
    await supabase.from("alerts").update({ read: true }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["alerts"] });
  };

  const dismiss = async (id: string) => {
    await supabase.from("alerts").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["alerts"] });
  };

  return { ...query, alerts: query.data ?? [], unreadCount, markAllRead, markRead, dismiss };
}