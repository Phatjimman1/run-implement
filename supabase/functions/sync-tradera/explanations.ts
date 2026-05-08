// Intelligence Explanations — backend-first reasoning generator.
// Pure functions over existing scoring / comps / hierarchy / heat results.
// No scoring side-effects. Produces the 8 explanation JSON blobs the UI consumes.

import type { ScoreResult } from "./scoring.ts";
import type { CompMatch, MarketAdjust, SniperResult, HeatInfo } from "./comps.ts";
import type { CardHierarchyAnalysis } from "./hierarchy.ts";
import type { HardBlockResult } from "./blocking.ts";

export type Confidence = "HIGH" | "MEDIUM" | "LOW";
export type Severity = "LOW" | "MEDIUM" | "HIGH" | "EXTREME";

export interface ScoreSignal { label: string; points: number; reasoning: string; }

export interface ScoreBreakdown {
  totalScore: number;
  positiveSignals: ScoreSignal[];
  negativeSignals: ScoreSignal[];
}

export interface RecommendationExplanation {
  recommendation: string;
  confidence: Confidence;
  keyReasons: string[];
  warnings: string[];
}

export interface MarketAnchorExplanation {
  estimatedValue: number;
  medianValue: number;
  priceRange: [number, number];
  discountPercent: number | null;
  confidence: "HIGH" | "MED" | "LOW";
  reasoning: string[];
}

export interface PlayerHeatExplanation {
  label: "HOT" | "WARM" | "COOL" | "COLD" | null;
  trend: "UP" | "STABLE" | "DOWN" | null;
  reasons: string[];
}

export interface RiskAnalysis {
  severity: Severity;
  reasons: string[];
  detectedTerms: string[];
  warnings: string[];
}

export interface MaxBidBreakdown {
  estimatedValue: number;
  confidenceMultiplier: number;
  shippingCost: number;
  riskDiscount: number;
  recommendedMaxBid: number;
  reasoning: string[];
}

export interface HierarchyExplanation {
  brand: string;
  tier: string;
  parallel: string | null;
  collectorPriority: string;
  rookieRelevance: boolean;
  autoRelevance: boolean;
  reasoning: string[];
  warnings: string[];
}

export interface BuildArgs {
  score: ScoreResult;
  finalDealScore: number;
  finalRecommendation: string;
  comp: CompMatch;
  market: MarketAdjust;
  sniper: SniperResult;
  heat: HeatInfo | null;
  hierarchy: CardHierarchyAnalysis;
  hierarchyBonus: number;
  block: HardBlockResult;
  totalCost: number;
  shipping: number;
  estimatedValue: number;
}

