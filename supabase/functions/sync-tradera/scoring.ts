// Scoring engine for NBA Card Sniper.
// Implements the rules from the spec (sections 6-12, 18-19).

export const BLUE_CHIP_PLAYERS = [
  "Victor Wembanyama", "Wembanyama",
  "Anthony Edwards",
  "Shai Gilgeous-Alexander", "Shai Gilgeous Alexander", "SGA",
  "Luka Doncic", "Luka Dončić",
  "Nikola Jokic", "Nikola Jokić",
  "Giannis Antetokounmpo", "Giannis",
  "Jayson Tatum",
  "Stephen Curry", "Steph Curry",
  "LeBron James", "LeBron",
  "Kevin Durant",
];

export const ROOKIE_HIGH_UPSIDE = [
  "Cooper Flagg", "Dylan Harper", "Ace Bailey", "VJ Edgecombe", "Kon Knueppel",
  "Tre Johnson", "Jeremiah Fears", "Khaman Maluach", "Egor Demin", "Stephon Castle",
  "Reed Sheppard", "Alexandre Sarr", "Matas Buzelis", "Jared McCain",
  "Chet Holmgren", "Paolo Banchero", "Brandon Miller", "Scoot Henderson",
  "Amen Thompson", "Ausar Thompson",
];

export const SWEDISH_NORDIC = [
  "Pelle Larsson", "Bobi Klintman", "Lauri Markkanen", "Nikola Jovic",
];

export const LEGENDS = [
  "Michael Jordan", "Jordan", "Kobe Bryant", "Kobe", "Shaquille O'Neal", "Shaq",
  "Tim Duncan", "Kevin Garnett", "Dirk Nowitzki", "Allen Iverson", "Vince Carter",
  "Tracy McGrady", "Magic Johnson", "Larry Bird", "Kareem Abdul-Jabbar",
  "Hakeem Olajuwon", "Charles Barkley", "Penny Hardaway", "Dwyane Wade",
  "Carmelo Anthony",
];

export const BRAND_TIERS: Record<string, "S" | "A" | "B" | "C"> = {
  "topps chrome": "S",
  "panini prizm": "S",
  "prizm": "S",
  "national treasures": "A",
  "topps finest": "A",
  "donruss optic": "A",
  "optic": "A",
  "panini select": "B",
  "select": "B",
  "obsidian": "B",
  "mosaic": "B",
  "topps flagship": "C",
  "bowman university": "C",
  "topps now": "C",
  "hoops": "C",
  "bowman chrome": "A",
};

export const RED_FLAG_TERMS = [
  "reprint", "custom", "replica", "facsimile", "23kt", "23 kt", "wcg",
  "mystery pack", "chaser pack", "digital", "novelty", "fake",
];

export const NEGATIVE_FILTER = ["pokemon", "fotboll", "hockey", "yu-gi-oh", "yugioh"];

export type Recommendation = "BUY_NOW" | "BID" | "WATCH" | "SKIP" | "RED_FLAG";

export interface ParsedTitle {
  players: string[];
  brands: string[];
  sets: string[];
  cardTypes: string[];
  isRookie: boolean;
  isAuto: boolean;
  isCertifiedAuto: boolean;
  isRefractor: boolean;
  isXFractor: boolean;
  isNumbered: boolean;
  numberedPrintRun: number | null;
  isInsert: boolean;
  isCollege: boolean;
  isReprintRisk: boolean;
  isDamaged: boolean;
  cardCount: number | null;
  redFlagTerms: string[];
  isBlueChip: boolean;
  isRookieUpside: boolean;
  isSwedish: boolean;
  isLegend: boolean;
}

function findPlayers(title: string, list: string[]): string[] {
  const lower = title.toLowerCase();
  const found = new Set<string>();
  for (const name of list) {
    if (lower.includes(name.toLowerCase())) found.add(name);
  }
  return [...found];
}

