// ---------------------------------------------------------------------------
// NeuroChain Ai — central theme tokens (JS side).
//
// CSS variables in src/index.css drive the component styling; this file mirrors
// the brand palette for places that need concrete colour strings — chiefly
// recharts, which can't read CSS custom properties. Keep the two in sync.
// ---------------------------------------------------------------------------

export const BRAND = {
  charcoal: '#3A3A3A',
  silver: '#E1E1E1',
  cyan: '#05D7EE',
  magenta: '#EF36F5',
  violet: '#1D014D',
}

// Signature gradient stops, cyan → magenta.
export const GRADIENT = [BRAND.cyan, BRAND.magenta]

// Colours used inside charts (recharts can't reach CSS vars).
export const CHART = {
  cyan: BRAND.cyan,
  cyanSoft: 'hsl(186 70% 30%)',
  magenta: BRAND.magenta,
  grid: 'hsl(260 30% 20%)',
  axis: 'hsl(255 14% 60%)',
  cursor: 'hsl(186 80% 50% / 0.10)',
}
