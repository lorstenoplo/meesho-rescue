import { motion, AnimatePresence } from 'framer-motion'
import { Icon } from './ui.jsx'
import Town3D from './Town3D.jsx'

// The real-world moment for each step: one 3D town, a new camera shot per step.
export default function Scene({ phase, caption, go }) {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: 28, overflow: 'hidden', background: 'linear-gradient(180deg, #FFE9D2 0%, #FBE4DA 60%, #F6D9CF 100%)' }}>
      <Town3D phase={phase} />
      <AnimatePresence>
        {phase === 'wave1' && (
          <motion.button key="what-if" className="btn btn-line" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0, transition: { delay: 1.2 } }} exit={{ opacity: 0 }}
            onClick={() => go('wave2')} style={{ position: 'absolute', left: 22, top: 20, minHeight: 42, fontSize: 13, zIndex: 30 }}>
            <Icon name="clock" size={15} /> What if nobody buys?
          </motion.button>
        )}
      </AnimatePresence>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '64px 28px 22px', background: 'linear-gradient(180deg, rgba(62,6,50,0) 0%, rgba(62,6,50,.85) 72%)', pointerEvents: 'none', zIndex: 30 }}>
        <AnimatePresence mode="popLayout">
          <motion.div key={caption} className="display" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.15 } }} exit={{ opacity: 0 }}
            style={{ color: '#fff', fontSize: 26, fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.2 }}>{caption}</motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