export function parseTitle(title: string): ParsedTitle {
  const t = title.toLowerCase();

  const blueChip = findPlayers(title, BLUE_CHIP_PLAYERS);
  const rookieUpside = findPlayers(title, ROOKIE_HIGH_UPSIDE);
  const swedish = findPlayers(title, SWEDISH_NORDIC);
  const legends = findPlayers(title, LEGENDS);
  const players = [...new Set([...blueChip, ...rookieUpside, ...swedish, ...legends])];

  const brands: string[] = [];
  const sets: string[] = [];
  for (const key of Object.keys(BRAND_TIERS)) {
    if (t.includes(key)) {
      if (key.includes("chrome") || key.includes("prizm") || key.includes("optic") || key.includes("finest") || key.includes("select") || key.includes("obsidian") || key.includes("mosaic") || key.includes("treasures") || key.includes("now")) {
        sets.push(key);
      }
      if (key.startsWith("topps")) brands.push("Topps");
      else if (key.startsWith("panini") || key === "prizm" || key === "select" || key === "obsidian" || key === "mosaic" || key === "optic" || key === "national treasures") brands.push("Panini");
      else if (key.startsWith("donruss")) brands.push("Panini");
      else if (key.startsWith("bowman")) brands.push("Bowman");
    }
  }

  const isRookie = /\b(rc|rookie)\b/i.test(title);
  const isAuto = /\b(auto|autograph|signed|signature)\b/i.test(title);
  const isCertifiedAuto = isAuto && /(certified|on[- ]card|sticker)/i.test(title)
    || (isAuto && /(chrome|prizm|optic|finest|select|obsidian|treasures|mosaic|donruss)/i.test(title) && !/replica|custom|reprint|facsimile/i.test(title));
  const isRefractor = /\brefractor|refractors\b/i.test(title);
  const isXFractor = /x-?fractor/i.test(title);
  const numberedMatch = title.match(/\/\s*(\d{1,4})\b/);
  const numberedPrintRun = numberedMatch ? parseInt(numberedMatch[1], 10) : null;
  const isNumbered = numberedPrintRun !== null;
  const isInsert = /\binsert\b|\bserenity\b|\braywave\b/i.test(title) && !isRefractor && !isXFractor;
  const isCollege = /\b(college|nil|bowman university|ncaa)\b/i.test(title);
  const isReprintRisk = /reprint|replica|custom|facsimile|novelty|23\s*kt|wcg/i.test(title);
  const isDamaged = /\b(skadad|damaged|crease|veck|repa|trasig)\b/i.test(title);

  const lotMatch = title.match(/(\d{1,4})\s*(st|stk|olika|cards|kort|refractors?|prizms?)/i);
  const cardCount = lotMatch ? parseInt(lotMatch[1], 10) : null;

  const redFlagTerms = RED_FLAG_TERMS.filter((r) => t.includes(r));

  return {
    players,
    brands: [...new Set(brands)],
    sets: [...new Set(sets)],
    cardTypes: [
      isRookie && "RC",
      isAuto && "Auto",
      isRefractor && "Refractor",
      isXFractor && "X-Fractor",
      isInsert && "Insert",
      isNumbered && `/${numberedPrintRun}`,
    ].filter(Boolean) as string[],
    isRookie,
    isAuto,
    isCertifiedAuto: !!isCertifiedAuto,
    isRefractor,
    isXFractor,
    isNumbered,
    numberedPrintRun,
    isInsert,
    isCollege,
    isReprintRisk,
    isDamaged,
    cardCount: cardCount && cardCount > 1 && cardCount < 1000 ? cardCount : null,
    redFlagTerms,
    isBlueChip: blueChip.length > 0,
    isRookieUpside: rookieUpside.length > 0,
    isSwedish: swedish.length > 0,
    isLegend: legends.length > 0,
  };
}

export interface ScoreInput {
  title: string;
  currentPrice: number | null;
  shippingCost: number | null;
  endTime: Date | null;
  bidCount: number | null;
  imageCount?: number;
  compMedian?: number | null;
}

export interface ScoreResult extends ParsedTitle {
  valueScore: number;
  flipScore: number;
  holdScore: number;
  riskScore: number;
  dealScore: number;
  recommendation: Recommendation;
  maxBid: number;
  estimatedMarketValue: number;
  pricePerCard: number | null;
  reasoning: string;
  tags: string[];
}

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, n));
}

