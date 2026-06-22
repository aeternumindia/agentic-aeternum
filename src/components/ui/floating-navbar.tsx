"use client";
import React, { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ShoppingBag, Menu, X } from "lucide-react";

export const FloatingNav = ({
  navItems,
  onCartClick,
  cartItemCount = 0,
  className,
}: {
  navItems: {
    name: string;
    link: string;
    icon?: React.ReactNode;
  }[];
  onCartClick?: () => void;
  cartItemCount?: number;
  className?: string;
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div
      className={cn(
        "fixed top-0 inset-x-0 z-[5000] flex items-center justify-center border-b border-border bg-background/90 backdrop-blur-xl",
        className,
      )}
    >
      <div className="flex w-full max-w-6xl items-center justify-between px-4 md:px-8 h-16">
        {/* Logo */}
        <Link href="/">
          <img
            src="/logo.svg"
            alt="Aeternum"
            className="h-7 md:h-9 w-auto"
          />
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {navItems.map((navItem, idx) => (
            <Link
              key={`link-${idx}`}
              href={navItem.link}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground font-medium"
            >
              {navItem.name}
            </Link>
          ))}
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          {/* Cart */}
          <button
            onClick={onCartClick}
            className="relative flex items-center justify-center h-10 w-10 text-muted-foreground hover:text-foreground transition-colors hover:bg-muted rounded-full"
          >
            <ShoppingBag className="h-5 w-5" />
            {cartItemCount > 0 && (
              <span className="absolute right-0 top-0 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                {cartItemCount}
              </span>
            )}
          </button>

          {/* Hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden relative flex items-center justify-center h-10 w-10 text-muted-foreground hover:text-foreground transition-colors hover:bg-muted rounded-full"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-x-0 top-16 z-40 bg-background flex flex-col p-4 shadow-xl border-b border-border">
          {navItems.map((navItem, idx) => (
            <Link
              key={`mobile-${idx}`}
              href={navItem.link}
              onClick={() => setMobileOpen(false)}
              className="text-lg font-medium p-4 hover:bg-muted rounded-xl transition-colors border-b border-border/50 last:border-b-0"
            >
              {navItem.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
