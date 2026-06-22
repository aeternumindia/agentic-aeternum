import { cn } from "@/lib/utils";

export function GridBackground({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative w-full",
        "[background-size:40px_40px]",
        "[background-image:linear-gradient(to_right,hsl(210_52%_10%/0.06)_1px,transparent_1px),linear-gradient(to_bottom,hsl(210_52%_10%/0.06)_1px,transparent_1px)]",
        "dark:[background-image:linear-gradient(to_right,hsl(0_0%_100%/0.06)_1px,transparent_1px),linear-gradient(to_bottom,hsl(0_0%_100%/0.06)_1px,transparent_1px)]",
        className,
      )}
    >
      <div className="absolute pointer-events-none inset-0 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,hsl(0_0%_0%/0.8))] dark:[mask-image:radial-gradient(ellipse_at_center,transparent_20%,hsl(0_0%_0%/0.8))]" />
      {children}
    </div>
  );
}