export function scoreListing(input: ScoreInput): ScoreResult {
  const p = parseTitle(input.title);
  const price = input.currentPrice ?? 0;
  const shipping = input.shippingCost ?? 0;
  const totalCost = price + shipping;
  const imageCount = input.imageCount ?? 0;
  const compMedian = input.compMedian ?? null;

  // Estimated market value (very rough, regelbaserat)
  let mv = 60;
  if (p.isAuto) mv += 200;
  if (p.isCertifiedAuto) mv += 100;
  if (p.isRefractor) mv += 80;
  if (p.isXFractor) mv += 120;
  if (p.isNumbered && p.numberedPrintRun) {
    if (p.numberedPrintRun <= 25) mv += 400;
    else if (p.numberedPrintRun <= 99) mv += 200;
    else mv += 60;
  }
  if (p.isRookie) mv += 60;
  if (p.isBlueChip) mv += 150;
  if (p.isRookieUpside) mv += 100;
  if (p.isLegend) mv += 80;
  if (p.isSwedish) mv += 60;
  if (p.isInsert) mv -= 30;
  if (p.isCollege) mv -= 30;

  // ── Base points by card type
  let base = 0;
  if (p.isCertifiedAuto) base += 30;
  if (p.isRookie && p.isAuto) base += 35;
  // Rookie Patch Auto (RPA) – elite tier
  if (/\brpa\b|rookie patch auto|patch auto/i.test(input.title)) base += 25;
  if (p.isRefractor || p.sets.includes("prizm") || p.sets.includes("panini prizm")) base += 20;
  if (p.isXFractor) base += 22;
  if (p.isNumbered) base += 25;
  if (p.numberedPrintRun !== null && p.numberedPrintRun <= 99) base += 35;
  if (p.isRookie) base += 20;
  if (p.sets.some((s) => ["topps chrome", "prizm", "panini prizm", "donruss optic", "optic"].includes(s))) base += 15;
  if (p.sets.includes("topps finest")) base += 10;
  if (p.sets.includes("national treasures") && (p.isAuto || p.isNumbered)) base += 15;
  // Spec: Obsidian RPA / Auto +15
  if (p.sets.includes("obsidian") && p.isAuto) base += 15;
  if (p.isLegend) base += 10;
  if (p.isBlueChip) base += 20;
  if (p.isRookieUpside) base += 15;

  // ── Price bonus
  let priceBonus = 0;
  if (totalCost > 0) {
    if (totalCost < 50) priceBonus += 20;
    else if (totalCost < 100) priceBonus += 15;
    else if (totalCost < 200) priceBonus += 10;
    else if (totalCost < 300) priceBonus += 5;
    if (totalCost > 500 && !p.isAuto && !p.isXFractor && p.numberedPrintRun === null) priceBonus -= 10;
    if (totalCost > 1000 && !p.isBlueChip && !p.isAuto && p.numberedPrintRun === null) priceBonus -= 20;
  }

  // ── Auction timing
  let timing = 0;
  if (input.endTime) {
    const minsLeft = (input.endTime.getTime() - Date.now()) / 60000;
    if (minsLeft > 0 && minsLeft < 60 && (input.bidCount ?? 0) < 3) timing += 15;
    else if (minsLeft > 0 && minsLeft < 24 * 60) timing += 8;
  }
  if ((input.bidCount ?? 0) > 5) timing -= 5;
  if (shipping > 79) timing -= 10;

  // ── Negative
  let neg = 0;
  if (p.isInsert) neg -= 15;
  if (p.isCollege) neg -= 15;
  if (p.sets.includes("topps now")) neg -= 10;
  if (p.isReprintRisk) neg -= 60;
  if (p.redFlagTerms.includes("wcg")) neg -= 40;
  if (p.redFlagTerms.includes("mystery pack") || p.redFlagTerms.includes("chaser pack")) neg -= 50;
  if (p.isDamaged) neg -= 40;
  if (p.isAuto && !p.isCertifiedAuto && !p.sets.length) neg -= 40;
  // Spec: Poor images
  if (imageCount === 0) neg -= 15;
  // Spec: No back photo on expensive card
  if (imageCount < 2 && totalCost > 300) neg -= 10;
  // Spec: Hype price (heated bidding pushing price above market)
  if ((input.bidCount ?? 0) >= 8 && compMedian && compMedian > 0 && totalCost > compMedian * 1.3) neg -= 25;

  // Hype check: high price + low tier
  if (totalCost > 500 && p.isInsert) neg -= 25;

  // Lot price-per-card
  let pricePerCard: number | null = null;
  if (p.cardCount && p.cardCount > 1 && totalCost > 0) {
    pricePerCard = totalCost / p.cardCount;
    if (p.isRefractor) {
      if (pricePerCard < 10) base += 25;
      else if (pricePerCard < 20) base += 12;
      else if (pricePerCard > 40) neg -= 10;
    } else if (pricePerCard < 5) base += 10;
  }

  // ── Compose sub-scores
  const valueScore = clamp(50 + priceBonus * 2 + (pricePerCard && pricePerCard < 15 ? 20 : 0));
  const flipScore = clamp(40 + base * 0.7 + timing);
  const holdScore = clamp(40 + (p.isBlueChip ? 25 : 0) + (p.isRookieUpside ? 20 : 0) + (p.isLegend ? 15 : 0) + (p.isNumbered ? 15 : 0) + (p.isCertifiedAuto ? 10 : 0));
  const riskScore = clamp(20 - neg + (p.isReprintRisk ? 50 : 0) + (p.isInsert ? 15 : 0) + (p.isDamaged ? 30 : 0) + (p.isAuto && !p.isCertifiedAuto ? 25 : 0));

  const dealScore = clamp(50 + base + priceBonus + timing + neg);

  let recommendation: Recommendation = "WATCH";
  if (dealScore >= 80) recommendation = "BUY_NOW";
  else if (dealScore >= 65) recommendation = "BID";
  else if (dealScore >= 50) recommendation = "WATCH";
  else if (dealScore >= 25) recommendation = "SKIP";
  else recommendation = "RED_FLAG";

  // Force RED_FLAG on hard signals
  if (p.isReprintRisk || p.redFlagTerms.length >= 2) recommendation = "RED_FLAG";

  // ── Max bid
  let confidence = 0.65;
  if (recommendation === "BUY_NOW") confidence = 0.75;
  else if (riskScore > 60) confidence = 0.4;
  else if (riskScore > 40) confidence = 0.5;
  if (p.isInsert || p.isCollege) confidence = Math.min(confidence, 0.4);

  const riskDiscount = Math.round(riskScore * 0.5);
  const maxBidRaw = Math.max(0, mv * confidence - shipping - riskDiscount);
  const maxBid = recommendation === "RED_FLAG" ? 0 : Math.round(maxBidRaw / 5) * 5;

  // ── Tags
  const tags: string[] = [];
  if (p.sets.includes("topps chrome")) tags.push("Chrome");
  if (p.isRefractor) tags.push("Refractor");
  if (p.isXFractor) tags.push("X-Fractor");
  if (p.isAuto) tags.push("Auto");
  if (p.isRookie) tags.push("RC");
  if (p.isNumbered) tags.push(`/${p.numberedPrintRun}`);
  if (p.isBlueChip) tags.push("Blue Chip");
  if (p.isRookieUpside) tags.push("Rookie Upside");
  if (p.isLegend) tags.push("Legend");
  if (p.isSwedish) tags.push("Swedish Edge");
  if (p.isInsert) tags.push("Insert");
  if (p.isCollege) tags.push("College");
  if (p.isReprintRisk) tags.push("Reprint Risk");
  if (p.isDamaged) tags.push("Damaged");
  if (recommendation === "RED_FLAG") tags.push("Red Flag");
  if (totalCost > 500 && (p.isInsert || (!p.isAuto && !p.isXFractor))) tags.push("Overpriced");

  // ── Reasoning
  const reasoning = buildReasoning({ parsed: p, dealScore, recommendation, maxBid, totalCost, pricePerCard });

  return {
    ...p,
    valueScore,
    flipScore,
    holdScore,
    riskScore,
    dealScore,
    recommendation,
    maxBid,
    estimatedMarketValue: Math.round(mv),
    pricePerCard: pricePerCard ? Math.round(pricePerCard * 100) / 100 : null,
    reasoning,
    tags,
  };
}

