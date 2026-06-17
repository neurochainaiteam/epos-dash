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
  // Light cyan tint for de-emphasised bars/points within a single-series
  // chart (e.g. non-peak hours) — stays in the cyan family, just lighter.
  cyanSoft: 'hsl(186 70% 85%)',
  // Neutral grey for a chart's secondary data series. Per the redesign, a
  // second series only gets magenta when it specifically represents
  // something alert-worthy — otherwise it should read as neutral, not as a
  // second "brand" colour competing with cyan.
  secondary: '#9CA3AF',
  magenta: BRAND.magenta,
  grid: '#E5E7EB',
  axis: '#6B7280',
  cursor: 'hsl(186 80% 50% / 0.12)',
}
