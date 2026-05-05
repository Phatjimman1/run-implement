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

const ITEM_LINK_RE = /href="(\/(?:item|auction|salda-varor)\/(\d{6,})[^"]*)"[^>]*>([\s\S]{0,400}?)<\/a>/gi;

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

  // Try Next.js JSON blob first
  const nextMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (nextMatch) {
    try {
      const data = JSON.parse(nextMatch[1]);
      const items = findItemsInJson(data);
      if (items.length > 0) return items;
    } catch (_) {
      // fall through to HTML parser
    }
  }

  // Legacy: scan for item links
  const seen = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = ITEM_LINK_RE.exec(html)) !== null) {
    const path = m[1];
    const id = m[2];
    if (seen.has(id)) continue;
    seen.add(id);
    const inner = m[3];
    const title = stripTags(inner);
    if (!title || title.length < 5) continue;

    // try to locate a price near this link (next ~600 chars)
    const start = m.index + m[0].length;
    const ctx = html.slice(start, start + 1500);
    const price = extractPrice(ctx);

    // image
    const imgMatch = inner.match(/src="([^"]+)"/) || ctx.match(/<img[^>]+src="([^"]+)"/);
    const image = imgMatch ? imgMatch[1] : null;

    out.push({
      traderaItemId: id,
      title,
      url: `https://www.tradera.com${path}`,
      imageUrls: image ? [image] : [],
      currentPrice: price,
      shippingCost: null,
      endTime: null,
      bidCount: null,
      sellerName: null,
    });
  }
  return out;
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