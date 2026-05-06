// Hard Block Engine — flags listings that should never be shown as deals.
// Severity tiers per spec: NEVER_BUY > HARD_BLOCK > RED_FLAG.
export type HardBlockSeverity = "RED_FLAG" | "HARD_BLOCK" | "NEVER_BUY";

const NEVER_BUY_TERMS = ["wcg", "23kt", "23 kt", "gold plated", "fake auto", "proxy", "replica", "facsimile"];
const HARD_BLOCK_TERMS = ["reprint", "custom", "mystery pack", "chaser pack", "digital card", "unofficial", "novelty"];
// All others below count as RED_FLAG (none currently — kept for future).

export function evaluateHardBlock(title: string): {
  blocked: boolean;
  reason: string | null;
  severity: HardBlockSeverity | null;
} {
  const t = title.toLowerCase();
  for (const term of NEVER_BUY_TERMS) {
    if (t.includes(term)) return { blocked: true, reason: `Innehåller "${term}"`, severity: "NEVER_BUY" };
  }
  for (const term of HARD_BLOCK_TERMS) {
    if (t.includes(term)) return { blocked: true, reason: `Innehåller "${term}"`, severity: "HARD_BLOCK" };
  }
  return { blocked: false, reason: null, severity: null };
}
