import type { OutfitProduct, OutfitVariant } from "@/types/outfit";

const SHOPIFY_DOMAIN = "https://e8j3xx-qz.myshopify.com";

export const TOP_TYPES = ["Oversized T-Shirts", "Shirts", "Polos"] as const;
export const BOTTOM_TYPES = ["Trouser"] as const;
export const ALL_TYPES = [...TOP_TYPES, ...BOTTOM_TYPES] as const;

type ShopifyRawProduct = {
  id: number;
  title: string;
  handle: string;
  product_type: string;
  images: { src: string }[];
  variants: {
    id: number;
    title: string;
    price: string;
    available: boolean;
  }[];
  options: { name: string; values: string[] }[];
};

export async function fetchAllProducts(): Promise<OutfitProduct[]> {
  const res = await fetch(
    `${SHOPIFY_DOMAIN}/products.json?limit=250`,
    { next: { revalidate: 300 } }
  );
  const json = await res.json();
  const raw: ShopifyRawProduct[] = json.products ?? [];

  return raw
    .filter((p) => ALL_TYPES.includes(p.product_type as typeof ALL_TYPES[number]))
    .map(mapProduct);
}

export async function fetchProductsByType(
  productType: string
): Promise<OutfitProduct[]> {
  const all = await fetchAllProducts();
  return all.filter((p) => p.productType === productType);
}

function mapProduct(raw: ShopifyRawProduct): OutfitProduct {
  const optionNames = raw.options.map((o) => o.name.toLowerCase());
  const sizeIdx = optionNames.indexOf("size");
  const colorIdx = optionNames.indexOf("color") !== -1
    ? optionNames.indexOf("color")
    : optionNames.indexOf("colour");

  const variants: OutfitVariant[] = raw.variants.map((v) => {
    const parts = v.title.split(" / ");
    return {
      id: `gid://shopify/ProductVariant/${v.id}`,
      title: v.title,
      size: parts[0]?.trim() ?? v.title,
      color: parts[1]?.trim() ?? "",
      price: v.price,
      available: v.available,
    };
  });

  return {
    id: String(raw.id),
    title: raw.title,
    handle: raw.handle,
    productType: raw.product_type,
    image: raw.images[0]?.src ?? "",
    price: raw.variants[0]?.price ?? "0",
    currency: "INR",
    variants,
  };
}

export function getUniqueSizes(products: OutfitProduct[]): string[] {
  const set = new Set<string>();
  for (const p of products) {
    for (const v of p.variants) {
      if (v.size) set.add(v.size);
    }
  }
  return [...set];
}

export function getUniqueColors(product: OutfitProduct): string[] {
  const set = new Set<string>();
  for (const v of product.variants) {
    if (v.color) set.add(v.color);
  }
  return [...set];
}
