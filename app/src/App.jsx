/*
 * App shell: the 1600x900 "tablet" stage, the story state machine and the layout.
 * One device is visible at a time (rider phone, ops console or buyer phone) next to the 3D scene.
 * Taps call go(phase); flow.js says what each phase shows and what to tap next.
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TopBand, BottomBand, Logo } from './Background.jsx'
import RiderPhone from './RiderPhone.jsx'
import BuyerPhone from './BuyerPhone.jsx'
import OpsConsole from './OpsConsole.jsx'
import Scene from './Scene.jsx'
import { Icon, Hint, HintTarget } from './ui.jsx'
import Spotlight from './Spotlight.jsx'
import { PHASES, HAPPY } from './flow.js'
import avatarRider from './assets/avatar_rider.png'
import avatarBuyer from './assets/avatar_buyer.png'

// Who's who. Only one of these devices is on screen at a time.
const ROLES = {
  rider: { name: 'Ravi', role: 'Delivery partner', app: 'Valmo rider app', avatar: avatarRider },
  ops: { name: 'Valmo ops', role: 'Rescue engine', app: 'Runs automatically in the background', icon: 'console' },
  buyer: { name: 'Kavya', role: 'Nearby buyer · C3', app: 'Meesho app', avatar: avatarBuyer },
}
const MODES = [
  { id: 'spec', label: 'Spec', tipTitle: 'Spec: the case-study formula',
    tip: 'Base weight × strongest signal × exact/similar match. Signals use the fixed time buckets from the spec.' },
  { id: 'enhanced', label: 'Enhanced', tipTitle: 'Enhanced: our extension',
    tip: 'Same formula, then × an intent score (0.3–1.0) from a model of past cart behaviour. Idle carts drop, so C1 falls from #1 to #3.' },
]
const AUTO_MS = { enroute: 4600, door: 3600, stage1: 3800, scoring: 5000, rescue: 3200, toKirana: 4800, wave1: 4200, offer: 4200, reserved: 3800, delivering: 5200 }

function useFit() {
  const [s, setS] = useState(1)
  useLayoutEffect(() => {
    const f = () => setS(Math.min((window.innerWidth - 40) / 1600, (window.innerHeight - 40) / 900))
    f(); window.addEventListener('resize', f); return () => window.removeEventListener('resize', f)
  }, [])
  return s
}

export default function App() {
  const scale = useFit()
  const [phase, setPhase] = useState('enroute')
  const [history, setHistory] = useState([])
  const [mode, setMode] = useState('spec')
  const [pay, setPay] = useState(null)
  const [selected, setSelected] = useState('C3')
  const [auto, setAuto] = useState(false)
  const [runId, setRunId] = useState(0)
  const [target, setTarget] = useState(null)
  const stageRef = useRef(null)
  const sceneRef = useRef(null)

  // Ignore taps for a moment after each step, so a double-tap can't skip the next screen.
  const lastGo = useRef(0)
  const go = useCallback((p) => {
    const now = Date.now()
    if (p === phase || now - lastGo.current < 600) return
    lastGo.current = now
    setHistory((h) => [...h, phase]); setPhase(p)
  }, [phase])
  const back = () => { if (!history.length) return; const h = [...history]; const p = h.pop(); setHistory(h); setPhase(p); if (p === 'offer') setPay(null) }
  const restart = () => { setPhase('enroute'); setHistory([]); setPay(null); setSelected('C3'); setRunId((r) => r + 1) }
  const nextHappy = useCallback(() => {
    if (phase === 'offer') { if (!pay) setPay('cod'); go('reserved'); return }
    const i = HAPPY.indexOf(phase)
    if (i >= 0 && i < HAPPY.length - 1) go(HAPPY[i + 1])
  }, [phase, pay, go])

  useEffect(() => { if (['reserved', 'delivering', 'collected'].includes(phase)) setSelected('C3') }, [phase])

  // Steps that play by themselves (no tap needed), autoplay or not.
  useEffect(() => {
    const t = { stage1: 3600, reserved: 3900 }[phase]
    if (!t || auto) return
    const id = setTimeout(nextHappy, t)
    return () => clearTimeout(id)
  }, [phase, auto, nextHappy])

  useEffect(() => {
    if (!auto || !AUTO_MS[phase]) { if (auto && phase === 'collected') setAuto(false); return }
    const timers = []
    if (phase === 'offer') timers.push(setTimeout(() => setPay((p) => p || 'cod'), 1800))
    timers.push(setTimeout(nextHappy, AUTO_MS[phase]))
    return () => timers.forEach(clearTimeout)
  }, [auto, phase, nextHappy])

  useEffect(() => {
    const k = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown') nextHappy()
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') back()
    }
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k)
  })

  const ph = PHASES[phase]
  const scr = ph.screen
  // Count each time the visible device changes, so its key is always new.
  const entryRef = useRef({ scr, n: 0 })
  if (entryRef.current.scr !== scr) entryRef.current = { scr, n: entryRef.current.n + 1 }
  const entry = entryRef.current.n
  const branch = phase === 'wave2' || phase === 'rto'
  const steps = branch ? ['enroute', 'door', 'stage1', 'scoring', 'rescue', 'toKirana', 'wave1', 'wave2', 'rto'] : HAPPY

  return (
    <div className="viewport">
      <HintTarget.Provider value={setTarget}>
      <div ref={stageRef} className="stage" style={{ transform: `scale(${scale})` }} key={runId}>
        <TopBand>
          <div style={{ position: 'absolute', left: 32, right: 32, top: 16, height: 56, display: 'flex', alignItems: 'center', gap: 16, color: '#fff' }}>
            <Logo size={48} />
            <div>
              <div className="display" style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1 }}>
                meesho <span style={{ color: 'var(--saffron)' }}>Rescue</span>
              </div>
              <div style={{ fontSize: 13, opacity: 0.75, marginTop: 4 }}>A refused COD parcel goes to a nearby buyer who wants it, not back to the seller</div>
            </div>
            <div style={{ flex: 1 }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(62,6,50,.55)', borderRadius: 14, padding: 4 }}>
              <span className="eyebrow" style={{ color: 'rgba(255,255,255,.65)', padding: '0 8px' }}>Scoring</span>
              {MODES.map((m) => (
                <Tip key={m.id} tip={m.tip} title={m.tipTitle}>
                  <button className="btn" onClick={() => setMode(m.id)} style={{ position: 'relative', background: 'transparent', color: mode === m.id ? 'var(--plum-900)' : '#fff', minHeight: 40, fontSize: 13 }}>
                    {mode === m.id && <motion.span layoutId="modepill" style={{ position: 'absolute', inset: 0, background: '#fff', borderRadius: 11 }} transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
                    <span style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 6 }}>{m.label}<Icon name="info" size={14} style={{ opacity: 0.6 }} /></span>
                  </button>
                </Tip>
              ))}
            </div>
            <div style={{ position: 'relative', background: 'rgba(62,6,50,.55)', borderRadius: 14, padding: '6px 16px', minWidth: 160 }}>
              <div className="eyebrow" style={{ color: 'rgba(255,255,255,.55)', fontSize: 9.5 }}>Simulated clock</div>
              <AnimatePresence mode="popLayout">
                <motion.div key={ph.clock} className="mono" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} style={{ fontSize: 17, fontWeight: 700 }}>{ph.clock}</motion.div>
              </AnimatePresence>
            </div>
          </div>
        </TopBand>

        {/* one scene + one device */}
        <div style={{ position: 'absolute', left: 32, right: 32, top: 106, height: 648, display: 'flex', justifyContent: 'center', gap: 36 }}>
          <motion.div animate={{ width: scr === 'ops' ? 624 : 1020 }} transition={{ type: 'spring', stiffness: 160, damping: 26 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
            <RoleHeader scr={scr} />
            <div ref={sceneRef} style={{ flex: 1, minHeight: 0 }}>
              <Scene phase={phase} caption={PHASES[phase].scene} go={go} />
            </div>
          </motion.div>
          <div style={{ position: 'relative', width: scr === 'ops' ? 840 : 300, height: 648, display: 'flex', alignItems: 'center' }}>
            {/* No exit animation here on purpose: a device that re-enters must always be a fresh, live copy. */}
              <motion.div key={scr + entry} initial={{ opacity: 0, x: 80, scale: 0.94 }} animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 220, damping: 26 }}
                style={{ borderRadius: scr === 'ops' ? 26 : 46, boxShadow: '0 0 0 4px var(--saffron), 0 30px 60px -24px rgba(0,0,0,.6)' }}>
                {scr === 'rider' && <RiderPhone phase={phase} go={go} hint pay={pay} />}
                {scr === 'buyer' && <BuyerPhone phase={phase} go={go} hint pay={pay} setPay={setPay} />}
                {scr === 'ops' && (
                  <div style={{ width: 840, height: 612 }}>
                    <OpsConsole phase={phase} go={go} hint mode={mode} selected={selected} setSelected={setSelected} />
                  </div>
                )}
              </motion.div>
          </div>
        </div>

        <BottomBand>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost" aria-label="Back" style={{ width: 46, padding: 0 }} onClick={back} disabled={!history.length}><Icon name="back" size={20} stroke={2.4} /></button>
            <button className="btn" aria-label={auto ? 'Pause autoplay' : 'Autoplay'} style={{ width: 54, padding: 0, background: 'var(--saffron)', color: 'var(--plum-900)' }} onClick={() => { if (!auto && phase === 'collected') restart(); setAuto(!auto) }}>
              <Icon name={auto ? 'pause' : 'play'} size={20} />
            </button>
            <button className="btn btn-ghost" aria-label="Restart" style={{ width: 46, padding: 0 }} onClick={restart}><Icon name="restart" size={18} stroke={2.4} /></button>
          </div>
          <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
            <AnimatePresence mode="popLayout">
              <motion.div key={phase + mode} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="mono" style={{ fontSize: 11.5, color: 'var(--saffron)', fontWeight: 700 }}>STEP {ph.n} / {steps.length}</span>
                  <span className="display" style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.01em' }}>{ph.title}</span>
                </div>
                <div style={{ fontSize: 13.5, color: 'rgba(255,255,255,.75)', marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {phase === 'scoring' && mode === 'enhanced' ? 'Enhanced: an intent model scales each score, so the idle cart C1 drops below real buyers. The formula stays the same.' : ph.body}
                </div>
                <div style={{ fontSize: 14.5, color: 'var(--saffron)', marginTop: 5, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800 }}>
                  <Icon name="hand" size={15} /> {auto && AUTO_MS[phase] ? 'Autoplaying…' : target ? <><span style={{ opacity: 0.75 }}>Next:</span> {ph.cue}</> : (ph.wait || ph.cue)}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            {steps.map((s, i) => {
              const cur = steps.indexOf(phase)
              return <motion.span key={s} animate={{ width: i === cur ? 26 : 8, background: i === cur ? 'var(--saffron)' : i < cur ? '#E25175' : 'rgba(255,255,255,.22)' }} style={{ height: 8, borderRadius: 4 }} />
            })}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Counter label="Parcels rescued" v={phase === 'collected' ? 1 : 0} color="#7FE0C7" />
            <Counter label="Sent back (RTO)" v={phase === 'rto' ? 1 : 0} color="#FF8E98" />
          </div>
        </BottomBand>
        <Spotlight target={target} stageRef={stageRef} sceneRef={sceneRef} scale={scale} idleKey={phase + (pay || '')} off={auto} />
      </div>
      </HintTarget.Provider>
    </div>
  )
}

