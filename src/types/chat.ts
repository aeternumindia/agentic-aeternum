export type MessageRole = "user" | "assistant" | "system";

export type ProductResult = {
  id: string;
  title: string;
  handle: string;
  description: string;
  price: string;
  currency: string;
  image: string;
  imageAlt: string;
  variantId: string;
  available: boolean;
  productType?: string;
  sizeChart?: string | null;
};

export type CollectionResult = {
  id: string;
  title: string;
  handle: string;
};

export type OutfitProduct = {
  id: string;
  title: string;
  handle: string;
  description: string;
  url: string;
  price: string;
  currency: string;
  available: boolean;
  image: string | null;
  imageAlt: string | null;
  productType?: string;
  tags?: string[];
  sizeChart?: string | null;
  variantId?: string | null;
  variants?: Array<{
    id: string;
    title: string;
    price: string;
    currency: string;
    available: boolean;
    options?: Array<{ name: string; value: string }>;
  }>;
};

export type OutfitRecommendation = {
  id: string;
  rank?: number;
  title: string;
  styleTag: string;
  compatibilityScore: number;
  scoreFormatted?: string;
  matchLabel: string;
  accentNote?: string;
  description: string;
  whyThisWorks: string;
  formality: string;
  occasion: string;
  shirt: OutfitProduct;
  trouser: OutfitProduct;
  totalPrice: string;
  currency: string;
};

export type Message = {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  products?: ProductResult[];
  collections?: CollectionResult[];
  outfits?: OutfitRecommendation[];
};

export type Conversation = {
  id: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
};

export type ChatState = {
  conversation: Conversation;
  isLoading: boolean;
};
