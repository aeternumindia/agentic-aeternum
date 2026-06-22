"use client";

import { useEffect, useRef, useState } from "react";
import type { Message } from "@/types/chat";
import type { ProductResult } from "@/types/chat";
import { cn } from "@/lib/utils";
import { StreamingMarkdown } from "./streaming-markdown";
import { getProductUrl } from "@/lib/shopify";
import { AddToCartModal } from "@/components/cart/add-to-cart-modal";
import { APP_STATES } from "@/constants";
import { useAppState } from "@/contexts/app-state";
import { useVirtualTryOn } from "@/contexts/virtual-try-on";

type MessageListProps = {
  messages: Message[];
  isLoading: boolean;
};

type ModalProduct = {
  handle: string;
  title: string;
  image: string;
  price: string;
  sizeChart?: string | null;
};

export function MessageList({ messages, isLoading }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [modalProduct, setModalProduct] = useState<ModalProduct | null>(null);
  const { setState } = useAppState();
  const { startTryOn } = useVirtualTryOn();

  function handleTryOn(product: ProductResult) {
    startTryOn({
      productId: product.id,
      productHandle: product.handle,
      productTitle: product.title,
      productImage: product.image || "",
      productCategory: product.productType || "",
      selectedSize: "",
      selectedColor: "",
      measurements: {},
    });
    setState(APP_STATES.VIRTUAL_TRY_ON);
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="space-y-4 px-4 py-4 sm:px-6">
      {messages.map((message) => (
        <div key={message.id} className="animate-message-in">
          <div
            className={cn(
              "flex",
              message.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "max-w-[90%] sm:max-w-[80%] px-4 py-1 text-base leading-relaxed",
                message.role === "user"
                  ? "bg-primary text-primary-foreground rounded-2xl"
                  : "text-foreground"
              )}
            >
              {message.role === "assistant" ? (
                <StreamingMarkdown
                  content={message.content}
                  shouldStream={message.id === messages[messages.length - 1]?.id}
                />
              ) : (
                message.content
              )}
            </div>
          </div>

          {message.products && message.products.length > 0 && (
            <div className="mt-3 flex gap-3 overflow-x-auto pb-2 animate-fade-in">
              {message.products.slice(0, 6).map((product) => (
                <div
                  key={product.id}
                  className="w-[160px] sm:w-[180px] shrink-0 rounded-xl border border-border bg-card overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => window.open(getProductUrl(product.handle), "_blank", "noopener")}
                    className="block w-full text-left"
                  >
                    <div className="aspect-[4/5] bg-muted flex items-center justify-center">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.imageAlt || product.title}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {product.title.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div className="p-3 pb-2">
                      <p className="text-xs font-medium text-card-foreground truncate">
                        {product.title}
                      </p>
                      <p className="mt-1 text-xs text-accent">
                        ₹{Number(product.price).toLocaleString("en-IN")}
                      </p>
                    </div>
                  </button>
                  <div className="px-3 pb-3 flex flex-col gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setModalProduct({
                          handle: product.handle,
                          title: product.title,
                          image: product.image || "",
                          price: `₹${Number(product.price).toLocaleString("en-IN")}`,
                          sizeChart: product.sizeChart,
                        })
                      }
                      className="w-full rounded-lg bg-primary text-primary-foreground py-1.5 text-xs font-medium hover:opacity-90 transition-opacity"
                    >
                      Add to Cart
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTryOn(product)}
                      className="w-full rounded-lg border border-accent/30 text-accent py-1.5 text-xs font-medium hover:bg-accent/5 transition-colors"
                    >
                      Virtual Try-On
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
      {isLoading && (
        <div className="flex justify-start animate-message-in">
          <div className="px-4 py-3">
            <div className="flex gap-1.5">
              <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" />
              <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:0.1s]" />
              <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:0.2s]" />
            </div>
          </div>
        </div>
      )}
      <div ref={bottomRef} />

      {modalProduct && (
        <AddToCartModal
          productHandle={modalProduct.handle}
          productTitle={modalProduct.title}
          productImage={modalProduct.image}
          productPrice={modalProduct.price}
          productSizeChart={modalProduct.sizeChart}
          onClose={() => setModalProduct(null)}
        />
      )}
    </div>
  );
}