export function buildScoreBreakdown(a: BuildArgs): ScoreBreakdown {
  const s = a.score;
  const pos: ScoreSignal[] = [];
  const neg: ScoreSignal[] = [];

  if (s.isRookie) pos.push({ label: "Rookie Card", points: 20, reasoning: "Rookie-kort har starkare långsiktig samlarefterfrågan." });
  if (s.isCertifiedAuto) pos.push({ label: "Certified Auto", points: 30, reasoning: "Certifierad autograf från etablerat brand höjer värde och likviditet." });
  if (s.isRookie && s.isAuto) pos.push({ label: "Rookie Auto", points: 35, reasoning: "Rookie + auto är det mest eftertraktade hobby-segmentet." });
  if (s.isXFractor) pos.push({ label: "X-Fractor", points: 22, reasoning: "X-Fractor är en respekterad Chrome-parallel med tydlig prispremie." });
  if (s.isRefractor && !s.isXFractor) pos.push({ label: "Refractor", points: 20, reasoning: "Refractors är likvida och samlade på Tradera." });
  if (s.isNumbered && s.numberedPrintRun !== null) {
    const pts = s.numberedPrintRun <= 99 ? 35 : 25;
    pos.push({ label: `Numbered /${s.numberedPrintRun}`, points: pts, reasoning: "Lågt printrun ökar värde och flip-potential." });
  }
  if (s.isBlueChip) pos.push({ label: "Blue Chip Player", points: 20, reasoning: "Stabil efterfrågan från etablerade NBA-stjärnor." });
  if (s.isRookieUpside) pos.push({ label: "Rookie Upside", points: 15, reasoning: "Topp-prospekt med upside i kommande säsonger." });
  if (s.isLegend) pos.push({ label: "Legend", points: 10, reasoning: "Legendar har stabil samlarbas över tid." });
  if (s.isSwedish) pos.push({ label: "Swedish Edge", points: 8, reasoning: "Lokal samlarbas på Tradera ger likviditet." });
  if (a.market.marketBonus > 0) pos.push({ label: "Market Discount", points: a.market.marketBonus, reasoning: `Pris ligger ${a.market.discountPercent}% under medianen för jämförbara sålda kort.` });
  if (a.heat?.label === "HOT") pos.push({ label: "HOT Player", points: 10, reasoning: "Spelaren är het — stigande sålda priser senaste 30 dagarna." });
  else if (a.heat?.label === "WARM") pos.push({ label: "Warm Player", points: 5, reasoning: "Spelaren visar positiv pristrend." });
  if (a.hierarchyBonus > 0) pos.push({ label: `Hierarchy ${a.hierarchy.tier}`, points: a.hierarchyBonus, reasoning: a.hierarchy.reasoning });
  if (a.sniper.competition === "LOW") pos.push({ label: "Low Competition", points: 10, reasoning: "Få bud → större sniper-fönster." });
  if (a.sniper.urgency === "HIGH") pos.push({ label: "Ending Soon", points: 15, reasoning: "Mindre än 60 min kvar — sniper-fönster öppet." });

  if (s.isInsert) neg.push({ label: "Insert Card", points: -15, reasoning: "Inserts har lägre likviditet än core parallels." });
  if (s.isCollege) neg.push({ label: "College/NIL", points: -15, reasoning: "Pre-NBA kort har osäker långsiktig värdering." });
  if (s.isReprintRisk) neg.push({ label: "Reprint Risk", points: -60, reasoning: "Titel innehåller reprint/replica/custom — sannolikt novelty." });
  if (s.redFlagTerms.includes("wcg")) neg.push({ label: "WCG Slab", points: -40, reasoning: "WCG anses inte trovärdigt grading-bolag." });
  if (s.isDamaged) neg.push({ label: "Damaged", points: -40, reasoning: "Synligt skick-problem nämnt i titel." });
  if (s.isAuto && !s.isCertifiedAuto) neg.push({ label: "Uncertified Auto", points: -25, reasoning: "Auto utan certifiering har förhöjd äkthetsrisk." });
  if (a.sniper.competition === "HIGH") neg.push({ label: "High Competition", points: -10, reasoning: "Många bud trycker priset över marknadsvärdet." });
  if (a.market.marketBonus < 0) neg.push({ label: "Overpriced", points: a.market.marketBonus, reasoning: `Pris ligger ~${Math.abs(a.market.discountPercent ?? 0)}% över medianen.` });
  if (a.block.blocked) neg.push({ label: "Hard Block", points: -100, reasoning: a.block.reasons.join("; ") || "Hård block-regel triggad." });

  return { totalScore: a.finalDealScore, positiveSignals: pos, negativeSignals: neg };
}

