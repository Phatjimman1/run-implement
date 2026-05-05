import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type ConditionAnalysisRow = {
  id: string;
  listing_id: string;
  image_url: string | null;
  overlay_image_url: string | null;
  condition_score: number;
  condition_label: string;
  psa_potential: string;
  confidence: string;
  condition_advice: string;
  image_quality: any;
  centering: any;
  corners: any;
  edges: any;
  surface: any;
  explanation: string | null;
  warnings: any;
  created_at: string;
};

export function useConditionAnalysis(listingId: string, enabled = true) {
  return useQuery({
    queryKey: ["condition_analysis", listingId],
    enabled: enabled && !!listingId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("condition_analyses")
        .select("*")
        .eq("listing_id", listingId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data as ConditionAnalysisRow | null) ?? null;
    },
  });
}

export function useRunConditionAnalysis() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (listingId: string) => {
      const { data, error } = await supabase.functions.invoke("analyze-condition", {
        body: { listingId },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return (data as any).analysis as ConditionAnalysisRow;
    },
    onSuccess: (_d, listingId) => {
      qc.invalidateQueries({ queryKey: ["condition_analysis", listingId] });
      toast.success("Condition Check klar");
    },
    onError: (e: any) => {
      toast.error(e?.message ?? "Condition Check misslyckades");
    },
  });
}