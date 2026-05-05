import { useMemo } from "react";
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ListingWithAnalysis = {
  id: string;
  tradera_item_id: string;
  title: string;
  url: string;
  image_urls: string[];
  current_price: number | null;
  shipping_cost: number | null;
  end_time: string | null;
  bid_count: number | null;
  seller_name: string | null;
  status: string;
  last_seen_at: string;
  first_seen_at: string;
  analyses: {
    deal_score: number;
    value_score: number;
    flip_score: number;
    hold_score: number;
    risk_score: number;
    recommendation: string;
    max_bid: number;
    estimated_market_value: number | null;
    reasoning: string | null;
    tags: string[];
    detected_players: string[];
    detected_brands: string[];
    detected_card_types: string[];
    is_auto: boolean;
    is_refractor: boolean;
    is_xfractor: boolean;
    is_insert: boolean;
    is_rookie: boolean;
    price_per_card: number | null;
    card_count: number | null;
    card_signature: string | null;
    comp_median: number | null;
    comp_low: number | null;
    comp_high: number | null;
    comp_count: number;
    comp_confidence: "HIGH" | "MED" | "LOW";
    discount_percent: number | null;
    sniper_score: number;
    urgency: "LOW" | "MED" | "HIGH";
    competition: "LOW" | "MED" | "HIGH";
    heat_score: number | null;
    heat_label: "HOT" | "WARM" | "COOL" | "COLD" | null;
    is_blocked: boolean;
    block_reason: string | null;
  } | null;
};

export type PlayerHeat = {
  player: string;
  heat_score: number;
  trend: "UP" | "STABLE" | "DOWN";
  label: "HOT" | "WARM" | "COOL" | "COLD";
  sample_size: number;
  recent_avg_price: number | null;
  prior_avg_price: number | null;
  active_listing_count: number;
};

export function usePlayerHeat() {
  return useQuery({
    queryKey: ["player-heat"],
    queryFn: async (): Promise<PlayerHeat[]> => {
      const { data, error } = await supabase
        .from("player_heat")
        .select("player, heat_score, trend, label, sample_size, recent_avg_price, prior_avg_price, active_listing_count")
        .order("heat_score", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as PlayerHeat[];
    },
    staleTime: 60_000,
  });
}

export function usePlayerHeatMap() {
  const { data } = usePlayerHeat();
  return useMemo(() => {
    const m = new Map<string, PlayerHeat>();
    for (const h of data ?? []) m.set(h.player, h);
    return m;
  }, [data]);
}

export function useListings() {
  const qc = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("listings-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "analyses" }, () => {
        qc.invalidateQueries({ queryKey: ["listings"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [qc]);

  return useQuery({
    queryKey: ["listings"],
    queryFn: async (): Promise<ListingWithAnalysis[]> => {
      const { data, error } = await supabase
        .from("listings")
        .select(`
          id, tradera_item_id, title, url, image_urls, current_price, shipping_cost,
          end_time, bid_count, seller_name, status, last_seen_at, first_seen_at,
          analyses ( * )
        `)
        .eq("status", "active")
        .order("last_seen_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []).map((l: any) => ({
        ...l,
        analyses: Array.isArray(l.analyses) ? l.analyses[0] ?? null : l.analyses,
      })).filter((l: ListingWithAnalysis) => !l.analyses?.is_blocked);
    },
    staleTime: 30_000,
  });
}

export function useLastSync() {
  return useQuery({
    queryKey: ["last-sync"],
    queryFn: async (): Promise<string | null> => {
      const { data } = await supabase
        .from("search_terms")
        .select("last_run_at")
        .order("last_run_at", { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle();
      return data?.last_run_at ?? null;
    },
    refetchInterval: 60_000,
  });
}