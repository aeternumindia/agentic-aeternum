import ghostMannequins from "@/data/ghost_mannequins_catalog.json";

export interface GhostMannequinItem {
  product_name: string;
  product_id: string;
  shopify_gid: string;
  image_url: string;
  handle: string;
  category: "top" | "bottom";
  original_shopify_image: string;
}

const catalog: GhostMannequinItem[] = ghostMannequins as GhostMannequinItem[];

// Fast O(1) lookup maps
const byId = new Map<string, string>();
const byGid = new Map<string, string>();
const byHandle = new Map<string, string>();
const byTitle = new Map<string, string>();

for (const item of catalog) {
  if (item.product_id) byId.set(item.product_id, item.image_url);
  if (item.shopify_gid) byGid.set(item.shopify_gid, item.image_url);
  if (item.handle) byHandle.set(item.handle.toLowerCase(), item.image_url);
  if (item.product_name) byTitle.set(item.product_name.toLowerCase(), item.image_url);
}

/**
 * Returns the high-resolution clean studio ghost mannequin WebP URL from Firebase Storage.
 * Falls back to the provided fallbackUrl or original photo if not matched.
 */
export function getGhostMannequinUrl(params: {
  productId?: string | number | null;
  productGid?: string | null;
  productHandle?: string | null;
  productTitle?: string | null;
  fallbackUrl?: string | null;
}): string | null {
  const { productId, productGid, productHandle, productTitle, fallbackUrl } = params;

  if (productId) {
    const rawId = String(productId).replace("gid://shopify/Product/", "").trim();
    const url = byId.get(rawId);
    if (url) return url;
  }

  if (productGid) {
    const url = byGid.get(productGid.trim());
    if (url) return url;
  }

  if (productHandle) {
    const url = byHandle.get(productHandle.toLowerCase().trim());
    if (url) return url;
  }

  if (productTitle) {
    const url = byTitle.get(productTitle.toLowerCase().trim());
    if (url) return url;
  }

  return fallbackUrl || null;
}
