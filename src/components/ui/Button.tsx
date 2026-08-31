import { ButtonHTMLAttributes, forwardRef } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'accent'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

const base = `
  inline-flex items-center justify-center gap-2 font-medium
  rounded-pill transition-all duration-200 ease-out
  active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none
  select-none whitespace-nowrap cursor-pointer
`

const variants: Record<ButtonVariant, string> = {
  // Solid ink button — the standard high-contrast action
  primary: `
    bg-ink text-bg hover:opacity-90
    shadow-sm hover:shadow-md
  `,
  // Outlined hairline — secondary actions
  secondary: `
    bg-transparent text-ink border border-hairline
    hover:border-hairline-strong hover:bg-bg-elevated
  `,
  // No border, no fill — tertiary / nav-adjacent actions
  ghost: `
    bg-transparent text-ink-secondary
    hover:text-ink hover:bg-bg-elevated
  `,
  // Signature accent pair fill — reserved for single high-intent CTA per screen (e.g. Subscribe / Download)
  accent: `
    text-white hover:brightness-110
    shadow-md
  `,
}

const sizes: Record<ButtonSize, string> = {
  sm: 'min-h-[36px] px-3.5 text-xs sm:text-[13px]',
  md: 'min-h-[44px] px-5 text-xs sm:text-[14px]',
  lg: 'min-h-[48px] px-6 text-sm sm:text-[15px]',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', style, children, ...props }, ref) => {
    const accentStyle =
      variant === 'accent'
        ? { backgroundImage: 'var(--accent-gradient)', ...style }
        : style

    return (
      <button
        ref={ref}
        className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
        style={accentStyle}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
