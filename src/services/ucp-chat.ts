import type { Message } from "@/types/chat";
import { sendUcpChatMessage, type UcpChatHistoryEntry } from "./ucpApi";

function convertHistory(messages: Message[]): UcpChatHistoryEntry[] {
  return messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [m.content],
  }));
}

export type GenerateUcpResponseResult = {
  message: Message;
  cartId?: string;
};

export async function generateUcpResponse(
  input: string,
  history?: Message[],
  cartId?: string
): Promise<GenerateUcpResponseResult> {
  const historyEntries = history ? convertHistory(history) : undefined;
  const result = await sendUcpChatMessage(input, historyEntries, cartId);

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
    },
    cartId: result.data.cartId,
  };
}
