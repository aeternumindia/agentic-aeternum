import { AppShell } from "@/components/layout/app-shell";
import { ChatPanel } from "@/components/chat/chat-panel";
import { ChatInput } from "@/components/chat/chat-input";
import { ContextPanel } from "@/components/product/context-panel";

export default function Home() {
  return (
    <AppShell context={<ContextPanel />} input={<ChatInput />}>
      <ChatPanel />
    </AppShell>
  );
}
