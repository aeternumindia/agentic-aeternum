"use client";

import { Button } from "@/components/ui/button";

type CheckoutScreenProps = {
  onComplete: () => void;
};

export function CheckoutScreen({ onComplete }: CheckoutScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 pb-4 py-12 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
        <span className="text-2xl text-accent">✓</span>
      </div>
      <h3 className="text-lg font-medium text-foreground">
        Order Confirmed
      </h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-sm">
        Thank you for shopping with Aeternum. Your order has been placed and
        you will receive a confirmation shortly.
      </p>
      <Button className="mt-6" onClick={onComplete}>
        Start New Consultation
      </Button>
    </div>
  );
}