function buildReasoning(args: {
  parsed: ParsedTitle;
  dealScore: number;
  recommendation: Recommendation;
  maxBid: number;
  totalCost: number;
  pricePerCard: number | null;
}): string {
  const { parsed: p, recommendation, maxBid, totalCost, pricePerCard } = args;

  if (recommendation === "RED_FLAG") {
    if (p.isReprintRisk) return "Röd flagga: titeln innehåller varningar (reprint/replica/23KT/WCG). Troligen novelty och inte investeringskort.";
    return "Röd flagga: flera varningssignaler. Undvik om målet är investering.";
  }

  const parts: string[] = [];
  if (p.isAuto && p.isRefractor) parts.push("Auto + refractor ger bra risk/reward");
  else if (p.isXFractor && (p.isBlueChip || p.isRookieUpside)) parts.push("X-Fractor på stark spelare har stark flip-potential");
  else if (p.isAuto) parts.push("Auto-kort lyfter värdet");
  else if (p.isRefractor) parts.push("Refractor är likvid på Tradera");
  else if (p.isInsert) parts.push("Insert-kort har lägre likviditet");

  if (p.isSwedish) parts.push("svensk spelare ger lokal samlarbas");
  if (p.isBlueChip) parts.push("blue chip-spelare med stabil efterfrågan");
  if (p.isRookieUpside) parts.push("rookie med upside");
  if (p.isLegend) parts.push("legend med stabil samlarbas");

  if (pricePerCard !== null) parts.push(`pris per kort ${pricePerCard.toFixed(1)} kr`);

  if (totalCost > 0) {
    if (recommendation === "BUY_NOW") parts.push(`pris ${Math.round(totalCost)} kr ligger under bedömt maxbud ${maxBid} kr`);
    else if (recommendation === "BID") parts.push(`snipa upp till ${maxBid} kr`);
    else if (recommendation === "SKIP") parts.push(`pris ${Math.round(totalCost)} kr är för högt mot maxbud ${maxBid} kr`);
    else parts.push(`bevaka, maxbud ${maxBid} kr`);
  }

  if (parts.length === 0) return "Osäker analys – kontrollera bild/skick manuellt.";
  const sentence = parts.join(", ");
  return sentence.charAt(0).toUpperCase() + sentence.slice(1) + ".";
}