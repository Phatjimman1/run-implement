// Card Hierarchy Engine – Release 4
// Classifies Panini Prizm and Topps Chrome cards into collector tiers.
// Backend-first; pure function over a listing's text fields.

export type CardHierarchyBrand = "PANINI_PRIZM" | "TOPPS_CHROME" | "UNKNOWN";
export type CardHierarchyTier = "S" | "A" | "B" | "C" | "D" | "E" | "F" | "UNKNOWN";
export type CollectorPriority =
  | "GRAIL"
  | "ELITE"
  | "HIGH"
  | "MEDIUM"
  | "LOW"
  | "BASE"
  | "UNKNOWN";

export interface CardHierarchyAnalysis {
  brand: CardHierarchyBrand;
  tier: CardHierarchyTier;
  parallelName: string | null;
  normalizedParallelName: string | null;
  numbering: string | null;
  hierarchyRank: number | null;
  scoreBonus: number;
  collectorPriority: CollectorPriority;
  isRookieRelevant: boolean;
  isAutoRelevant: boolean;
  isNumberedRelevant: boolean;
  reasoning: string;
  warnings: string[];
}

export interface HierarchyInput {
  title: string;
  description?: string | null;
  subtitle?: string | null;
  itemSpecifics?: string | null;
  brand?: string | null;
  isRookie?: boolean;
  isAuto?: boolean;
}

const TIER_RANK: Record<CardHierarchyTier, number> = {
  S: 1, A: 2, B: 3, C: 4, D: 5, E: 6, F: 7, UNKNOWN: 99,
};

const TIER_BONUS: Record<CardHierarchyTier, number> = {
  S: 40, A: 30, B: 22, C: 15, D: 10, E: 3, F: 0, UNKNOWN: 0,
};

const TIER_PRIORITY: Record<CardHierarchyTier, CollectorPriority> = {
  S: "GRAIL", A: "ELITE", B: "HIGH", C: "HIGH", D: "MEDIUM", E: "LOW", F: "BASE", UNKNOWN: "UNKNOWN",
};

// Hierarchy bonus cap (Tier S grail allowed full +40)
const MAX_HIERARCHY_BONUS = 25;

type Rule = {
  brand: CardHierarchyBrand;
  tier: CardHierarchyTier;
  parallelName: string;
  normalized: string;
  keywords: string[]; // lower-case
  numberingHint?: string | null;
};