function RoleHeader({ scr }) {
  const r = ROLES[scr]
  return (
    <div style={{ height: 84, display: 'flex', alignItems: 'center', gap: 16, color: '#fff', flex: 'none' }}>
      <AnimatePresence mode="popLayout">
        <motion.div key={scr} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ type: 'spring', stiffness: 260, damping: 26 }}
          style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 0 }}>
          {r.avatar
            ? <img src={r.avatar} alt="" style={{ width: 72, height: 72, borderRadius: '50%', border: '3px solid var(--saffron)', flex: 'none' }} />
            : <span style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--saffron)', color: 'var(--plum-900)', display: 'grid', placeItems: 'center', flex: 'none' }}><Icon name={r.icon} size={32} /></span>}
          <div style={{ minWidth: 0 }}>
            <div className="eyebrow" style={{ color: 'var(--saffron)', fontSize: 12 }}>You’re seeing</div>
            <div className="display" style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1, whiteSpace: 'nowrap' }}>
              {r.name}{scr !== 'ops' && <span style={{ fontWeight: 600, opacity: 0.75 }}>’s phone</span>}
            </div>
            <div style={{ fontSize: 14, opacity: 0.75, whiteSpace: 'nowrap' }}>{r.role} · {r.app}</div>
          </div>
        </motion.div>
      </AnimatePresence>
      <div style={{ flex: 1 }} />
      <div style={{ display: 'flex', gap: 6, flex: 'none' }}>
        {Object.entries(ROLES).map(([k, v]) => (
          <motion.span key={k} animate={{ opacity: k === scr ? 1 : 0.45, background: k === scr ? 'rgba(247,162,27,1)' : 'rgba(255,255,255,.1)', color: k === scr ? '#3E0632' : '#fff' }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 999, padding: '4px 10px 4px 4px', fontSize: 12, fontWeight: 700, fontFamily: 'var(--display)' }}>
            {v.avatar ? <img src={v.avatar} alt="" style={{ width: 24, height: 24, borderRadius: '50%' }} />
              : <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(255,255,255,.25)', display: 'grid', placeItems: 'center' }}><Icon name="console" size={13} /></span>}
            {k === 'rider' ? 'Rider' : k === 'ops' ? 'Ops' : 'Buyer'}
          </motion.span>
        ))}
      </div>
    </div>
  )
}

