import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        outline: 'text-foreground',
        // Global status pill style: exact hex pairs, not opacity tints.
        success: 'border-transparent bg-[#DCFCE7] text-success',
        warning: 'border-transparent bg-[#F59E0B] text-[#D97706]',
        destructive: 'border-transparent bg-[#FEE2E2] text-destructive',
        // Cyan pill — primary accent (e.g. "All locations", insight counts).
        accent: 'border-transparent bg-[#ECFEFF] text-brand-cyanText',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

function Badge({ className, variant, ...props }) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
