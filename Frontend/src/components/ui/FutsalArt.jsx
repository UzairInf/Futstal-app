// Inline SVG artwork (no external images) used by the landing page and auth screens.

function BallShape({ cx, cy, r, idPrefix }) {
  return (
    <g>
      <ellipse cx={cx} cy={cy + r * 1.05} rx={r * 1.1} ry={r * 0.28} fill="#000" opacity="0.28" />
      <circle cx={cx} cy={cy} r={r} fill={`url(#${idPrefix}-ball)`} />
      <polygon
        points={`${cx},${cy - r * 0.38} ${cx + r * 0.36},${cy - r * 0.12} ${cx + r * 0.22},${cy + r * 0.3} ${cx - r * 0.22},${cy + r * 0.3} ${cx - r * 0.36},${cy - r * 0.12}`}
        fill="#13231c"
      />
      <path
        d={`M${cx} ${cy - r * 0.38} L${cx} ${cy - r} M${cx + r * 0.36} ${cy - r * 0.12} L${cx + r * 0.95} ${cy - r * 0.3} M${cx + r * 0.22} ${cy + r * 0.3} L${cx + r * 0.6} ${cy + r * 0.8} M${cx - r * 0.22} ${cy + r * 0.3} L${cx - r * 0.6} ${cy + r * 0.8} M${cx - r * 0.36} ${cy - r * 0.12} L${cx - r * 0.95} ${cy - r * 0.3}`}
        stroke="#13231c"
        strokeWidth={r * 0.06}
        fill="none"
        strokeLinecap="round"
      />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#13231c" strokeWidth={r * 0.05} opacity="0.35" />
    </g>
  )
}

function BallGradient({ idPrefix }) {
  return (
    <radialGradient id={`${idPrefix}-ball`} cx="35%" cy="30%" r="80%">
      <stop offset="0" stopColor="#ffffff" />
      <stop offset="1" stopColor="#cfd9d4" />
    </radialGradient>
  )
}

/** Small logo mark for the navbar / footer / auth panel. */
export function BallIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="1.8" />
      <polygon points="12,7.6 15.8,10.4 14.4,14.8 9.6,14.8 8.2,10.4" fill="currentColor" />
      <path
        d="M12 7.6V2.8M15.8 10.4l4.4-1.6M14.4 14.8l2.8 3.8M9.6 14.8l-2.8 3.8M8.2 10.4L3.8 8.8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  )
}

/** Wide court scene shown in the lower part of the hero banner. */
export function HeroArt() {
  return (
    <svg viewBox="0 0 1200 380" preserveAspectRatio="xMidYMax slice" role="img" aria-label="Futsal court under floodlights">
      <defs>
        <linearGradient id="hero-grass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1f8a55" />
          <stop offset="1" stopColor="#0a3d26" />
        </linearGradient>
        <linearGradient id="hero-beam" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <BallGradient idPrefix="hero" />
      </defs>

      <rect width="1200" height="380" fill="url(#hero-grass)" />

      {/* mowing stripes */}
      {Array.from({ length: 12 }).map((_, i) => (
        <rect key={i} x={i * 100} y="0" width="50" height="380" fill="#ffffff" opacity="0.04" />
      ))}

      {/* floodlight beams */}
      <polygon points="120,0 40,380 330,380" fill="url(#hero-beam)" opacity="0.35" />
      <polygon points="1080,0 870,380 1160,380" fill="url(#hero-beam)" opacity="0.35" />

      {/* court markings (perspective) */}
      <g fill="none" stroke="#ffffff" strokeOpacity="0.8" strokeWidth="3" strokeLinejoin="round">
        <polygon points="180,372 1020,372 900,70 300,70" />
        <line x1="240" y1="221" x2="960" y2="221" />
        <ellipse cx="600" cy="221" rx="74" ry="26" />
        <path d="M 520 70 Q 600 150 680 70" />
        <path d="M 470 372 Q 600 250 730 372" />
        <rect x="552" y="56" width="96" height="14" strokeOpacity="0.9" />
      </g>
      <circle cx="600" cy="221" r="4" fill="#ffffff" opacity="0.85" />

      <BallShape cx={830} cy={290} r={30} idPrefix="hero" />
    </svg>
  )
}

