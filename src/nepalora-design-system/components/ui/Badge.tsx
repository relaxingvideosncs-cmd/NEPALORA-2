interface BadgeProps {
  children: React.ReactNode;
  tone?: "neutral" | "red" | "blue";
}

// Categories/tags are the ONLY other place color shows up besides
// the Button's accent variant and the signature underline — keep
// it that disciplined and the palette stays premium, not noisy.

const tones = {
  neutral: "bg-bg-elevated text-ink-secondary border-hairline",
  red: "bg-transparent text-accent-red border-accent-red/30",
  blue: "bg-transparent text-accent-blue border-accent-blue/30",
};

export function Badge({ children, tone = "neutral" }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center h-6 px-3 rounded-pill border text-[11px]
        font-medium uppercase tracking-wide ${tones[tone]}
      `}
    >
      {children}
    </span>
  );
}
