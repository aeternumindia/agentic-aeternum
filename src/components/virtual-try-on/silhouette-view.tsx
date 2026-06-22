"use client";

type SilhouetteViewProps = {
  hasTop: boolean;
  hasBottom: boolean;
};

export function SilhouetteView({ hasTop, hasBottom }: SilhouetteViewProps) {
  return (
    <div className="relative flex items-center justify-center">
      <svg
        viewBox="0 0 200 400"
        className="w-40 h-80 sm:w-48 sm:h-96"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Head */}
        <circle cx="100" cy="35" r="22" className="stroke-muted-foreground/30" strokeWidth="2" />

        {/* Neck */}
        <line x1="100" y1="57" x2="100" y2="72" className="stroke-muted-foreground/30" strokeWidth="2" />

        {/* Body - Torso */}
        <path
          d="M72 72 Q72 85 75 95 L63 160 Q60 170 58 175 L52 180 L148 180 L142 175 Q140 170 137 160 L125 95 Q128 85 128 72"
          className={`transition-colors duration-500 ${
            hasTop ? "fill-accent/20 stroke-accent/40" : "fill-muted/20 stroke-muted-foreground/20"
          }`}
          strokeWidth="1.5"
        />

        {/* Left Arm */}
        <path
          d="M72 80 Q55 95 48 130 Q44 145 48 155"
          className="stroke-muted-foreground/30"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Right Arm */}
        <path
          d="M128 80 Q145 95 152 130 Q156 145 152 155"
          className="stroke-muted-foreground/30"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Bottom / Legs area */}
        <path
          d="M58 180 Q55 190 53 200 L48 300 Q46 310 48 320 Q52 330 60 330 L82 330 Q85 330 85 325 L88 260 Q90 250 100 250 Q110 250 112 260 L115 325 Q115 330 118 330 L140 330 Q148 330 152 320 Q154 310 152 300 L147 200 Q145 190 142 180"
          className={`transition-colors duration-500 ${
            hasBottom ? "fill-accent/15 stroke-accent/30" : "fill-muted/20 stroke-muted-foreground/20"
          }`}
          strokeWidth="1.5"
        />

        {/* Left Foot */}
        <path
          d="M48 320 Q40 322 38 330 Q36 338 48 340 L82 340 Q88 340 88 335"
          className="stroke-muted-foreground/30"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Right Foot */}
        <path
          d="M112 335 Q112 340 118 340 L152 340 Q164 338 162 330 Q160 322 152 320"
          className="stroke-muted-foreground/30"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Labels */}
        {hasTop && (
          <text x="100" y="140" textAnchor="middle" className="fill-accent text-[10px] font-medium" opacity="0.7">
            TOP
          </text>
        )}
        {hasBottom && (
          <text x="100" y="280" textAnchor="middle" className="fill-accent text-[10px] font-medium" opacity="0.7">
            BOTTOM
          </text>
        )}
        {!hasTop && !hasBottom && (
          <text x="100" y="200" textAnchor="middle" className="fill-muted-foreground/40 text-[10px]">
            Select garments to preview
          </text>
        )}
      </svg>
    </div>
  );
}
