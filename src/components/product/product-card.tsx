import type { Product } from "@/types/product";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingBag } from "lucide-react";

type ProductCardProps = {
  product: Product;
  onCustomize?: (product: Product) => void;
};

export function ProductCard({ product, onCustomize }: ProductCardProps) {
  return (
    <Card className="w-[260px] shrink-0 overflow-hidden">
      <div className="aspect-[4/5] bg-muted">
        {product.images[0] ? (
          <img
            src={product.images[0]}
            alt={product.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
            {product.title.charAt(0)}
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">
          {product.category}
        </p>
        <h3 className="mt-1 text-sm font-medium text-card-foreground line-clamp-1">
          {product.title}
        </h3>
        <p className="mt-1 text-sm text-accent">
          ₹{product.price.toLocaleString("en-IN")}
        </p>
      </CardContent>

      <CardFooter className="px-4 pb-4 pt-0">
        {onCustomize && (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => onCustomize(product)}
          >
            <ShoppingBag className="mr-2 h-3 w-3" />
            Customize
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
