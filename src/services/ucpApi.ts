import axios from "axios";
import type { ProductResult } from "@/types/chat";

const ucpClient = axios.create({
  baseURL: "http://localhost:3001/api/ucp",
  timeout: 120000,
  headers: {
    "Content-Type": "application/json",
  },
});

export type UcpChatHistoryEntry = {
  role: "user" | "model";
  parts: string[];
};

export type UcpChatApiResponse = {
  success: boolean;
  data: {
    response: string;
    products: ProductResult[];
    cartId?: string;
    checkoutUrl?: string;
    sources: unknown[];
  };
};

export async function sendUcpChatMessage(
  message: string,
  history?: UcpChatHistoryEntry[],
  cartId?: string
): Promise<UcpChatApiResponse> {
  const { data } = await ucpClient.post<UcpChatApiResponse>("/chat", {
    message,
    history,
    cartId,
  });
  return data;
}

export async function searchUcpCatalog(
  query: string,
  filters?: { productType?: string; priceMax?: number; maxResults?: number }
): Promise<ProductResult[]> {
  const { data } = await ucpClient.post<{ success: boolean; data: { products: ProductResult[] } }>(
    "/search-direct",
    { query, ...filters }
  );
  return data.data.products;
}