// Order matters – more specific / rarer first.
const RULES: Rule[] = [
  // ── PANINI PRIZM – S
  r("PANINI_PRIZM", "S", "Black Prizm", "Black Prizm", ["black prizm"], "1/1"),
  r("PANINI_PRIZM", "S", "Black Shimmer", "Black Shimmer", ["black shimmer"], "1/1"),
  r("PANINI_PRIZM", "S", "Nebula Choice", "Nebula Choice", ["nebula choice", "nebula"], "1/1"),
  r("PANINI_PRIZM", "S", "Black Finite", "Black Finite", ["black finite"], "1/1"),
  r("PANINI_PRIZM", "S", "Gold Vinyl", "Gold Vinyl", ["gold vinyl"], "/5"),
  r("PANINI_PRIZM", "S", "Black Gold", "Black Gold", ["black gold"], "/5"),
  r("PANINI_PRIZM", "S", "Color Blast", "Color Blast", ["color blast", "colorblast"]),
  r("PANINI_PRIZM", "S", "Manga Prizm", "Manga", ["manga prizm", "manga"]),
  r("PANINI_PRIZM", "S", "Prizmania", "Prizmania", ["prizmania"]),
  r("PANINI_PRIZM", "S", "Groovy", "Groovy", ["groovy"]),
  r("PANINI_PRIZM", "S", "White Tiger Stripe", "White Tiger Stripe", ["white tiger stripe", "white tiger"]),
  r("PANINI_PRIZM", "S", "Tiger Stripe", "Tiger Stripe", ["tiger stripe"]),
  // ── PANINI PRIZM – A
  r("PANINI_PRIZM", "A", "Gold Prizm", "Gold Prizm", ["gold prizm", "gold /10"], "/10"),
  r("PANINI_PRIZM", "A", "Gold Shimmer", "Gold Shimmer", ["gold shimmer"], "/10"),
  r("PANINI_PRIZM", "A", "Gold Wave", "Gold Wave", ["gold wave"], "/10"),
  r("PANINI_PRIZM", "A", "Gold Ice", "Gold Ice", ["gold ice"], "/10"),
  r("PANINI_PRIZM", "A", "Green Choice", "Green Choice", ["green choice"], "/8"),
  r("PANINI_PRIZM", "A", "Green Sparkle", "Green Sparkle", ["green sparkle"], "/8"),
  r("PANINI_PRIZM", "A", "Lucky Envelope", "Lucky Envelope", ["lucky envelope"], "/8"),
  r("PANINI_PRIZM", "A", "Plum Blossom", "Plum Blossom", ["plum blossom"], "/8"),
  r("PANINI_PRIZM", "A", "Green Shimmer", "Green Shimmer", ["green shimmer"], "/5"),
  r("PANINI_PRIZM", "A", "Cherry Blossom", "Cherry Blossom", ["cherry blossom"], "/20"),
  r("PANINI_PRIZM", "A", "Mojo Prizm", "Mojo", ["mojo prizm"], "/25"),
  // ── PANINI PRIZM – B
  r("PANINI_PRIZM", "B", "Orange Prizm", "Orange Prizm", ["orange prizm", "orange /49"], "/49"),
  r("PANINI_PRIZM", "B", "Choice Blue", "Choice Blue", ["choice blue"], "/49"),
  r("PANINI_PRIZM", "B", "White Wave", "White Wave", ["white wave"], "/38"),
  r("PANINI_PRIZM", "B", "Blue Shimmer", "Blue Shimmer", ["blue shimmer"], "/35"),
  r("PANINI_PRIZM", "B", "Red Lazer", "Red Lazer", ["red lazer", "red laser"], "/35"),
  r("PANINI_PRIZM", "B", "Purple Pulsar", "Purple Pulsar", ["purple pulsar"], "/35"),
  r("PANINI_PRIZM", "B", "White Ice", "White Ice", ["white ice"], "/35"),
  r("PANINI_PRIZM", "B", "Pink Pulsar", "Pink Pulsar", ["pink pulsar"], "/42"),
  r("PANINI_PRIZM", "B", "Jade Dragon Scale", "Jade Dragon Scale", ["jade dragon scale", "dragon scale"], "/48"),
  r("PANINI_PRIZM", "B", "Orange Wave", "Orange Wave", ["orange wave"], "/60"),
  r("PANINI_PRIZM", "B", "Red Power", "Red Power", ["red power"], "/75"),
  r("PANINI_PRIZM", "B", "Dragon Year", "Dragon Year", ["dragon year"], "/88"),
  r("PANINI_PRIZM", "B", "Purple Prizm", "Purple Prizm", ["purple prizm", "purple /99"], "/99"),
  r("PANINI_PRIZM", "B", "Blue Seismic", "Blue Seismic", ["blue seismic"], "/99"),
  r("PANINI_PRIZM", "B", "Blue Pulsar", "Blue Pulsar", ["blue pulsar"], "/99"),
  // ── PANINI PRIZM – C
  r("PANINI_PRIZM", "C", "Blue Ice", "Blue Ice", ["blue ice"], "/125"),
  r("PANINI_PRIZM", "C", "Blue Wave", "Blue Wave", ["blue wave"], "/125"),
  r("PANINI_PRIZM", "C", "Purple Ice", "Purple Ice", ["purple ice"], "/149"),
  r("PANINI_PRIZM", "C", "White Prizm", "White Prizm", ["white prizm", "white /175"], "/175"),
  r("PANINI_PRIZM", "C", "Blue Prizm", "Blue Prizm", ["blue prizm", "blue /199"], "/199"),
  r("PANINI_PRIZM", "C", "Basketball Prizm", "Basketball Prizm", ["basketball prizm"], "/225"),
  r("PANINI_PRIZM", "C", "Skewed Prizm", "Skewed", ["skewed prizm", "skewed"], "/249"),
  r("PANINI_PRIZM", "C", "Pink Prizm", "Pink Prizm", ["pink prizm", "pink /249"], "/249"),
  r("PANINI_PRIZM", "C", "Red Prizm", "Red Prizm", ["red prizm", "red /299"], "/299"),
  // ── PANINI PRIZM – D
  r("PANINI_PRIZM", "D", "Silver Prizm", "Silver Prizm", ["silver prizm", "prizm silver"]),
  r("PANINI_PRIZM", "D", "Hyper", "Hyper", ["hyper prizm", "hyper"]),
  r("PANINI_PRIZM", "D", "Ruby Wave", "Ruby Wave", ["ruby wave"]),
  r("PANINI_PRIZM", "D", "Snakeskin", "Snakeskin", ["snakeskin"]),
  r("PANINI_PRIZM", "D", "Fast Break", "Fast Break", ["fast break"]),
  r("PANINI_PRIZM", "D", "White Sparkle", "White Sparkle", ["white sparkle"]),
  r("PANINI_PRIZM", "D", "Red Sparkle", "Red Sparkle", ["red sparkle"]),
  r("PANINI_PRIZM", "D", "Green Wave", "Green Wave", ["green wave"]),
  r("PANINI_PRIZM", "D", "Ice Prizm", "Ice", ["ice prizm"]),
  r("PANINI_PRIZM", "D", "Pulsar Prizm", "Pulsar", ["pulsar prizm"]),
  r("PANINI_PRIZM", "D", "Red White Blue", "Red White Blue", ["red white blue", "red, white, blue"]),
  r("PANINI_PRIZM", "D", "Green Prizm", "Green Prizm", ["green prizm"]),
  // ── PANINI PRIZM – E
  r("PANINI_PRIZM", "E", "Pink Ice", "Pink Ice", ["pink ice"]),
  r("PANINI_PRIZM", "E", "Orange Ice", "Orange Ice", ["orange ice"]),
  r("PANINI_PRIZM", "E", "Red Ice", "Red Ice", ["red ice"]),
  r("PANINI_PRIZM", "E", "Teal Ice", "Teal Ice", ["teal ice"]),
  r("PANINI_PRIZM", "E", "Green Pulsar", "Green Pulsar", ["green pulsar"]),
  r("PANINI_PRIZM", "E", "Green Ice", "Green Ice", ["green ice"]),
  r("PANINI_PRIZM", "E", "Multi Wave", "Multi Wave", ["multi wave"]),
  r("PANINI_PRIZM", "E", "Choice Blue Yellow Green", "Blue Yellow Green Choice", ["blue yellow green", "choice blue yellow green"]),

  // ── TOPPS CHROME – S
  r("TOPPS_CHROME", "S", "Superfractor Auto", "Superfractor Auto", ["superfractor auto"], "1/1"),
  r("TOPPS_CHROME", "S", "Superfractor", "Superfractor", ["superfractor", "super fractor"], "1/1"),
  r("TOPPS_CHROME", "S", "Red Refractor Auto", "Red Refractor Auto", ["red refractor auto"], "/5"),
  r("TOPPS_CHROME", "S", "Red Refractor", "Red Refractor", ["red refractor"], "/5"),
  r("TOPPS_CHROME", "S", "FrozenFractor", "FrozenFractor", ["frozenfractor", "frozen fractor"]),
  r("TOPPS_CHROME", "S", "Logofractor Superfractor", "Logofractor Superfractor", ["logofractor superfractor"]),
  r("TOPPS_CHROME", "S", "Helix SSP", "Helix", ["helix"]),
  r("TOPPS_CHROME", "S", "Radiating Rookies", "Radiating Rookies", ["radiating rookies"]),
  r("TOPPS_CHROME", "S", "Let's Go SSP", "Let's Go", ["let's go", "let’s go", "lets go"]),
  r("TOPPS_CHROME", "S", "Anime SSP", "Anime", ["anime"]),
  r("TOPPS_CHROME", "S", "White Refractor SSP", "White Refractor SSP", ["white refractor ssp"]),
  // ── TOPPS CHROME – A
  r("TOPPS_CHROME", "A", "Gold Refractor", "Gold Refractor", ["gold refractor"], "/50"),
  r("TOPPS_CHROME", "A", "Gold Wave Refractor", "Gold Wave Refractor", ["gold wave refractor", "gold wave"], "/50"),
  r("TOPPS_CHROME", "A", "Gold Mini-Diamond", "Gold Mini-Diamond", ["gold mini-diamond", "gold mini diamond"], "/50"),
  r("TOPPS_CHROME", "A", "Orange Refractor", "Orange Refractor", ["orange refractor"], "/25"),
  r("TOPPS_CHROME", "A", "Orange Wave", "Orange Wave", ["orange wave"], "/25"),
  r("TOPPS_CHROME", "A", "Black Refractor", "Black Refractor", ["black refractor"], "/10"),
  r("TOPPS_CHROME", "A", "Black Wave", "Black Wave", ["black wave"], "/10"),
  r("TOPPS_CHROME", "A", "Red Lava", "Red Lava", ["red lava"], "/5"),
  r("TOPPS_CHROME", "A", "Red Wave", "Red Wave", ["red wave"], "/5"),
  r("TOPPS_CHROME", "A", "Sapphire Gold", "Sapphire Gold", ["sapphire gold"], "/50"),
  r("TOPPS_CHROME", "A", "Sapphire Orange", "Sapphire Orange", ["sapphire orange"], "/25"),
  // ── TOPPS CHROME – B
  r("TOPPS_CHROME", "B", "Blue Refractor", "Blue Refractor", ["blue refractor"], "/150"),
  r("TOPPS_CHROME", "B", "Blue Wave", "Blue Wave", ["blue wave"], "/150"),
  r("TOPPS_CHROME", "B", "Aqua Refractor", "Aqua Refractor", ["aqua refractor"], "/199"),
  r("TOPPS_CHROME", "B", "Aqua Wave", "Aqua Wave", ["aqua wave"], "/199"),
  r("TOPPS_CHROME", "B", "Green Refractor", "Green Refractor", ["green refractor"], "/99"),
  r("TOPPS_CHROME", "B", "Green Wave", "Green Wave", ["green wave"], "/99"),
  r("TOPPS_CHROME", "B", "Purple Refractor", "Purple Refractor", ["purple refractor"], "/250"),
  r("TOPPS_CHROME", "B", "Purple Sonar", "Purple Sonar", ["purple sonar"], "/275"),
  r("TOPPS_CHROME", "B", "Magenta Refractor", "Magenta Refractor", ["magenta refractor", "magenta"], "/399"),
  r("TOPPS_CHROME", "B", "Pink Refractor", "Pink Refractor", ["pink refractor"], "/399"),
  // ── TOPPS CHROME – C
  r("TOPPS_CHROME", "C", "X-Fractor", "X-Fractor", ["x-fractor", "xfractor", "x fractor"]),
  r("TOPPS_CHROME", "C", "RayWave", "RayWave", ["raywave", "ray wave"]),
  r("TOPPS_CHROME", "C", "Prism Refractor", "Prism Refractor", ["prism refractor"]),
  r("TOPPS_CHROME", "C", "Speckle Refractor", "Speckle Refractor", ["speckle refractor"]),
  r("TOPPS_CHROME", "C", "Lava Refractor", "Lava Refractor", ["lava refractor"]),
  r("TOPPS_CHROME", "C", "Sonar Refractor", "Sonar Refractor", ["sonar refractor"]),
  r("TOPPS_CHROME", "C", "Logofractor", "Logofractor", ["logofractor"]),
  r("TOPPS_CHROME", "C", "Sapphire Base", "Sapphire", ["sapphire chrome", "sapphire"]),
  // ── TOPPS CHROME – D
  r("TOPPS_CHROME", "D", "Refractor", "Refractor", ["refractor"]),
  r("TOPPS_CHROME", "D", "Sepia Refractor", "Sepia", ["sepia refractor", "sepia"]),
  r("TOPPS_CHROME", "D", "Mojo Refractor", "Mojo Refractor", ["mojo refractor"]),
  // ── TOPPS CHROME – E
  r("TOPPS_CHROME", "E", "Pink Chrome", "Pink", ["pink chrome"]),
  r("TOPPS_CHROME", "E", "Green Chrome", "Green", ["green chrome"]),
  r("TOPPS_CHROME", "E", "Yellow Chrome", "Yellow", ["yellow chrome"]),
  r("TOPPS_CHROME", "E", "Purple Chrome", "Purple", ["purple chrome"]),
  r("TOPPS_CHROME", "E", "Holiday Chrome", "Holiday", ["holiday chrome", "holiday refractor"]),
];

