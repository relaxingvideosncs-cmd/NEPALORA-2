import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "accent";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const base = `
  inline-flex items-center justify-center gap-2 font-medium
  rounded-pill transition-all duration-200 ease-out
  active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none
  select-none whitespace-nowrap
`;

const variants: Record<Variant, string> = {
  // Solid ink button — the main CTA. B&W by default, on purpose.
  primary: `
    bg-ink text-bg
    hover:opacity-90
    shadow-sm hover:shadow-md
  `,
  // Outlined — secondary actions
  secondary: `
    bg-transparent text-ink border border-hairline
    hover:border-ink-secondary hover:bg-bg-elevated
  `,
  // No border, no fill — tertiary / nav-adjacent actions
  ghost: `
    bg-transparent text-ink-secondary
    hover:text-ink hover:bg-bg-elevated
  `,
  // The ONE place the red/blue pair appears as a fill —
  // reserve for a single high-intent action per screen
  // (e.g. "Subscribe"), never for routine buttons.
  accent: `
    text-white
    hover:brightness-110
    shadow-md
  `,
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-4 text-[13px]",
  md: "h-10 px-5 text-[14px]",
  lg: "h-12 px-6 text-[15px]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className = "", style, children, ...props }, ref) => {
    const accentStyle =
      variant === "accent"
        ? { backgroundImage: "var(--accent-gradient)", ...style }
        : style;

    return (
      <button
        ref={ref}
        className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
        style={accentStyle}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
