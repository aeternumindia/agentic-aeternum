import axios from "axios";
import type { ProductResult } from "@/types/chat";
import type { SkinAnalysisResponse } from "@/types/color-analysis";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const apiClient = axios.create({
  baseURL: `${API_BASE}/api`,
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

export type TryOnRequestParams = {
  personImage: File | string;
  faceImage?: File | string | null;
  garmentImage: File | string;
  bottomGarmentImage?: File | string | null;
};

export async function generateTryOnImage(
  params: TryOnRequestParams
): Promise<string> {
  const { convertHeicToJpegIfNeeded } = await import("@/utils/heic-converter");

  async function toFile(source: File | string, filename: string): Promise<File> {
    if (typeof source !== "string") {
      return convertHeicToJpegIfNeeded(source);
    }
    const res = await fetch(source);
    const blob = await res.blob();
    const file = new File([blob], filename, {
      type: blob.type || "image/jpeg",
    });
    return convertHeicToJpegIfNeeded(file);
  }

  const personFile = await toFile(params.personImage, "person.jpg");
  const garmentFile = await toFile(params.garmentImage, "garment.jpg");

  const formData = new FormData();
  formData.append("personImage", personFile);
  formData.append("garmentImage", garmentFile);

  if (params.faceImage) {
    const faceFile = await toFile(params.faceImage, "face.jpg");
    formData.append("faceImage", faceFile);
  } else {
    // When no separate face selfie is provided (e.g. preset models), send personFile as faceImage
    // so the backend face preservation/alignment pipeline always has reference face data!
    formData.append("faceImage", personFile);
  }

  if (params.bottomGarmentImage) {
    const bottomFile = await toFile(
      params.bottomGarmentImage,
      "bottom-garment.jpg"
    );
    formData.append("bottomGarmentImage", bottomFile);
  }

  const res = await fetch(`${API_BASE}/api/try-on/image`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    let error = "Try-on generation failed";
    try {
      const json = JSON.parse(text);
      error = json.error || error;
    } catch {}
    throw new Error(error);
  }

  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

export default apiClient;
