import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/** Format a number as GBP currency. */
export function gbp(value, { decimals = 0 } = {}) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

/** Format a number as a percentage string. */
export function pct(value, { decimals = 1 } = {}) {
  return `${value.toFixed(decimals)}%`
}
