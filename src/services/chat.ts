import type { Message } from "@/types/chat";
import { sendChatMessage, type ChatHistoryEntry } from "./api";

function convertHistory(messages: Message[]): ChatHistoryEntry[] {
  return messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [m.content],
  }));
}

export type GenerateResponseResult = {
  message: Message;
  cartUpdated?: boolean;
  cartId?: string;
};

export async function generateResponse(
  input: string,
  history?: Message[],
  cartId?: string
): Promise<GenerateResponseResult> {
  const historyEntries = history ? convertHistory(history) : undefined;
  const result = await sendChatMessage(input, historyEntries, cartId);

  if (!result.success) {
    throw new Error("API returned unsuccessful response");
  }

  return {
    message: {
      id: crypto.randomUUID(),
      role: "assistant",
      content: result.data.response,
      timestamp: new Date(),
      products: result.data.products,
      collections: result.data.collections,
    },
    cartUpdated: result.data.cartUpdated,
    cartId: result.data.cartId,
  };
}
