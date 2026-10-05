// Shared UI bits: icons, the Hint wrapper (registers the next tap target), animation presets.
import { createContext, useContext, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// The one control the presenter should tap next. App draws the spotlight around it.
export const HintTarget = createContext(() => {})

const P = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }
const paths = {
  check: <path d="M5 12l4.5 4.5L19 7" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  pin: <><path d="M12 21s-7-6.3-7-11a7 7 0 0 1 14 0c0 4.7-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></>,
  store: <><path d="M3 9l1.5-5h15L21 9" /><path d="M4 9v11h16V9" /><path d="M3 9h18" /><path d="M10 20v-6h4v6" /></>,
  back: <path d="M15 6l-6 6 6 6" />,
  next: <path d="M9 6l6 6-6 6" />,
  restart: <><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /></>,
  hand: <><path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V12" /><path d="M11 11.5V4a1.5 1.5 0 0 1 3 0v7.5" /><path d="M14 11.5V6a1.5 1.5 0 0 1 3 0v8" /><path d="M17 10.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-2a6 6 0 0 1-5-2.7L4.2 14a1.6 1.6 0 0 1 2.6-1.8L8 13.5" /></>,
  bolt: <path d="M13 2L4 14h7l-1 8 9-12h-7z" />,
  scan: <><path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3" /><path d="M4 12h16" /></>,
  nav: <path d="M3 11l18-8-8 18-2-8z" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  upi: <><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M7 15l2-6 2 6M15 9v6" /></>,
  cash: <><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="2.5" /><path d="M6 9v.01M18 15v.01" /></>,
  phone: <><rect x="6" y="2" width="12" height="20" rx="2.5" /><path d="M11 18h2" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></>,
  console: <><rect x="3" y="3" width="18" height="18" rx="3" /><path d="M3 9h18M9 21V9" /></>,
  box: <><path d="M21 8l-9-5-9 5v8l9 5 9-5z" /><path d="M3 8l9 5 9-5M12 13v8" /></>,
  play: <path d="M7 4.5v15l13-7.5z" fill="currentColor" stroke="none" />,
  pause: <><rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none" /><rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8v.01" /></>,
  truck: <><path d="M3 6h11v10H3zM14 10h4l3 3v3h-7" /><circle cx="7" cy="17.5" r="1.8" /><circle cx="17" cy="17.5" r="1.8" /></>,
}
export function Icon({ name, size = 18, stroke = 2, style }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" {...P} strokeWidth={stroke} style={style} aria-hidden="true">{paths[name]}</svg>
}

// Presenter coach-mark: a pulsing saffron ring around the thing to tap next.
export function Hint({ on, children, style, radius = 18 }) {
  const ref = useRef(null)
  const register = useContext(HintTarget)
  useEffect(() => {
    if (!on) return
    const el = ref.current
    register({ el, radius })
    return () => register((cur) => (cur && cur.el === el ? null : cur))
  }, [on, register, radius])
  return (
    <div ref={ref} className="hint" style={style}>
      {children}
      <AnimatePresence>
        {on && (
          <motion.div className="hint-ring" style={{ borderRadius: radius }}
            initial={{ opacity: 0, scale: 1.15 }}
            animate={{ opacity: [0.95, 0.35, 0.95], scale: [1, 1.035, 1] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }} />
        )}
      </AnimatePresence>
    </div>
  )
}

export const screen = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 260, damping: 28, delay: 0.08 } },
  exit: { opacity: 0, x: -40, pointerEvents: 'none', transition: { duration: 0.16 } },
}

export const rise = (d = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { delay: d, type: 'spring', stiffness: 300, damping: 26 } },
})

export function Ill({ src, h, style, float }) {
  return (
    <motion.img src={src} alt="" draggable={false}
      style={{ height: h, width: 'auto', display: 'block', userSelect: 'none', ...style }}
      animate={float ? { y: [0, -4, 0] } : undefined}
      transition={float ? { duration: 2.6, repeat: Infinity, ease: 'easeInOut' } : undefined} />
  )
}
