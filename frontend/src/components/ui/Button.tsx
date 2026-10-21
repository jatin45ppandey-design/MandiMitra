import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'quiet' | 'danger'

const variants: Record<Variant, string> = {
  primary: 'bg-forest-900 text-white hover:bg-forest-800',
  secondary: 'bg-sage-100 text-forest-950 hover:bg-sage-200',
  quiet: 'bg-transparent text-forest-800 hover:bg-sage-100',
  danger: 'bg-red-50 text-red-800 hover:bg-red-100',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
}

export function Button({ className = '', variant = 'primary', ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition duration-200 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-harvest-500 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-55 ${variants[variant]} ${className}`}
    />
  )
}