/** Vertical night-pitch scene for the split-screen auth panel. */
export function AuthArt() {
  return (
    <svg viewBox="0 0 600 900" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Futsal court at night">
      <defs>
        <linearGradient id="auth-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0f5a37" />
          <stop offset="0.55" stopColor="#0b3a27" />
          <stop offset="1" stopColor="#06200f" />
        </linearGradient>
        <radialGradient id="auth-glow" cx="50%" cy="38%" r="55%">
          <stop offset="0" stopColor="#c6f36b" stopOpacity="0.38" />
          <stop offset="1" stopColor="#c6f36b" stopOpacity="0" />
        </radialGradient>
        <BallGradient idPrefix="auth" />
      </defs>

      <rect width="600" height="900" fill="url(#auth-bg)" />
      <rect width="600" height="900" fill="url(#auth-glow)" />

      {Array.from({ length: 9 }).map((_, i) => (
        <rect key={i} x="0" y={i * 100} width="600" height="50" fill="#ffffff" opacity="0.035" />
      ))}

      <g fill="none" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="3">
        <rect x="70" y="110" width="460" height="680" rx="6" />
        <line x1="70" y1="450" x2="530" y2="450" />
        <circle cx="300" cy="450" r="86" />
        <rect x="190" y="110" width="220" height="110" />
        <rect x="190" y="680" width="220" height="110" />
        <path d="M 240 220 A 60 60 0 0 0 360 220" />
        <path d="M 240 680 A 60 60 0 0 1 360 680" />
      </g>
      <circle cx="300" cy="450" r="5" fill="#ffffff" opacity="0.8" />

      <BallShape cx={300} cy={400} r={46} idPrefix="auth" />
    </svg>
  )
}

/** Illustration for the image-led feature card (court with ball). */
export function GroundArt() {
  return (
    <svg viewBox="0 0 520 260" preserveAspectRatio="xMidYMax slice" role="img" aria-label="Futsal court">
      <defs>
        <linearGradient id="ground-grass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2aa165" />
          <stop offset="1" stopColor="#0e5a36" />
        </linearGradient>
        <BallGradient idPrefix="ground" />
      </defs>
      <path d="M0 90 Q 130 40 260 70 T 520 50 V260 H0 Z" fill="url(#ground-grass)" />
      {Array.from({ length: 7 }).map((_, i) => (
        <rect key={i} x={i * 80} y="40" width="40" height="220" fill="#ffffff" opacity="0.05" />
      ))}
      <g fill="none" stroke="#ffffff" strokeOpacity="0.75" strokeWidth="3">
        <ellipse cx="260" cy="170" rx="90" ry="32" />
        <line x1="40" y1="170" x2="480" y2="170" />
      </g>
      <BallShape cx={380} cy={140} r={26} idPrefix="ground" />
    </svg>
  )
}

/** Goal + net scene for the use-case card. */
export function GoalArt() {
  return (
    <svg viewBox="0 0 800 260" preserveAspectRatio="xMidYMax slice" role="img" aria-label="Futsal goal">
      <defs>
        <linearGradient id="goal-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e8f5ee" />
          <stop offset="1" stopColor="#c7e6d4" />
        </linearGradient>
        <linearGradient id="goal-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1f8a55" />
          <stop offset="1" stopColor="#0b4a2c" />
        </linearGradient>
        <BallGradient idPrefix="goal" />
      </defs>
      <rect width="800" height="260" fill="url(#goal-bg)" />
      <rect y="190" width="800" height="70" fill="url(#goal-floor)" />
      <line x1="0" y1="190" x2="800" y2="190" stroke="#ffffff" strokeOpacity="0.8" strokeWidth="3" />

      {/* net */}
      <g stroke="#0f3d2a" strokeOpacity="0.28" strokeWidth="1.5">
        {Array.from({ length: 14 }).map((_, i) => (
          <line key={`v${i}`} x1={260 + i * 20} y1="40" x2={260 + i * 20} y2="190" />
        ))}
        {Array.from({ length: 8 }).map((_, i) => (
          <line key={`h${i}`} x1="260" y1={40 + i * 20} x2="520" y2={40 + i * 20} />
        ))}
      </g>
      {/* frame */}
      <path d="M260 190 V40 H520 V190" fill="none" stroke="#ffffff" strokeWidth="9" strokeLinejoin="round" />
      <path d="M260 190 V40 H520 V190" fill="none" stroke="#0f3d2a" strokeOpacity="0.18" strokeWidth="2" />

      <BallShape cx={600} cy={200} r={28} idPrefix="goal" />
    </svg>
  )
}