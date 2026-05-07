import { createClient } from "jsr:@supabase/supabase-js@2";
import { Image } from "https://deno.land/x/imagescript@1.2.17/mod.ts";

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
  "image_quality": {
    "score": 0-100,
    "label": "HIGH|MEDIUM|LOW|UNUSABLE",
    "issues": ["..."],
    "checks": {
      "glare":      "NONE|MILD|SEVERE",
      "blur":       "NONE|MILD|SEVERE",
      "angle":      "NONE|MILD|SEVERE",
      "crop":       "NONE|MILD|SEVERE",
      "sleeve":     "NONE|MILD|SEVERE",
      "reflection": "NONE|MILD|SEVERE"
    }
  },
  "card_box":      { "x": 0.0-1.0, "y": 0.0-1.0, "w": 0.0-1.0, "h": 0.0-1.0 },
  "inner_box":     { "x": 0.0-1.0, "y": 0.0-1.0, "w": 0.0-1.0, "h": 0.0-1.0 },
  "centering":     { "leftRightRatio": "55/45", "topBottomRatio": "52/48", "score": 0-100, "label": "STRONG|ACCEPTABLE|OFF_CENTER|BAD", "explanation": "..." },
  "corners":       { "score": 0-100, "label": "CLEAN|MINOR_RISK|VISIBLE_DAMAGE|UNREADABLE", "issues": ["..."] },
  "edges":         { "score": 0-100, "label": "CLEAN|MINOR_RISK|VISIBLE_DAMAGE|UNREADABLE", "issues": ["..."] },
  "surface":       { "score": 0-100, "label": "NO_VISIBLE_ISSUE|POSSIBLE_RISK|VISIBLE_ISSUE|UNREADABLE", "issues": ["..."] },
  "psa_potential": "PSA_10_POTENTIAL|PSA_9_LIKELY|RAW_ONLY|DO_NOT_GRADE|UNKNOWN",
  "confidence":    "HIGH|MEDIUM|LOW",
  "explanation":   "1-3 sentence cautious summary",
  "warnings":      ["..."]
}
The card_box is the outer detected card boundary as fractions of image width/height (top-left origin).
The inner_box is the printed border / inner image area. If unclear, return your best estimate.`;

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

function clamp01(n: any): number {
  const x = Number(n);
  if (!isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

function rgba(r: number, g: number, b: number, a: number) {
  return ((r & 0xff) << 24) | ((g & 0xff) << 16) | ((b & 0xff) << 8) | (a & 0xff);
}

function drawRect(img: Image, x: number, y: number, w: number, h: number, color: number, thickness = 3) {
  for (let t = 0; t < thickness; t++) {
    img.drawBox(Math.max(0, x + t), Math.max(0, y + t), Math.max(1, w - 2 * t), 1, color);
    img.drawBox(Math.max(0, x + t), Math.max(0, y + h - 1 - t), Math.max(1, w - 2 * t), 1, color);
    img.drawBox(Math.max(0, x + t), Math.max(0, y + t), 1, Math.max(1, h - 2 * t), color);
    img.drawBox(Math.max(0, x + w - 1 - t), Math.max(0, y + t), 1, Math.max(1, h - 2 * t), color);
  }
}

function drawDashedLine(img: Image, x1: number, y1: number, x2: number, y2: number, color: number, dash = 8, thickness = 2) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  if (len === 0) return;
  const ux = dx / len, uy = dy / len;
  let drawn = 0;
  while (drawn < len) {
    const seg = Math.min(dash, len - drawn);
    if ((Math.floor(drawn / dash)) % 2 === 0) {
      const sx = Math.round(x1 + ux * drawn);
      const sy = Math.round(y1 + uy * drawn);
      const ex = Math.round(x1 + ux * (drawn + seg));
      const ey = Math.round(y1 + uy * (drawn + seg));
      // simple thick line via repeated 1px lines offset perpendicularly
      const px = -uy, py = ux;
      for (let t = -Math.floor(thickness / 2); t <= Math.floor(thickness / 2); t++) {
        img.drawLine(sx + Math.round(px * t), sy + Math.round(py * t), ex + Math.round(px * t), ey + Math.round(py * t), color);
      }
    }
    drawn += seg;
  }
}

function drawCircle(img: Image, cx: number, cy: number, r: number, color: number) {
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy <= r * r) {
        const x = cx + dx, y = cy + dy;
        if (x >= 0 && y >= 0 && x < img.width && y < img.height) img.setPixelAt(x + 1, y + 1, color);
      }
    }
  }
}

async function buildOverlay(
  imageUrl: string,
  cardBox: { x: number; y: number; w: number; h: number },
  innerBox: { x: number; y: number; w: number; h: number } | null,
  centerFracX: number,
  centerFracY: number,
): Promise<Uint8Array | null> {
  try {
    const res = await fetch(imageUrl);
    if (!res.ok) return null;
    const buf = new Uint8Array(await res.arrayBuffer());
    const img = await Image.decode(buf);
    const W = img.width, H = img.height;

    const cyan = rgba(0, 200, 255, 230);
    const blue = rgba(80, 140, 255, 200);
    const red = rgba(255, 70, 70, 240);

    const cx = Math.round(cardBox.x * W);
    const cy = Math.round(cardBox.y * H);
    const cw = Math.round(cardBox.w * W);
    const ch = Math.round(cardBox.h * H);

    drawRect(img, cx, cy, cw, ch, cyan, Math.max(2, Math.round(Math.min(W, H) / 400)));

    if (innerBox && innerBox.w > 0 && innerBox.h > 0) {
      const ix = Math.round(innerBox.x * W);
      const iy = Math.round(innerBox.y * H);
      const iw = Math.round(innerBox.w * W);
      const ih = Math.round(innerBox.h * H);
      drawRect(img, ix, iy, iw, ih, blue, Math.max(1, Math.round(Math.min(W, H) / 600)));
    }

    // Center lines based on detected centering ratios within card box
    const vX = Math.round(cx + cw * centerFracX);
    const hY = Math.round(cy + ch * centerFracY);
    drawDashedLine(img, vX, cy, vX, cy + ch, red, 12, 2);
    drawDashedLine(img, cx, hY, cx + cw, hY, red, 12, 2);

    // Corner markers
    const r = Math.max(4, Math.round(Math.min(cw, ch) / 40));
    [[cx, cy], [cx + cw, cy], [cx, cy + ch], [cx + cw, cy + ch]].forEach(([x, y]) => {
      drawCircle(img, x, y, r, red);
    });

    return await img.encode(1);
  } catch (e) {
    console.error("overlay build failed", e);
    return null;
  }
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

    // Bounding boxes (with safe defaults if AI omitted them)
    const cb = parsed.card_box ?? { x: 0.05, y: 0.05, w: 0.9, h: 0.9 };
    const ib = parsed.inner_box ?? null;
    const cardBox = {
      x: clamp01(cb.x), y: clamp01(cb.y),
      w: clamp01(cb.w), h: clamp01(cb.h),
    };
    const innerBox = ib
      ? { x: clamp01(ib.x), y: clamp01(ib.y), w: clamp01(ib.w), h: clamp01(ib.h) }
      : null;

    // Parse centering ratios → fractional center within the card box
    const parseRatio = (s: any): number => {
      if (typeof s !== "string") return 0.5;
      const m = s.match(/(\d+)\s*\/\s*(\d+)/);
      if (!m) return 0.5;
      const a = parseInt(m[1], 10), b = parseInt(m[2], 10);
      if (!a || !b) return 0.5;
      return a / (a + b);
    };
    const centerFracX = parseRatio(ce.leftRightRatio);
    const centerFracY = parseRatio(ce.topBottomRatio);

    // Build and upload overlay PNG
    let overlayUrl: string | null = null;
    const overlayPng = await buildOverlay(imageUrl, cardBox, innerBox, centerFracX, centerFracY);
    if (overlayPng) {
      const path = `${listingId}/${Date.now()}.png`;
      const { error: upErr } = await supabase.storage
        .from("condition-overlays")
        .upload(path, overlayPng, { contentType: "image/png", upsert: true });
      if (!upErr) {
        const { data: pub } = supabase.storage.from("condition-overlays").getPublicUrl(path);
        overlayUrl = pub.publicUrl;
      } else {
        console.error("overlay upload failed", upErr);
      }
    }

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
        overlay_image_url: overlayUrl,
        condition_score: conditionScore,
        condition_label: conditionLabel,
        psa_potential: psaPotential,
        confidence,
        condition_advice: advice,
        image_quality: iq,
        centering: { ...ce, card_box: cardBox, inner_box: innerBox },
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