export function buildRecommendationExplanation(a: BuildArgs): RecommendationExplanation {
  const reasons: string[] = [];
  const warnings: string[] = [];
  const s = a.score;

  if (a.market.discountPercent && a.market.discountPercent > 20) reasons.push(`Marknadsrabatt ${a.market.discountPercent}% mot median.`);
  if (a.hierarchy.tier && ["S", "A", "B"].includes(a.hierarchy.tier)) reasons.push(`Premium hierarki: ${a.hierarchy.brand === "PANINI_PRIZM" ? "Panini Prizm" : "Topps Chrome"} Tier ${a.hierarchy.tier} (${a.hierarchy.parallelName}).`);
  if (s.isRookie && (s.isXFractor || s.isRefractor || s.isAuto)) reasons.push("Rookie-parallel med stark hobby-prestige.");
  if (a.sniper.competition === "LOW") reasons.push("Låg konkurrens i budgivning.");
  if (a.heat?.label === "HOT") reasons.push("HOT spelare-trend — pristrend uppåt.");
  if (a.sniper.urgency === "HIGH") reasons.push("Auktionen slutar snart — sniper-fönster.");
  if (a.comp.confidence === "HIGH") reasons.push(`Hög confidence från ${a.comp.count} sålda jämförbara kort.`);

  if (s.isReprintRisk) warnings.push("Reprint/replica-risk i titel.");
  if (s.isAuto && !s.isCertifiedAuto) warnings.push("Auto saknar certifieringsmarkör.");
  if (s.isDamaged) warnings.push("Skick-varning i titel.");
  if (a.block.blocked) warnings.push(...a.block.reasons);
  if (a.comp.count < 3) warnings.push("Få jämförbara sålda kort — värdering osäker.");
  if (a.market.marketBonus < 0) warnings.push("Pris över marknadsmedian.");

  let confidence: Confidence = "MEDIUM";
  if (a.comp.confidence === "HIGH" && warnings.length === 0) confidence = "HIGH";
  else if (s.isReprintRisk || a.block.blocked || a.comp.count === 0) confidence = "LOW";

  if (reasons.length === 0) reasons.push("Neutral signal — bevaka utveckling.");
  return { recommendation: a.finalRecommendation, confidence, keyReasons: reasons, warnings };
}

export function buildMarketAnchorExplanation(a: BuildArgs): MarketAnchorExplanation {
  const reasoning: string[] = [];
  if (a.comp.count >= 3) reasoning.push(`Baserat på ${a.comp.count} sålda jämförbara kort senaste 60 dagarna.`);
  else reasoning.push("För få jämförbara sålda kort — fallback till regelbaserad estimering.");
  if (a.market.discountPercent !== null) {
    if (a.market.discountPercent > 0) reasoning.push(`Aktuellt pris ligger ${a.market.discountPercent}% under medianen.`);
    else reasoning.push(`Aktuellt pris ligger ${Math.abs(a.market.discountPercent)}% över medianen.`);
  }
  if (a.comp.confidence === "HIGH") reasoning.push("Hög confidence — exakt signature-match.");
  else if (a.comp.confidence === "MED") reasoning.push("Medium confidence — partiell match på spelare + typ.");
  else reasoning.push("Låg confidence — endast spelare-fallback eller regelbaserat.");

  return {
    estimatedValue: a.estimatedValue,
    medianValue: a.comp.median,
    priceRange: [a.comp.low, a.comp.high],
    discountPercent: a.market.discountPercent,
    confidence: a.comp.confidence,
    reasoning,
  };
}

export function buildPlayerHeatExplanation(a: BuildArgs): PlayerHeatExplanation {
  const reasons: string[] = [];
  const heat = a.heat;
  if (!heat) return { label: null, trend: null, reasons: ["Ingen heat-data för denna spelare ännu."] };
  if (heat.label === "HOT") reasons.push("Sålda priser stiger senaste 30 dagarna.");
  if (heat.label === "WARM") reasons.push("Måttligt stigande pristrend.");
  if (heat.label === "COOL") reasons.push("Stabilt eller svagt fallande pristrend.");
  if (heat.label === "COLD") reasons.push("Fallande sålda priser — minskad efterfrågan.");
  if (heat.trend === "UP") reasons.push("Trendriktning: uppåt.");
  if (heat.trend === "DOWN") reasons.push("Trendriktning: nedåt.");
  if (heat.score >= 75) reasons.push(`Heat score ${heat.score}/100 — högt samlarintresse.`);
  return { label: heat.label, trend: heat.trend, reasons };
}

export function buildRiskAnalysis(a: BuildArgs): RiskAnalysis {
  const s = a.score;
  const reasons: string[] = [];
  const warnings: string[] = [];
  let severity: Severity = "LOW";

  if (s.riskScore > 60) severity = "HIGH";
  else if (s.riskScore > 35) severity = "MEDIUM";
  if (s.isReprintRisk || a.block.blocked) severity = "EXTREME";

  if (s.isReprintRisk) reasons.push("Reprint/replica/custom-term i titel.");
  if (s.redFlagTerms.includes("wcg")) reasons.push("WCG slab — ej trovärdigt grading-bolag.");
  if (s.isAuto && !s.isCertifiedAuto) reasons.push("Auto utan certifieringssignal.");
  if (s.isDamaged) reasons.push("Skadat skick nämnt i titel.");
  if (s.isInsert) warnings.push("Insert-kort har lägre likviditet.");
  if (s.isCollege) warnings.push("College/NIL-kort — pre-NBA värdering osäker.");
  if (a.block.blocked) reasons.push(...a.block.reasons);

  return { severity, reasons, detectedTerms: s.redFlagTerms, warnings };
}

