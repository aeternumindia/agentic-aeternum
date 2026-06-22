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

export type Message = {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  products?: ProductResult[];
  collections?: CollectionResult[];
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
