"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import type { Message, ProductResult, OutfitRecommendation } from "@/types/chat";
import { cn } from "@/lib/utils";
import { StreamingMarkdown } from "./streaming-markdown";
import { getProductUrl } from "@/lib/shopify";
import { AddToCartModal, type AddToCartItem } from "@/components/cart/add-to-cart-modal";
import { OutfitCard } from "@/components/recommendations/outfit-card";
import { OutfitCarousel } from "@/components/recommendations/outfit-carousel";
import { APP_STATES } from "@/constants";
import { useAppState } from "@/contexts/app-state";
import { useVirtualTryOn } from "@/contexts/virtual-try-on";

type MessageListProps = {
  messages: Message[];
  isLoading: boolean;
  onSendMessage?: (message: string) => void;
};

type ModalProduct = {
  handle: string;
  title: string;
  image: string;
  price: string;
  sizeChart?: string | null;
};

export function MessageList({ messages, isLoading, onSendMessage }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [modalProduct, setModalProduct] = useState<ModalProduct | null>(null);
  const [cartModalItems, setCartModalItems] = useState<AddToCartItem[] | null>(null);
  const { setState } = useAppState();
  const { startTryOn } = useVirtualTryOn();

  function handleTryOn(product: ProductResult) {
    startTryOn({
      productId: product.id,
      productHandle: product.handle,
      productTitle: product.title,
      productImage: product.image || "",
      productCategory: product.productType || "",
      price: product.price,
      currency: product.currency,
      selectedSize: "",
      selectedColor: "",
      measurements: {},
    });
    setState(APP_STATES.VIRTUAL_TRY_ON);
  }

  function handleShopTheLook(outfit: OutfitRecommendation) {
    setCartModalItems([
      {
        handle: outfit.shirt.handle,
        title: outfit.shirt.title,
        image: outfit.shirt.image || "",
        price: `₹${Number(outfit.shirt.price).toLocaleString("en-IN")}`,
        category: "Shirt",
      },
      {
        handle: outfit.trouser.handle,
        title: outfit.trouser.title,
        image: outfit.trouser.image || "",
        price: `₹${Number(outfit.trouser.price).toLocaleString("en-IN")}`,
        category: "Trouser",
      },
    ]);
  }

  function handleTryTheLook(outfit: OutfitRecommendation) {
    startTryOn({
      productId: outfit.shirt.id,
      productHandle: outfit.shirt.handle,
      productTitle: outfit.shirt.title,
      productImage: outfit.shirt.image || "",
      productCategory: outfit.shirt.productType || "Shirt",
      price: outfit.shirt.price,
      currency: outfit.shirt.currency,
      selectedSize: "",
      selectedColor: "",
      measurements: {},
      bottomGarment: {
        productId: outfit.trouser.id,
        productHandle: outfit.trouser.handle,
        productTitle: outfit.trouser.title,
        productImage: outfit.trouser.image || "",
        productCategory: outfit.trouser.productType || "Trouser",
        price: outfit.trouser.price,
        currency: outfit.trouser.currency,
      },
    });
    setState(APP_STATES.VIRTUAL_TRY_ON);
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="space-y-4 sm:space-y-5 px-3 py-3 sm:px-6 sm:py-4">
      {messages.map((message) => (
        <div key={message.id} className="animate-message-in">
          <div
            className={cn(
              "flex items-start gap-2 sm:gap-3",
              message.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            {message.role === "assistant" && (
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-[#8C3A3F] text-white flex items-center justify-center shrink-0 mt-0.5 sm:mt-1 shadow-2xs">
                <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />
              </div>
            )}

            <div className="flex-1 flex flex-col items-start min-w-0">
              <div className="w-full flex items-baseline justify-between gap-3">
                <div
                  className={cn(
                    "text-[13px] sm:text-base leading-relaxed",
                    message.role === "user"
                      ? "ml-auto max-w-[92%] sm:max-w-[80%] bg-primary text-primary-foreground rounded-2xl px-3.5 py-2 sm:px-4 sm:py-2"
                      : "max-w-[96%] sm:max-w-[85%] rounded-2xl border border-stone-200/90 dark:border-stone-800 bg-white dark:bg-stone-900 px-3.5 sm:px-5 py-2.5 sm:py-3 shadow-2xs text-stone-900 dark:text-stone-100"
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

                {message.role === "assistant" && message.outfits && message.outfits.length > 0 && (
                  <div className="hidden sm:block text-right shrink-0 pr-1 pl-3 select-none">
                    <span className="font-cursive text-lg sm:text-xl text-[#6B5E54] dark:text-stone-400 block leading-none">
                      Good style
                    </span>
                    <span className="font-cursive text-lg sm:text-xl text-[#6B5E54] dark:text-stone-400 block leading-none mt-0.5">
                      leads to great conversations.
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Complete Outfit Recommendations */}
          {message.outfits && message.outfits.length > 0 && (
            <div className="mt-4 space-y-3.5 animate-fade-in sm:pl-10">
              <OutfitCarousel
                outfits={message.outfits}
                onShopTheLook={handleShopTheLook}
                onTryTheLook={handleTryTheLook}
              />

              {/* Want to see more options? Refinement Chips */}
              {onSendMessage && (
                <div className="space-y-1.5 sm:space-y-2 pt-1.5 sm:pt-2">
                  <p className="text-xs sm:text-sm font-semibold text-stone-900 dark:text-stone-100 tracking-tight">
                    Want to see more options?
                  </p>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2 items-center">
                    {[
                      "More formal",
                      "More casual",
                      "Party",
                      "First date",
                      "Show me black trousers",
                      "Try another shirt",
                      "Build around these trousers",
                    ].map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => onSendMessage(chip)}
                        className="text-[11px] sm:text-xs px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full border border-stone-200/90 dark:border-stone-800 bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200 font-medium transition-all shadow-2xs hover:shadow-xs cursor-pointer active:scale-95"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {message.products && message.products.length > 0 && (!message.outfits || message.outfits.length === 0) && (
            <div className="mt-3 flex gap-2.5 sm:gap-3 overflow-x-auto pb-2 animate-fade-in">
              {message.products.slice(0, 6).map((product) => (
                <div
                  key={product.id}
                  className="w-[145px] sm:w-[180px] shrink-0 rounded-xl border border-border bg-card overflow-hidden"
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
                    <div className="p-2.5 sm:p-3 pb-1.5 sm:pb-2">
                      <p className="text-[11px] sm:text-xs font-medium text-card-foreground truncate">
                        {product.title}
                      </p>
                      <p className="mt-0.5 sm:mt-1 text-[11px] sm:text-xs text-accent">
                        ₹{Number(product.price).toLocaleString("en-IN")}
                      </p>
                    </div>
                  </button>
                  <div className="px-2.5 pb-2.5 sm:px-3 sm:pb-3 flex flex-col gap-1 sm:gap-1.5">
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
                      className="w-full rounded-lg bg-primary text-primary-foreground py-1 sm:py-1.5 text-[11px] sm:text-xs font-medium hover:opacity-90 transition-opacity"
                    >
                      Add to Cart
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTryOn(product)}
                      className="w-full rounded-lg border border-accent/30 text-accent py-1 sm:py-1.5 text-[11px] sm:text-xs font-medium hover:bg-accent/5 transition-colors"
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

      {cartModalItems && (
        <AddToCartModal
          items={cartModalItems}
          onClose={() => setCartModalItems(null)}
        />
      )}
    </div>
  );
}
