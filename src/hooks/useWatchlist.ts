import { useCallback, useMemo } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type WatchlistItem = {
  id: string;
  listing_id: string;
  user_max_bid: number | null;
  recommended_max_bid: number | null;
  status: "WAIT" | "BID_NOW" | "SKIP";
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export function useWatchlist() {
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ["watchlist"],
    queryFn: async (): Promise<WatchlistItem[]> => {
      const { data, error } = await supabase
        .from("watchlist_items")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as WatchlistItem[];
    },
    staleTime: 30_000,
  });

  const ids = useMemo(() => new Set((data ?? []).map((w) => w.listing_id)), [data]);

  const toggle = useCallback(async (listingId: string, recommendedMaxBid?: number) => {
    const existing = (data ?? []).find((w) => w.listing_id === listingId);
    if (existing) {
      await supabase.from("watchlist_items").delete().eq("id", existing.id);
    } else {
      await supabase.from("watchlist_items").insert({
        listing_id: listingId,
        recommended_max_bid: recommendedMaxBid ?? null,
      });
    }
    qc.invalidateQueries({ queryKey: ["watchlist"] });
  }, [data, qc]);

  const isWatched = useCallback((id: string) => ids.has(id), [ids]);

  const updateMutation = useMutation({
    mutationFn: async (patch: Partial<WatchlistItem> & { id: string }) => {
      const { id, ...rest } = patch;
      const { error } = await supabase
        .from("watchlist_items")
        .update({ ...rest, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["watchlist"] }),
  });

  return { items: data ?? [], ids, toggle, isWatched, update: updateMutation.mutateAsync };
}