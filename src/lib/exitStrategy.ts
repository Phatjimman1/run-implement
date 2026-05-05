// Exit Strategy Engine — recommends where to sell.
const EBAY_TIER = [
  "wembanyama", "victor wembanyama", "shai gilgeous", "sga",
  "cooper flagg", "luka doncic", "luka dončić", "lebron", "jordan", "kobe",
  "nikola jokic", "stephen curry", "kevin durant",
];
const SWEDISH_TIER = [
  "pelle larsson", "bobi klintman", "lauri markkanen",
];

export type ExitRecommendation = {
  platform: "EBAY" | "TRADERA";
  expectedRange: [number, number];
  reason: string;
};

export function recommendExit(args: {
  player?: string | null;
  estimatedValue: number;
  isLot?: boolean;
}): ExitRecommendation {
  const { player, estimatedValue, isLot } = args;
  const p = (player ?? "").toLowerCase();

  if (isLot) {
    return {
      platform: "TRADERA",
      expectedRange: [Math.round(estimatedValue * 0.7), Math.round(estimatedValue * 0.95)],
      reason: "Bulk/lott säljs bäst på Tradera",
    };
  }
  if (SWEDISH_TIER.some((s) => p.includes(s))) {
    return {
      platform: "TRADERA",
      expectedRange: [Math.round(estimatedValue * 0.85), Math.round(estimatedValue * 1.15)],
      reason: "Svensk spelare har stark lokal samlarbas",
    };
  }
  if (estimatedValue > 500 || EBAY_TIER.some((s) => p.includes(s))) {
    return {
      platform: "EBAY",
      expectedRange: [Math.round(estimatedValue * 0.9), Math.round(estimatedValue * 1.3)],
      reason: estimatedValue > 500 ? "Värde >500 kr → bredare köpare på eBay" : "Internationell stjärna — eBay ger bättre pris",
    };
  }
  return {
    platform: "TRADERA",
    expectedRange: [Math.round(estimatedValue * 0.8), Math.round(estimatedValue * 1.1)],
    reason: "Mellantier — Tradera är smidigast",
  };
}