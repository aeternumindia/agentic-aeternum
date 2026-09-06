"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  const pathname = usePathname();

  return (
    <div
      className={cn(
        "fixed top-0 inset-x-0 z-40 flex items-center justify-center border-b border-border/80 bg-background/90 backdrop-blur-xl shadow-2xs",
        className,
      )}
    >
      <div className="flex w-full max-w-6xl items-center justify-between px-4 sm:px-6 md:px-8 h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <img
            src="/logo.svg"
            alt="Aeternum"
            className="h-7 md:h-8 w-auto transition-transform hover:scale-105"
          />
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1.5 p-1 rounded-full bg-card/60 border border-border/60 backdrop-blur-md shadow-2xs">
          {navItems.map((navItem, idx) => {
            const isActive = pathname === navItem.link;
            return (
              <Link
                key={`link-${idx}`}
                href={navItem.link}
                className={cn(
                  "text-xs px-3.5 py-1.5 rounded-full transition-all font-medium",
                  isActive
                    ? "bg-foreground text-background font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                )}
              >
                {navItem.name}
              </Link>
            );
          })}
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
              className="text-lg font-medium p-4 hover:bg-muted rounded-xl transition-colors border-b border-border/50"
            >
              {navItem.name}
            </Link>
          ))}
          <a
            href="https://e8j3xx-qz.myshopify.com"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setMobileOpen(false)}
            className="text-lg font-medium p-4 hover:bg-muted rounded-xl transition-colors text-accent"
          >
            Visit Shop
          </a>
        </div>
      )}
    </div>
  );
};
