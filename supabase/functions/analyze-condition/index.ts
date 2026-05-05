import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM = `You are a careful, conservative trading-card condition analyst for NBA basketball cards.
You analyze ONE listing photo and estimate visible condition. You must NEVER claim a guaranteed PSA grade.
Use cautious language ("appears", "potential", "based on visible image"). If the image is blurry, glared,
angled, or the card is in a sleeve/toploader with reflections, lower confidence and mark surface as UNREADABLE.

Return ONLY valid JSON matching this exact schema (no markdown, no commentary):
{
  "image_quality": { "score": 0-100, "label": "HIGH|MEDIUM|LOW|UNUSABLE", "issues": ["..."] },
  "centering":     { "leftRightRatio": "55/45", "topBottomRatio": "52/48", "score": 0-100, "label": "STRONG|ACCEPTABLE|OFF_CENTER|BAD", "explanation": "..." },
  "corners":       { "score": 0-100, "label": "CLEAN|MINOR_RISK|VISIBLE_DAMAGE|UNREADABLE", "issues": ["..."] },
  "edges":         { "score": 0-100, "label": "CLEAN|MINOR_RISK|VISIBLE_DAMAGE|UNREADABLE", "issues": ["..."] },
  "surface":       { "score": 0-100, "label": "NO_VISIBLE_ISSUE|POSSIBLE_RISK|VISIBLE_ISSUE|UNREADABLE", "issues": ["..."] },
  "psa_potential": "PSA_10_POTENTIAL|PSA_9_LIKELY|RAW_ONLY|DO_NOT_GRADE|UNKNOWN",
  "confidence":    "HIGH|MEDIUM|LOW",
  "explanation":   "1-3 sentence cautious summary",
  "warnings":      ["..."]
}`;

function labelFromScore(s: number) {
  if (s >= 85) return "EXCELLENT";
  if (s >= 70) return "GOOD";
  if (s >= 50) return "OK";
  if (s >= 25) return "RISKY";
  return "UNREADABLE";
}

function adviceFrom(psa: string, label: string, conf: string) {
  if (psa === "PSA_10_POTENTIAL" && conf === "HIGH") return "GRADE_CANDIDATE";
  if (label === "RISKY" || label === "UNREADABLE") return "CONDITION_RISK";
  if (conf === "LOW") return "ASK_FOR_MORE_PHOTOS";
  if (label === "GOOD" || label === "OK") return "RAW_BUY_ONLY";
  return "RAW_BUY_ONLY";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { listingId } = await req.json();
    if (!listingId) {
      return new Response(JSON.stringify({ error: "listingId required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: listing, error: lErr } = await supabase
      .from("listings").select("id, image_urls, title").eq("id", listingId).maybeSingle();
    if (lErr || !listing) {
      return new Response(JSON.stringify({ error: "Listing not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const imageUrl = listing.image_urls?.[0];
    if (!imageUrl) {
      return new Response(JSON.stringify({ error: "No image to analyze" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM },
          {
            role: "user",
            content: [
              { type: "text", text: `Analyze this NBA card listing photo. Title: "${listing.title}". Return JSON only.` },
              { type: "image_url", image_url: { url: imageUrl } },
            ],
          },
        ],
      }),
    });

    if (!aiRes.ok) {
      const txt = await aiRes.text();
      return new Response(JSON.stringify({ error: "AI request failed", details: txt }), {
        status: aiRes.status === 429 || aiRes.status === 402 ? aiRes.status : 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiJson = await aiRes.json();
    const raw = aiJson.choices?.[0]?.message?.content ?? "{}";
    let parsed: any = {};
    try { parsed = typeof raw === "string" ? JSON.parse(raw) : raw; } catch { parsed = {}; }

    const iq = parsed.image_quality ?? { score: 0, label: "UNUSABLE", issues: [] };
    const ce = parsed.centering   ?? { score: 0, label: "BAD", issues: [], explanation: "" };
    const co = parsed.corners     ?? { score: 0, label: "UNREADABLE", issues: [] };
    const ed = parsed.edges       ?? { score: 0, label: "UNREADABLE", issues: [] };
    const su = parsed.surface     ?? { score: 0, label: "UNREADABLE", issues: [] };

    const conditionScore = Math.round(
      (ce.score ?? 0) * 0.35 + (co.score ?? 0) * 0.25 + (ed.score ?? 0) * 0.20 +
      (su.score ?? 0) * 0.10 + (iq.score ?? 0) * 0.10
    );
    const conditionLabel = labelFromScore(conditionScore);
    const psaPotential = parsed.psa_potential ?? "UNKNOWN";
    const confidence   = parsed.confidence ?? "LOW";
    const advice = adviceFrom(psaPotential, conditionLabel, confidence);

    const { data: saved, error: sErr } = await supabase
      .from("condition_analyses")
      .insert({
        listing_id: listingId,
        image_url: imageUrl,
        condition_score: conditionScore,
        condition_label: conditionLabel,
        psa_potential: psaPotential,
        confidence,
        condition_advice: advice,
        image_quality: iq,
        centering: ce,
        corners: co,
        edges: ed,
        surface: su,
        explanation: parsed.explanation ?? "",
        warnings: parsed.warnings ?? [],
      })
      .select()
      .single();

    if (sErr) {
      return new Response(JSON.stringify({ error: sErr.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ analysis: saved }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});