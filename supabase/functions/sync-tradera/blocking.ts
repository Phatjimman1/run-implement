// Hard Block Engine — flags listings that should never be shown as deals.
// Severity tiers per spec: NEVER_BUY > HARD_BLOCK > RED_FLAG.
export type HardBlockSeverity = "RED_FLAG" | "HARD_BLOCK" | "NEVER_BUY";

export type HardBlockResult = {
  blocked: boolean;
  severity: HardBlockSeverity | null;
  reasons: string[];
};

const NEVER_BUY_TERMS = ["wcg", "23kt", "23 kt", "gold plated", "fake auto", "proxy", "replica", "facsimile"];
const HARD_BLOCK_TERMS = ["reprint", "custom", "mystery pack", "chaser pack", "digital card", "unofficial", "novelty"];

const AUTO_TERMS = ["signed", "autograph", "auto", "signerad", "signering"];
const CERTIFIED_TERMS = ["certified", "topps certified", "panini certified", "certified autograph", "pack pulled", "on-card auto", "on card auto", "sticker auto"];

export function evaluateHardBlock(
  title: string,
  description?: string | null,
  subtitle?: string | null,
  itemSpecifics?: string | null,
): HardBlockResult {
  const corpus = [title, description ?? "", subtitle ?? "", itemSpecifics ?? ""].join(" \n ").toLowerCase();
  const reasons: string[] = [];
  let severity: HardBlockSeverity | null = null;

  for (const term of NEVER_BUY_TERMS) {
    if (corpus.includes(term)) {
      reasons.push(`Innehåller "${term}"`);
      severity = "NEVER_BUY";
    }
  }
  if (severity !== "NEVER_BUY") {
    for (const term of HARD_BLOCK_TERMS) {
      if (corpus.includes(term)) {
        reasons.push(`Innehåller "${term}"`);
        severity = "HARD_BLOCK";
      }
    }
  }

  // Auto-risk RED_FLAG: claimed auto without certification language
  const hasAutoClaim = AUTO_TERMS.some((t) => new RegExp(`\\b${t}\\b`).test(corpus));
  const hasCert = CERTIFIED_TERMS.some((t) => corpus.includes(t));
  if (hasAutoClaim && !hasCert) {
    reasons.push("Auto utan certifiering — risk för fake/custom");
    if (!severity) severity = "RED_FLAG";
  }

  const blocked = severity === "HARD_BLOCK" || severity === "NEVER_BUY";
  return { blocked, severity, reasons };
}
