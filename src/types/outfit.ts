export type OutfitProduct = {
  id: string;
  title: string;
  handle: string;
  productType: string;
  image: string;
  images: string[];
  price: string;
  currency: string;
  variants: OutfitVariant[];
};

export type OutfitVariant = {
  id: string;
  title: string;
  size: string;
  color: string;
  price: string;
  compareAtPrice?: string;
  available: boolean;
};

export type OutfitPair = {
  top: OutfitProduct | null;
  bottom: OutfitProduct | null;
  topSize: string;
  bottomSize: string;
  topColor: string;
  bottomColor: string;
};

export type TryOnFlowStep =
  | "category_select"
  | "product_browser_top"
  | "product_browser_bottom"
  | "outfit_review"
  | "photo_upload"
  | "try_on_preview";
