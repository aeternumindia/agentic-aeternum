"use client";

import { MessageSquareText, Eye, Sparkles, Cpu } from "lucide-react";
import { useShopifyCart } from "@/contexts/shopify-cart";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { FloatingNav } from "@/components/ui/floating-navbar";

type AppShellProps = {
  children: React.ReactNode;
};

const navItems = [
  { name: "Shop with Aura", link: "/ai-shopping/ucp", icon: <Cpu className="h-4 w-4" /> },
  { name: "Virtual Try-On", link: "/virtual-try-on", icon: <Eye className="h-4 w-4" /> },
  { name: "Color Analysis", link: "/color-analysis", icon: <Sparkles className="h-4 w-4" /> },
];

export function AppShell({ children }: AppShellProps) {
  const { itemCount, openCart } = useShopifyCart();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <FloatingNav
        navItems={navItems}
        onCartClick={openCart}
        cartItemCount={itemCount}
      />
      <div className="relative flex-1 pt-16">
        {children}
      </div>
      <CartDrawer />
    </div>
  );
}
