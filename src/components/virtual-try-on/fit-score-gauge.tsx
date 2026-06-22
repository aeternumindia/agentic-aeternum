"use client";

import { useEffect, useState } from "react";

type FitScoreGaugeProps = {
  score: number;
  size?: "sm" | "md";
};

export function FitScoreGauge({ score, size = "md" }: FitScoreGaugeProps) {
  const radius = size === "sm" ? 36 : 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const [animatedOffset, setAnimatedOffset] = useState(circumference);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedOffset(offset), 200);
    return () => clearTimeout(timer);
  }, [offset]);

  const color =
    score >= 85 ? "#22c55e" : score >= 70 ? "#8b5e3a" : score >= 50 ? "#eab308" : "#8c3a3f";
  const dim = size === "sm" ? 80 : 128;
  const textSize = size === "sm" ? "text-lg" : "text-2xl";

  return (
    <div className="relative flex items-center justify-center" style={{ width: dim, height: dim }}>
      <svg className="absolute inset-0" viewBox={`0 0 ${dim} ${dim}`}>
        <circle
          cx={dim / 2}
          cy={dim / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          className="text-muted/40"
          strokeWidth="6"
        />
        <circle
          cx={dim / 2}
          cy={dim / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={animatedOffset}
          className="transition-all duration-1000 ease-out"
          transform={`rotate(-90 ${dim / 2} ${dim / 2})`}
        />
      </svg>
      <span className={`${textSize} font-semibold text-foreground`}>
        {score}
        <span className="text-xs text-muted-foreground">%</span>
      </span>
    </div>
  );
}
