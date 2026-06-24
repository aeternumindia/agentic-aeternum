"use client";

import { useState, useEffect, useRef, type FormEvent } from "react";
import { Send } from "lucide-react";

type ChatInputProps = {
  onSend: (message: string) => void;
  isLoading?: boolean;
};

export function ChatInput({ onSend, isLoading }: ChatInputProps) {
  const [value, setValue] = useState("");
  const hasText = value.trim().length > 0;
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isLoading) {
      inputRef.current?.focus();
    }
  }, [isLoading]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
    setValue("");
  }

  return (
    <div className="px-4 pb-6 pt-2">
      <form onSubmit={handleSubmit} className="flex justify-center">
        <div className="relative flex w-full max-w-2xl items-center rounded-xl border border-input bg-card shadow-sm transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Tell me what you're looking for..."
            disabled={isLoading}
            className="min-h-[64px] w-full bg-transparent px-4 py-3 text-base outline-none placeholder:text-muted-foreground disabled:opacity-50 md:text-sm"
          />
          {hasText && (
            <button
              type="submit"
              disabled={isLoading}
              className="mr-2 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
          )}
        </div>
      </form>
      <p className="mt-2 text-center text-[10px] text-muted-foreground">
        AI can make mistakes. Verify product details before purchasing.
      </p>
    </div>
  );
}
