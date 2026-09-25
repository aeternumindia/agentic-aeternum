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

/**
 * Default Aeternum bottom garment to pair when only a top is chosen
 * (Signature Light Brown Pleated Tailored Fit Terry-Rayon Trousers)
 */
export const DEFAULT_AETERNUM_BOTTOM: GhostMannequinItem = {
  product_name: "Pleated Tailored Fit Terry-Rayon Trousers | Light Brown",
  product_id: "15128399020400",
  shopify_gid: "gid://shopify/Product/15128399020400",
  image_url:
    "https://firebasestorage.googleapis.com/v0/b/aeternum-app-45c5c.firebasestorage.app/o/ghost_mannequins%2FPleated%20Tailored%20Fit%20Terry-Rayon%20Trousers%20-%20Light%20Brown.webp?alt=media&token=b6150344-d834-4e2b-8aa8-905ca09e43c8",
  handle: "pleated-tailored-fit-terry-rayon-trousers-light-brown",
  category: "bottom",
  original_shopify_image:
    "https://cdn.shopify.com/s/files/1/0968/0270/1680/files/Light-Brown-aeternum-Light-Brown-1.webp?v=1780737402",
};

/**
 * Default Aeternum top garment to pair when only a bottom is chosen
 * (Signature White Relaxed Fit 100% Linen Shirt)
 */
export const DEFAULT_AETERNUM_TOP: GhostMannequinItem = {
  product_name: "Relaxed Fit 100% Linen Shirt | White",
  product_id: "15130842857840",
  shopify_gid: "gid://shopify/Product/15130842857840",
  image_url:
    "https://firebasestorage.googleapis.com/v0/b/aeternum-app-45c5c.firebasestorage.app/o/ghost_mannequins%2FRelaxed%20Fit%20100%25%20Linen%20Shirt%20-%20White.webp?alt=media&token=388f5e51-6097-4519-8690-bbb29b28f942",
  handle: "aeternum-relaxed-fit-linen-shirt-white",
  category: "top",
  original_shopify_image:
    "https://cdn.shopify.com/s/files/1/0968/0270/1680/files/100_-White-Linen-aeternum-100_-White-Linen-1.webp?v=1780737743",
};

export function isBottomCategory(category?: string | null, title?: string | null): boolean {
  const cat = (category || "").toLowerCase();
  const tit = (title || "").toLowerCase();
  return (
    cat.includes("trouser") ||
    cat.includes("pant") ||
    cat.includes("bottom") ||
    tit.includes("trouser") ||
    tit.includes("pant")
  );
}

export function isTopCategory(category?: string | null, title?: string | null): boolean {
  return !isBottomCategory(category, title);
}

