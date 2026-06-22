export const SHOPIFY_STOREFRONT_DOMAIN = "https://e8j3xx-qz.myshopify.com";

export function getProductUrl(handle: string): string {
  return `${SHOPIFY_STOREFRONT_DOMAIN}/products/${handle}`;
}
