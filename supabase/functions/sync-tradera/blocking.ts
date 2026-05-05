// Hard Block Engine — flags listings that should never be shown as deals.
const HARD_BLOCK_TERMS = [
  "wcg", "23kt", "23 kt", "reprint", "custom card", "novelty",
  "mystery pack", "mystery box", "chaser pack", "facsimile", "replica",
];

export function evaluateHardBlock(title: string): { blocked: boolean; reason: string | null } {
  const t = title.toLowerCase();
  for (const term of HARD_BLOCK_TERMS) {
    if (t.includes(term)) return { blocked: true, reason: `Innehåller "${term}"` };
  }
  return { blocked: false, reason: null };
}