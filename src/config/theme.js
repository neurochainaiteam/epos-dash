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
  violet: '#1D014D',
  red: '#EF4444',
  amber: '#F59E0B',
  green: '#16A34A',
}

// Colours used inside charts (recharts can't reach CSS vars).
export const CHART = {
  cyan: BRAND.cyan,
  // Light cyan tint for de-emphasised bars/points within a single-series
  // chart (e.g. non-peak hours) — stays in the cyan family, just lighter.
  cyanSoft: 'hsl(186 70% 85%)',
  // Neutral grey for a chart's secondary data series — reads as neutral,
  // not as a second "brand" colour competing with cyan.
  secondary: '#9CA3AF',
  red: BRAND.red,
  amber: BRAND.amber,
  green: BRAND.green,
  grid: '#E5E7EB',
  axis: '#6B7280',
  cursor: 'hsl(186 80% 50% / 0.12)',
}
