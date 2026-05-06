// Exit Strategy Engine — recommends where & how to sell.
const EBAY_TIER = [
  "wembanyama", "victor wembanyama", "shai gilgeous", "sga",
  "cooper flagg", "luka doncic", "luka dončić", "lebron", "jordan", "kobe",
  "nikola jokic", "stephen curry", "kevin durant",
];
const SWEDISH_TIER = ["pelle larsson", "bobi klintman", "lauri markkanen"];
const BLUE_CHIP = [...EBAY_TIER, "giannis", "tatum", "anthony edwards"];

export type ExitRecommendation = {
  platform: "EBAY" | "TRADERA";
  expectedRange: [number, number];
  strategy: "AUCTION" | "BUY_NOW" | "LOT" | "HOLD";
  reasoning: string;
};

export function recommendExit(args: {
  player?: string | null;
  estimatedValue: number;
  isLot?: boolean;
}): ExitRecommendation {
  const { player, estimatedValue, isLot } = args;
  const p = (player ?? "").toLowerCase();
  const isBlueChip = BLUE_CHIP.some((s) => p.includes(s));

  if (isLot) {
    return {
      platform: "TRADERA",
      strategy: "LOT",
      expectedRange: [Math.round(estimatedValue * 0.7), Math.round(estimatedValue * 0.95)],
      reasoning: "Bulk/lott säljs bäst på Tradera",
    };
  }
  if (estimatedValue > 1000 && isBlueChip) {
    return {
      platform: "EBAY",
      strategy: "HOLD",
      expectedRange: [Math.round(estimatedValue * 1.05), Math.round(estimatedValue * 1.4)],
      reasoning: "Blue chip + högt värde — håll och sälj senare",
    };
  }
  if (SWEDISH_TIER.some((s) => p.includes(s))) {
    return {
      platform: "TRADERA",
      strategy: estimatedValue > 300 ? "AUCTION" : "BUY_NOW",
      expectedRange: [Math.round(estimatedValue * 0.85), Math.round(estimatedValue * 1.15)],
      reasoning: "Svensk spelare har stark lokal samlarbas",
    };
  }
  if (estimatedValue > 500 || EBAY_TIER.some((s) => p.includes(s))) {
    return {
      platform: "EBAY",
      strategy: "AUCTION",
      expectedRange: [Math.round(estimatedValue * 0.9), Math.round(estimatedValue * 1.3)],
      reasoning: estimatedValue > 500 ? "Värde >500 kr → bredare köpare på eBay" : "Internationell stjärna — eBay ger bättre pris",
    };
  }
  if (estimatedValue > 300) {
    return {
      platform: "TRADERA",
      strategy: "AUCTION",
      expectedRange: [Math.round(estimatedValue * 0.85), Math.round(estimatedValue * 1.15)],
      reasoning: "Mellantier — Tradera-auktion fångar samlare",
    };
  }
  return {
    platform: "TRADERA",
    strategy: "BUY_NOW",
    expectedRange: [Math.round(estimatedValue * 0.8), Math.round(estimatedValue * 1.1)],
    reasoning: "Lågt värde — Köp nu för snabb omsättning",
  };
}