function r(
  brand: CardHierarchyBrand,
  tier: CardHierarchyTier,
  parallelName: string,
  normalized: string,
  keywords: string[],
  numberingHint: string | null = null,
): Rule {
  return { brand, tier, parallelName, normalized, keywords: keywords.map((k) => k.toLowerCase()), numberingHint };
}

function detectBrand(text: string): CardHierarchyBrand {
  const t = text.toLowerCase();
  const prizmTerms = ["panini prizm", "silver prizm", "prizm silver", "color blast", "tiger stripe", "manga prizm", "black finite", "gold vinyl"];
  const chromeTerms = ["topps chrome", "chrome basketball", "chrome refractor", "x-fractor", "xfractor", "superfractor", "logofractor", "sapphire chrome", "bowman chrome"];
  const hasChrome = chromeTerms.some((k) => t.includes(k));
  const hasPrizm = prizmTerms.some((k) => t.includes(k));
  if (hasChrome) return "TOPPS_CHROME";
  if (hasPrizm) return "PANINI_PRIZM";
  // Bare "prizm" (NBA/basketball context)
  if (/\bprizm\b/.test(t) && /(nba|basketball|basket|panini)/.test(t)) return "PANINI_PRIZM";
  if (/\bprizm\b/.test(t)) return "PANINI_PRIZM";
  // Bare "chrome" only with supportive context
  if (/\bchrome\b/.test(t) && /(topps|bowman|refractor|x-?fractor|superfractor|logofractor|sapphire)/.test(t)) return "TOPPS_CHROME";
  return "UNKNOWN";
}

