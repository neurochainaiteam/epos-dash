// ---------------------------------------------------------------------------
// NeuroChain Ai brand mark — a brain built from neural / circuit pathways,
// stroked in the signature cyan → magenta gradient.
//
// Self-contained inline SVG: no external asset dependency, so the build never
// breaks on a missing logo file. (A standalone copy also lives at
// src/assets/neurochain-logo.svg and public/favicon.svg.)
// ---------------------------------------------------------------------------

export default function BrandMark({ className = 'h-9 w-9', title = 'NeuroChain Ai' }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label={title}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="nc-brand-grad" x1="6" y1="10" x2="58" y2="54" gradientUnits="userSpaceOnUse">
          <stop stopColor="#05D7EE" />
          <stop offset="1" stopColor="#EF36F5" />
        </linearGradient>
      </defs>

      {/* Brain silhouette — two hemispheres of circuit pathways */}
      <path
        d="M32 12c-4.4-3.2-11-2.6-14.2 1.6-3 .2-5.6 2.3-6.2 5.3-2.8 1.2-4.4 4.2-3.6 7.1-2 2.2-2.3 5.5-.6 8 .1 3.4 2.6 6.3 6 6.9 1.4 3.4 5 5.4 8.6 4.7 2.4 2.6 6.4 3 9.2 1V12Z"
        stroke="url(#nc-brand-grad)"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <path
        d="M32 12c4.4-3.2 11-2.6 14.2 1.6 3 .2 5.6 2.3 6.2 5.3 2.8 1.2 4.4 4.2 3.6 7.1 2 2.2 2.3 5.5.6 8-.1 3.4-2.6 6.3-6 6.9-1.4 3.4-5 5.4-8.6 4.7-2.4 2.6-6.4 3-9.2 1V12Z"
        stroke="url(#nc-brand-grad)"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />

      {/* Central spine */}
      <path d="M32 12v40" stroke="url(#nc-brand-grad)" strokeWidth="2.4" strokeLinecap="round" />

      {/* Circuit traces */}
      <path d="M32 22h-7v8h-6M32 34h-9M32 42h-6v-4" stroke="url(#nc-brand-grad)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M32 26h8M32 36h7v6h5M32 18h6v6" stroke="url(#nc-brand-grad)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />

      {/* Nodes */}
      <g fill="#05D7EE">
        <circle cx="19" cy="30" r="2.3" />
        <circle cx="23" cy="34" r="2.3" />
        <circle cx="26" cy="38" r="2.3" />
        <circle cx="25" cy="22" r="2.3" />
      </g>
      <g fill="#EF36F5">
        <circle cx="40" cy="26" r="2.3" />
        <circle cx="44" cy="42" r="2.3" />
        <circle cx="38" cy="18" r="2.3" />
        <circle cx="39" cy="36" r="2.3" />
      </g>
    </svg>
  )
}
