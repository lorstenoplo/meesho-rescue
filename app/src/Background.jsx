import { motion } from 'framer-motion'

// Nested-arch motif from the DICE deck. Used only on the header and footer bands,
// so the three demo screens sit on a clean, high-contrast surface.
function Arch({ x, y, s = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill="none" stroke="#6D1251" strokeWidth="13">
      {[96, 72, 48, 24].map((r) => <path key={r} d={`M${-r} 140 V0 A${r} ${r} 0 0 1 ${r} 0 V140`} />)}
    </g>
  )
}

function Arches({ h, y0 = 0, s = 0.8 }) {
  const tiles = []
  for (let row = 0; row < 3; row++)
    for (let col = 0; col < 11; col++)
      tiles.push(<Arch key={`${row}-${col}`} s={s} x={col * 170 + (row % 2 ? 85 : 0) - 30} y={y0 + row * 190} />)
  return <svg width="1600" height={h} style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>{tiles}</svg>
}

export function TopBand({ children }) {
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 92, background: 'var(--plum-800)', zIndex: 2 }}>
      <Arches h={92} y0={34} />
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 5, display: 'flex' }}>
        {['#FAC961', '#8A1D68', '#C6C44A', '#E25175'].map((c) => <span key={c} style={{ flex: 1, background: c }} />)}
      </div>
      {children}
    </div>
  )
}

export function BottomBand({ children }) {
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 140, zIndex: 3 }}>
      <motion.svg width="1600" height="140" viewBox="0 0 1600 140" style={{ position: 'absolute', inset: 0 }}
        initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.9, ease: 'easeOut' }}>
        <defs>
          <clipPath id="waveTop"><path d="M0 22 C 220 0, 420 34, 640 16 S 1040 0, 1260 18 S 1520 30, 1600 8 V140 H0 Z" /></clipPath>
          <clipPath id="waveBody"><path d="M0 34 C 220 12, 420 46, 640 28 S 1040 12, 1260 30 S 1520 42, 1600 20 V140 H0 Z" /></clipPath>
        </defs>
        <g clipPath="url(#waveTop)">
          <rect x="0" width="400" height="140" fill="#FAC961" />
          <rect x="400" width="400" height="140" fill="#8A1D68" />
          <rect x="800" width="400" height="140" fill="#C6C44A" />
          <rect x="1200" width="400" height="140" fill="#E25175" />
        </g>
        <g clipPath="url(#waveBody)">
          <rect width="1600" height="140" fill="#570A47" />
          <g fill="none" stroke="#6D1251" strokeWidth="11">
            {Array.from({ length: 11 }, (_, i) => i * 160 - 20).map((x) => (
              <g key={x}>{[70, 50, 30].map((r) => <path key={r} d={`M${x - r} 160 V${80} A${r} ${r} 0 0 1 ${x + r} 80 V160`} />)}</g>
            ))}
          </g>
        </g>
      </motion.svg>
      <div style={{ position: 'absolute', left: 32, right: 32, top: 34, bottom: 0, display: 'flex', alignItems: 'center', gap: 20, color: '#fff' }}>
        {children}
      </div>
    </div>
  )
}

// Rescue mark: a parcel whose route loops back on itself and lands on a new pin.
export function Logo({ size = 46 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <rect width="48" height="48" rx="14" fill="#F7A21B" />
      <g fill="none" stroke="#3E0632" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 19l8-4 8 4v9l-8 4-8-4z" />
        <path d="M9 19l8 4 8-4M17 23v9" />
        <path d="M25 30c6 4 12 2 12-5" strokeDasharray="0.1 4.2" />
      </g>
      <path d="M37 9.5c-3.3 0-6 2.6-6 5.9 0 4.3 6 9.6 6 9.6s6-5.3 6-9.6c0-3.3-2.7-5.9-6-5.9z" fill="#B8246A" />
      <circle cx="37" cy="15.4" r="2.2" fill="#FFF8EC" />
    </svg>
  )
}