export function normalizeParallelName(input: string): string {
  let s = input.toLowerCase().trim();
  s = s.replace(/\//g, " /");
  s = s.replace(/\s+/g, " ");
  if (/x[\s-]?fractor/.test(s)) return "X-Fractor";
  if (/super[\s-]?fractor/.test(s)) return "Superfractor";
  if (/(prizm silver|silver prizm)/.test(s)) return "Silver Prizm";
  // Title-case
  return s.replace(/\s*\/\s*\d+/g, "").trim()
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function detectNumbering(text: string): string | null {
  const t = text.toLowerCase();
  if (/\b(1\s*\/\s*1|one of one|1 of 1)\b/.test(t)) return "1/1";
  const m = t.match(/(?:numbered\s*(?:to\s*|\/)|out of\s*|\/)\s*(\d{1,4})\b/);
  if (m) return `/${m[1]}`;
  const m2 = text.match(/\/\s*(\d{1,4})\b/);
  if (m2) return `/${m2[1]}`;
  return null;
}

function detectRookie(text: string): boolean {
  return /\b(rc|rookie|rookie card|debut rookie|rookie refractor|rookie prizm)\b/i.test(text);
}
function detectAuto(text: string): boolean {
  return /\b(auto|autograph|signed|signerad|signering|certified autograph|topps certified auto|panini certified auto)\b/i.test(text);
}

export function analyzeCardHierarchy(input: HierarchyInput): CardHierarchyAnalysis {
  const text = [input.title, input.subtitle, input.description, input.itemSpecifics, input.brand]
    .filter(Boolean)
    .join(" ");
  const lower = text.toLowerCase();
  const brand = detectBrand(text);
  const numbering = detectNumbering(text);
  const isRookieRelevant = !!input.isRookie || detectRookie(text);
  const isAutoRelevant = !!input.isAuto || detectAuto(text);
  const warnings: string[] = [];

  // Find best matching rule (most specific keyword wins, then highest tier)
  let match: Rule | null = null;
  let matchKeywordLen = 0;
  for (const rule of RULES) {
    if (rule.brand !== brand && brand !== "UNKNOWN") continue;
    for (const kw of rule.keywords) {
      if (lower.includes(kw)) {
        const score = kw.length + (TIER_RANK[rule.tier] <= 3 ? 5 : 0);
        if (score > matchKeywordLen) {
          match = rule;
          matchKeywordLen = score;
        }
      }
    }
  }

  if (!match) {
    // Base fallback
    if (brand !== "UNKNOWN") {
      const tier: CardHierarchyTier = "F";
      return {
        brand,
        tier,
        parallelName: isRookieRelevant ? "Base Rookie" : "Base Veteran",
        normalizedParallelName: isRookieRelevant ? "Base Rookie" : "Base Veteran",
        numbering,
        hierarchyRank: TIER_RANK[tier],
        scoreBonus: 0,
        collectorPriority: TIER_PRIORITY[tier],
        isRookieRelevant,
        isAutoRelevant,
        isNumberedRelevant: numbering !== null,
        reasoning: `${brand === "PANINI_PRIZM" ? "Panini Prizm" : "Topps Chrome"} base ${isRookieRelevant ? "rookie" : "veteran"}; collector hierarchy bonus is neutral.`,
        warnings,
      };
    }
    return {
      brand: "UNKNOWN",
      tier: "UNKNOWN",
      parallelName: null,
      normalizedParallelName: null,
      numbering,
      hierarchyRank: null,
      scoreBonus: 0,
      collectorPriority: "UNKNOWN",
      isRookieRelevant,
      isAutoRelevant,
      isNumberedRelevant: numbering !== null,
      reasoning: "No Prizm/Chrome hierarchy match.",
      warnings,
    };
  }

  let tier: CardHierarchyTier = match.tier;
  let priority: CollectorPriority = TIER_PRIORITY[tier];
  let bonus = TIER_BONUS[tier];

  // Special rookie upgrades (within Tier D)
  if (isRookieRelevant && match.brand === "PANINI_PRIZM" && match.normalized === "Silver Prizm") {
    priority = "HIGH";
    bonus = 15;
  }
  if (isRookieRelevant && match.brand === "TOPPS_CHROME" && match.normalized === "Refractor") {
    priority = "HIGH";
    bonus = 15;
  }
  if (isRookieRelevant && match.brand === "TOPPS_CHROME" && match.normalized === "X-Fractor") {
    priority = "HIGH";
    bonus = 18;
  }

  // Cap (Tier S grails may use full +40)
  if (tier !== "S" && bonus > MAX_HIERARCHY_BONUS) bonus = MAX_HIERARCHY_BONUS;

  const reasoning = buildReasoning(match, isRookieRelevant);

  return {
    brand: match.brand,
    tier,
    parallelName: match.parallelName,
    normalizedParallelName: match.normalized,
    numbering: numbering ?? match.numberingHint ?? null,
    hierarchyRank: TIER_RANK[tier],
    scoreBonus: bonus,
    collectorPriority: priority,
    isRookieRelevant,
    isAutoRelevant,
    isNumberedRelevant: numbering !== null || !!match.numberingHint,
    reasoning,
    warnings,
  };
}

function buildReasoning(rule: Rule, rookie: boolean): string {
  const brandLabel = rule.brand === "PANINI_PRIZM" ? "Panini Prizm" : "Topps Chrome";
  if (rule.tier === "S") return `${rule.parallelName} is a top-tier ${brandLabel} grail parallel.`;
  if (rule.tier === "A") return `${rule.parallelName} is an elite ${brandLabel} parallel with strong collector demand.`;
  if (rule.tier === "B") return `${rule.parallelName} is a major ${brandLabel} hit; solid collector demand.`;
  if (rule.tier === "C") {
    if (rookie && rule.normalized === "X-Fractor") return "X-Fractor Rookie is a strong Chrome collector target with high hobby prestige.";
    return `${rule.parallelName} is a strong collector card within ${brandLabel}.`;
  }
  if (rule.tier === "D") {
    if (rookie && rule.normalized === "Silver Prizm") return "Silver Prizm Rookie is one of the most important modern Prizm rookie targets.";
    if (rookie && rule.normalized === "Refractor") return "Rookie Refractor is the core Topps Chrome rookie target.";
    return `${rule.parallelName} is an iconic non-numbered ${brandLabel} parallel.`;
  }
  if (rule.tier === "E") return `${rule.parallelName} is a common retail ${brandLabel} parallel.`;
  return `${rule.parallelName} – ${brandLabel} base.`;
}

export const HIERARCHY_TIER_RANK = TIER_RANK;