export function buildMaxBidBreakdown(a: BuildArgs): MaxBidBreakdown {
  const reasoning: string[] = [];
  let confidence = 0.65;
  if (a.finalRecommendation === "BUY_NOW") confidence = 0.75;
  else if (a.score.riskScore > 60) confidence = 0.4;
  else if (a.score.riskScore > 40) confidence = 0.5;
  if (a.score.isInsert || a.score.isCollege) confidence = Math.min(confidence, 0.4);

  const riskDiscount = Math.round(a.score.riskScore * 0.5);
  const ev = a.estimatedValue;

  reasoning.push(`Estimerat värde ${ev} kr × confidence ${confidence}.`);
  reasoning.push(`Avdrag för frakt ${a.shipping} kr.`);
  reasoning.push(`Riskavdrag ${riskDiscount} kr (riskScore ${a.score.riskScore}).`);
  if (a.finalRecommendation === "RED_FLAG") reasoning.push("RED_FLAG → maxbud satt till 0.");

  return {
    estimatedValue: ev,
    confidenceMultiplier: confidence,
    shippingCost: a.shipping,
    riskDiscount,
    recommendedMaxBid: a.score.maxBid,
    reasoning,
  };
}

export function buildHierarchyExplanation(a: BuildArgs): HierarchyExplanation {
  const h = a.hierarchy;
  const reasoning: string[] = [];
  if (h.reasoning) reasoning.push(h.reasoning);
  if (h.tier === "S") reasoning.push("Grail-parallel — högsta hobby-prestige.");
  else if (h.tier === "A") reasoning.push("Elite-parallel — stark samlarefterfrågan.");
  else if (h.tier === "B") reasoning.push("Viktig parallel med solid likviditet.");
  else if (h.tier === "C") reasoning.push("Mid-tier parallel — bra balans pris/kvalitet.");
  if (h.isRookieRelevant && ["A","B","C","D"].includes(h.tier)) reasoning.push("Rookie-version uppgraderar samlarprio.");
  if (h.numbering) reasoning.push(`Printrun ${h.numbering} stödjer värderingen.`);

  return {
    brand: h.brand,
    tier: h.tier,
    parallel: h.parallelName,
    collectorPriority: h.collectorPriority,
    rookieRelevance: h.isRookieRelevant,
    autoRelevance: h.isAutoRelevant,
    reasoning,
    warnings: h.warnings,
  };
}

export function buildEducationalNotes(a: BuildArgs): string[] {
  const notes: string[] = [];
  const tags = new Set<string>();
  if (a.hierarchy.normalizedParallelName) tags.add(a.hierarchy.normalizedParallelName);
  if (a.score.isXFractor) tags.add("X-Fractor");
  if (a.score.isRefractor) tags.add("Refractor");
  if (a.score.isAuto) tags.add("Auto");
  if (a.score.isRookie) tags.add("Rookie");
  if (a.score.isNumbered) tags.add("Numbered");
  return Array.from(tags);
}

export function buildAllExplanations(a: BuildArgs) {
  return {
    score_breakdown_json: buildScoreBreakdown(a),
    recommendation_explanation_json: buildRecommendationExplanation(a),
    market_anchor_explanation_json: buildMarketAnchorExplanation(a),
    player_heat_explanation_json: buildPlayerHeatExplanation(a),
    risk_analysis_json: buildRiskAnalysis(a),
    max_bid_breakdown_json: buildMaxBidBreakdown(a),
    hierarchy_explanation_json: buildHierarchyExplanation(a),
    educational_notes_json: buildEducationalNotes(a),
  };
}