function Counter({ label, v, color }) {
  return (
    <div style={{ position: 'relative', background: 'rgba(255,255,255,.08)', borderRadius: 14, padding: '8px 14px', minWidth: 118 }}>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,.6)' }}>{label}</div>
      <AnimatePresence mode="popLayout">
        <motion.div key={v} className="mono" initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -14, opacity: 0 }} style={{ fontSize: 24, fontWeight: 700, color: v ? color : '#fff' }}>{v}</motion.div>
      </AnimatePresence>
    </div>
  )
}

function Tip({ tip, title, children }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ position: 'relative' }} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)} onFocus={() => setOpen(true)} onBlur={() => setOpen(false)}>
      {children}
      <AnimatePresence>
        {open && (
          <motion.div role="tooltip" initial={{ opacity: 0, y: -4, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.16 }}
            style={{ position: 'absolute', top: 'calc(100% + 12px)', right: 0, width: 280, background: '#fff', color: 'var(--ink)', borderRadius: 14, padding: '12px 14px', boxShadow: '0 18px 40px -12px rgba(62,6,50,.45)', zIndex: 50, pointerEvents: 'none' }}>
            <span style={{ position: 'absolute', top: -6, right: 28, width: 12, height: 12, background: '#fff', transform: 'rotate(45deg)', borderRadius: 2 }} />
            <div className="display" style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 4 }}>{title}</div>
            <div style={{ fontSize: 12.5, lineHeight: 1.5, color: 'var(--ink-2)' }}>{tip}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
