import axios from "axios";
import type { ProductResult } from "@/types/chat";
import type { SkinAnalysisResponse } from "@/types/color-analysis";

const apiClient = axios.create({
  baseURL: "http://localhost:3001/api",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

export type ChatHistoryEntry = {
  role: "user" | "model";
  parts: string[];
};

export type ChatApiResponse = {
  success: boolean;
  data: {
    response: string;
    products: ProductResult[];
    collections: {
      id: string;
      title: string;
      handle: string;
    }[];
    sources: unknown[];
    cartUpdated?: boolean;
    cartId?: string;
  };
};

export async function sendChatMessage(
  message: string,
  history?: ChatHistoryEntry[],
  cartId?: string
): Promise<ChatApiResponse> {
  const { data } = await apiClient.post<ChatApiResponse>(
    "/customer-service/chat",
    { message, history, cartId }
  );
  return data;
}

export async function healthCheck(): Promise<boolean> {
  try {
    const { data } = await apiClient.get("/health");
    return data.status === "ok";
  } catch {
    return false;
  }
}

export async function analyzeSkinColor(
  imageFile: File
): Promise<SkinAnalysisResponse> {
  const formData = new FormData();
  formData.append("image", imageFile);
  const { data } = await apiClient.post<SkinAnalysisResponse>(
    "/analysis/skin-color",
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
  return data;
}

export async function getSizeChart(handle: string): Promise<{
  success: boolean;
  data: Record<string, string> | null;
}> {
  const { data } = await apiClient.get(`/cart/products/${handle}/size-chart`);
  return data;
}

export type TryOnStatus = {
  remaining: number;
  limit: number;
  used: number;
};

export async function getTryOnStatus(): Promise<TryOnStatus> {
  const { data } = await apiClient.get<TryOnStatus & { success: boolean }>(
    "/try-on/status"
  );
  return { remaining: data.remaining, limit: data.limit, used: data.used };
}

export default apiClient;
