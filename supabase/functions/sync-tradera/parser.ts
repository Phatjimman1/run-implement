// Parses Tradera search-results HTML into normalized listings.
// Tradera markup changes occasionally; this parser is defensive.

export interface ParsedListing {
  traderaItemId: string;
  title: string;
  url: string;
  imageUrls: string[];
  currentPrice: number | null;
  shippingCost: number | null;
  endTime: Date | null;
  bidCount: number | null;
  sellerName: string | null;
}

const ITEM_BLOCK_RE = /<div id="item-card-(\d+)"[\s\S]*?(?=<div id="item-card-\d+"|<div id="end-of-results"|<\/main>|$)/g;

function decode(html: string): string {
  return html
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

function stripTags(s: string): string {
  return decode(s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function extractPrice(text: string): number | null {
  const m = text.match(/(\d[\d\s]*)\s*kr/i);
  if (!m) return null;
  return parseInt(m[1].replace(/\s/g, ""), 10);
}

/**
 * Parses both legacy Tradera HTML and the new Next.js __NEXT_DATA__ JSON blob.
 */
export function parseTraderaHtml(html: string): ParsedListing[] {
  const out: ParsedListing[] = [];
  const seen = new Set<string>();

  // Find every item-card block and parse it
  let m: RegExpExecArray | null;
  ITEM_BLOCK_RE.lastIndex = 0;
  while ((m = ITEM_BLOCK_RE.exec(html)) !== null) {
    const id = m[1];
    if (seen.has(id)) continue;
    seen.add(id);
    const block = m[0];

    // URL + title (title-link is the second <a> with href to /item/.../id/...)
    const linkRe = new RegExp(`href="(https?://www\\.tradera\\.com/item/[^"]*${id}[^"]*)"[^>]*>([^<]{4,})</a>`);
    const linkMatch = block.match(linkRe);
    let url = "";
    let title = "";
    if (linkMatch) {
      url = decode(linkMatch[1]);
      title = stripTags(linkMatch[2]);
    } else {
      const anyHref = block.match(new RegExp(`href="(https?://www\\.tradera\\.com/item/[^"]*${id}[^"]*)"`));
      if (anyHref) url = decode(anyHref[1]);
      const titleAttr = block.match(/title="([^"]+)"/);
      if (titleAttr) title = decode(titleAttr[1]);
    }
    if (!title || !url) continue;

    // Price: look for data-testid="price" first
    let price: number | null = null;
    const priceMatch = block.match(/data-testid="price"[^>]*>([\s\S]{0,80}?)</);
    if (priceMatch) price = extractPrice(stripTags(priceMatch[1]));
    if (price === null) price = extractPrice(block);

    // Image
    const imgMatch = block.match(/<img[^>]+src="([^"]+)"/);
    const image = imgMatch ? decode(imgMatch[1]) : null;

    // End time text (Swedish: "8 maj 15:09" or "1 tim" etc.)
    const endMatch = block.match(/aria-hidden="false"[^>]*>([^<]+)<\/span>/);
    const endTime = endMatch ? parseSwedishEndTime(endMatch[1].trim()) : null;

    // Bid count
    let bidCount: number | null = null;
    const bidM = block.match(/(\d+)\s*bud\b/i);
    if (bidM) bidCount = parseInt(bidM[1], 10);

    out.push({
      traderaItemId: id,
      title,
      url,
      imageUrls: image ? [image] : [],
      currentPrice: price,
      shippingCost: null,
      endTime,
      bidCount,
      sellerName: null,
    });
  }
  return out;
}

function parseSwedishEndTime(text: string): Date | null {
  // Examples: "8 maj 15:09", "i dag 18:30", "i morgon 09:00", "1 tim", "32 min"
  const months: Record<string, number> = {
    jan: 0, feb: 1, mar: 2, apr: 3, maj: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, okt: 9, nov: 10, dec: 11,
  };
  const t = text.toLowerCase();

  const minM = t.match(/^(\d+)\s*min/);
  if (minM) return new Date(Date.now() + parseInt(minM[1], 10) * 60_000);
  const timM = t.match(/^(\d+)\s*tim/);
  if (timM) return new Date(Date.now() + parseInt(timM[1], 10) * 3600_000);

  const today = new Date();
  const todayM = t.match(/^i\s*dag\s+(\d{1,2}):(\d{2})/);
  if (todayM) {
    const d = new Date(today);
    d.setHours(parseInt(todayM[1], 10), parseInt(todayM[2], 10), 0, 0);
    return d;
  }
  const tmwM = t.match(/^i\s*morgon\s+(\d{1,2}):(\d{2})/);
  if (tmwM) {
    const d = new Date(today);
    d.setDate(d.getDate() + 1);
    d.setHours(parseInt(tmwM[1], 10), parseInt(tmwM[2], 10), 0, 0);
    return d;
  }
  const dateM = t.match(/^(\d{1,2})\s+([a-zåäö]{3})\s+(\d{1,2}):(\d{2})/);
  if (dateM) {
    const day = parseInt(dateM[1], 10);
    const mon = months[dateM[2]];
    if (mon === undefined) return null;
    const d = new Date(today.getFullYear(), mon, day, parseInt(dateM[3], 10), parseInt(dateM[4], 10));
    if (d.getTime() < Date.now() - 24 * 3600_000) d.setFullYear(d.getFullYear() + 1);
    return d;
  }
  return null;
}

// recursively scan the Next.js data tree for item objects
function findItemsInJson(node: unknown, out: ParsedListing[] = []): ParsedListing[] {
  if (!node || typeof node !== "object") return out;
  if (Array.isArray(node)) {
    for (const v of node) findItemsInJson(v, out);
    return out;
  }
  const obj = node as Record<string, unknown>;
  // detect listing-shaped object
  const id = (obj.itemId ?? obj.id) as number | string | undefined;
  const title = (obj.shortDescription ?? obj.title ?? obj.heading) as string | undefined;
  const link = (obj.itemUrl ?? obj.url ?? obj.canonicalUrl) as string | undefined;
  if (id && typeof title === "string" && title.length > 4 && (link || obj.itemId)) {
    const idStr = String(id);
    const url = link
      ? (String(link).startsWith("http") ? String(link) : `https://www.tradera.com${link}`)
      : `https://www.tradera.com/item/${idStr}`;
    const price = (obj.price ?? obj.currentBid ?? (obj as any).priceText) as number | string | undefined;
    const priceNum = typeof price === "number" ? price : typeof price === "string" ? extractPrice(price) : null;
    const img = ((obj as any).imageUrl ?? (obj as any).thumbnail ?? (obj as any).image) as string | undefined;
    const endRaw = ((obj as any).endDate ?? (obj as any).endTime) as string | undefined;
    out.push({
      traderaItemId: idStr,
      title,
      url,
      imageUrls: img ? [img] : [],
      currentPrice: priceNum,
      shippingCost: null,
      endTime: endRaw ? new Date(endRaw) : null,
      bidCount: typeof (obj as any).bidCount === "number" ? (obj as any).bidCount : null,
      sellerName: typeof (obj as any).sellerAlias === "string" ? (obj as any).sellerAlias : null,
    });
  }
  for (const v of Object.values(obj)) findItemsInJson(v, out);
  return out;
}