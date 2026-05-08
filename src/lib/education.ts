// Curated, static hobby education content. No AI.
// Looked up by tag (parallel name, brand, concept) — only shown when tag is present on the card.

export type EducationEntry = {
  tag: string;
  title: string;
  body: string;
};

const ENTRIES: Record<string, Omit<EducationEntry, "tag">> = {
  "x-fractor": {
    title: "X-Fractor",
    body: "X-Fractor är en mid-tier Topps Chrome-parallel med distinkta X-mönster. Ofta starkare prispremie än vanlig refractor och samlas hårt på rookies.",
  },
  "refractor": {
    title: "Refractor",
    body: "Refractors är glansiga Chrome-parallels med regnbågseffekt. Hög likviditet på Tradera och basen för hela Chrome-hierarkin.",
  },
  "superfractor": {
    title: "Superfractor",
    body: "Superfractor är 1/1 grail-parallel inom Topps Chrome. Guldfärgad, högsta hobby-prestige.",
  },
  "silver prizm": {
    title: "Silver Prizm",
    body: "Silver Prizm Rookie Cards räknas som core modern rookies och har stark långsiktig efterfrågan.",
  },
  "auto": {
    title: "Autograf",
    body: "Auto-kort signerade av spelaren. Värdesätt endast certifierade autos (on-card eller sticker) från Panini/Topps. Övriga är hög äkthetsrisk.",
  },
  "rookie": {
    title: "Rookie Card",
    body: "Rookie Cards (RC) är spelarens första officiella licensierade kort. Bär den högsta långsiktiga samlarefterfrågan.",
  },
  "numbered": {
    title: "Numbered",
    body: "Numrerade kort har begränsat upplagsantal (t.ex. /99). Lägre printrun → högre värde och starkare flip-potential.",
  },
  "panini prizm": {
    title: "Panini Prizm",
    body: "Panini Prizm är basen för modern NBA-samling. Silver Prizm = base parallel; färgade parallels (Gold, Black) ökar i värde med fallande print run.",
  },
  "topps chrome": {
    title: "Topps Chrome",
    body: "Topps Chrome-hierarkin: Refractor (base) → X-Fractor → färgade refractors → Superfractor (1/1).",
  },
};

export function getEducation(tags: string[]): EducationEntry[] {
  const seen = new Set<string>();
  const out: EducationEntry[] = [];
  for (const t of tags) {
    const key = t.toLowerCase().trim();
    if (seen.has(key)) continue;
    const entry = ENTRIES[key];
    if (entry) {
      seen.add(key);
      out.push({ tag: t, ...entry });
    }
  }
  return out;
}