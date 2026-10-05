import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// Coach-mark: after a short pause, dim everything except the next control and point a tapping hand at it.
// The overlay ignores pointer events, so taps go straight through to the real button.
export default function Spotlight({ target, stageRef, sceneRef, scale, idleKey, off }) {
  const [rect, setRect] = useState(null)
  const [scene, setScene] = useState(null)
  const [show, setShow] = useState(false)
  const raf = useRef(0)

  useEffect(() => {
    setShow(false)
    const t = setTimeout(() => setShow(true), 2500)
    return () => clearTimeout(t)
  }, [idleKey, target?.el])

  useEffect(() => {
    const tick = () => {
      const el = target?.el, st = stageRef.current
      if (el && st && el.isConnected) {
        const r = el.getBoundingClientRect(), s = st.getBoundingClientRect()
        const next = { x: (r.left - s.left) / scale, y: (r.top - s.top) / scale, w: r.width / scale, h: r.height / scale }
        setRect((p) => (p && Math.abs(p.x - next.x) < 0.5 && Math.abs(p.y - next.y) < 0.5 && Math.abs(p.w - next.w) < 0.5 && Math.abs(p.h - next.h) < 0.5 ? p : next))
      } else setRect(null)
      const sc = sceneRef?.current, st2 = stageRef.current
      if (sc && st2) {
        const r = sc.getBoundingClientRect(), s = st2.getBoundingClientRect()
        const n = { x: (r.left - s.left) / scale, y: (r.top - s.top) / scale, w: r.width / scale, h: r.height / scale }
        setScene((p) => (p && Math.abs(p.x - n.x) < 0.5 && Math.abs(p.w - n.w) < 0.5 ? p : n))
      }
      raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [target, stageRef, sceneRef, scale])

  const visible = show && rect && !off && rect.w > 4
  const pad = 10
  const hole = rect && { x: rect.x - pad, y: rect.y - pad, w: rect.w + pad * 2, h: rect.h + pad * 2, r: (target?.radius ?? 16) + pad }
  return (
    <AnimatePresence>
      {visible && (
        <motion.div key="spot" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}
          style={{ position: 'absolute', inset: 0, zIndex: 100, pointerEvents: 'none' }}>
          <svg width="1600" height="900" style={{ position: 'absolute', inset: 0 }}>
            <defs>
              <mask id="spot-hole">
                <rect width="1600" height="900" fill="#fff" />
                <rect x={hole.x} y={hole.y} width={hole.w} height={hole.h} rx={hole.r} fill="#000" />
                {scene && <rect x={scene.x} y={scene.y} width={scene.w} height={scene.h} rx="28" fill="#000" />}
              </mask>
            </defs>
            <rect width="1600" height="900" fill="rgba(20,4,16,.42)" mask="url(#spot-hole)" />
            <rect x={hole.x} y={hole.y} width={hole.w} height={hole.h} rx={hole.r} fill="none" stroke="#F7A21B" strokeWidth="4" />
          </svg>
          <motion.div style={{ position: 'absolute', left: hole.x - 8, top: hole.y - 8, width: hole.w + 16, height: hole.h + 16, borderRadius: hole.r + 8, border: '3px solid rgba(247,162,27,.8)' }}
            animate={{ scale: [1, 1.12], opacity: [0.9, 0] }} transition={{ duration: 1.3, repeat: Infinity, ease: 'easeOut' }} />
          <Hand x={hole.x + hole.w / 2} y={hole.y + hole.h - 6} above={hole.y + hole.h > 760} top={hole.y} />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Hand({ x, y, above, top }) {
  // Fingertip sits on the control; label floats beside the hand.
  const tipY = above ? top + 6 : y
  return (
    <motion.div style={{ position: 'absolute', left: x - 22, top: above ? tipY - 70 : tipY, width: 64, height: 70 }}
      animate={{ y: [0, above ? -10 : 10, 0], scale: [1, 0.94, 1] }} transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}>
      <svg width="64" height="70" viewBox="0 0 24 26" style={{ transform: above ? 'rotate(180deg)' : 'none', filter: 'drop-shadow(0 6px 10px rgba(0,0,0,.45))' }}>
        <path d="M9 2.2a1.8 1.8 0 0 1 3.6 0V11l.2-1.2a1.8 1.8 0 0 1 3.5.6l-.1 1.3.3-.9a1.8 1.8 0 0 1 3.4 1.1l-.2 1 .2-.4a1.7 1.7 0 0 1 3.1 1.4l-1.4 5.6A6.5 6.5 0 0 1 15.3 24h-2.7a6.5 6.5 0 0 1-5-2.4l-4.7-5.8a1.9 1.9 0 0 1 2.9-2.4L9 16z"
          fill="#FFFFFF" stroke="#3E0632" strokeWidth="1.3" strokeLinejoin="round" />
      </svg>
      <span style={{ position: 'absolute', left: 60, top: above ? 6 : 34, background: '#F7A21B', color: '#3E0632', fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 15, padding: '6px 12px', borderRadius: 999, whiteSpace: 'nowrap', boxShadow: '0 8px 18px -8px rgba(0,0,0,.5)' }}>Tap here</span>
    </motion.div>
  )
}
