import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type PortfolioItem = {
  id: string;
  listing_id: string | null;
  title: string;
  player: string | null;
  purchase_price: number;
  shipping: number;
  total_cost: number;
  estimated_value: number;
  status: "HOLD" | "SELL" | "GRADE";
  exit_platform: string | null;
  notes: string | null;
  purchased_at: string;
  sold_price: number | null;
  sold_at: string | null;
};

export function usePortfolio() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["portfolio"],
    queryFn: async (): Promise<PortfolioItem[]> => {
      const { data, error } = await supabase
        .from("portfolio_items")
        .select("*")
        .order("purchased_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as PortfolioItem[];
    },
    staleTime: 30_000,
  });

  const add = useMutation({
    mutationFn: async (item: Omit<PortfolioItem, "id" | "total_cost" | "purchased_at" | "sold_price" | "sold_at"> & { purchased_at?: string }) => {
      const { error } = await supabase.from("portfolio_items").insert(item);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["portfolio"] }),
  });

  const update = useMutation({
    mutationFn: async (patch: Partial<PortfolioItem> & { id: string }) => {
      const { id, ...rest } = patch;
      const { error } = await supabase.from("portfolio_items").update(rest).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["portfolio"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("portfolio_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["portfolio"] }),
  });

  return { ...query, items: query.data ?? [], add: add.mutateAsync, update: update.mutateAsync, remove: remove.mutateAsync };
}