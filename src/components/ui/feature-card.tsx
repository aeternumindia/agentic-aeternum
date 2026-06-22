import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface FeatureCardProps {
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  href: string;
  ctaText?: string;
}

export function FeatureCard({ title, subtitle, description, imageUrl, href, ctaText = "CTA more" }: FeatureCardProps) {
  return (
    <div className="flex flex-col gap-4 group">
      <div className="relative w-full aspect-[4/3] rounded-[2rem] overflow-hidden bg-muted">
        <img src={imageUrl} alt={title} className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105" />
      </div>
      <div>
        <h3 className="text-lg font-bold text-foreground mb-1">
          {title}:
        </h3>
        <p className="text-base font-medium text-foreground mb-2">
          {subtitle}
        </p>
        <p className="text-xs text-foreground/75 mb-4 line-clamp-3 leading-relaxed pr-4">
          {description}
        </p>
        <Link href={href} className="inline-flex items-center text-xs font-bold hover:opacity-75 text-foreground transition-opacity">
          {ctaText} <ArrowRight className="ml-1 w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
