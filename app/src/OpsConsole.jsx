/*
 * Valmo ops console: live map, Stage 1 eligibility, Stage 2 buyer scoring table and the action bar.
 * Scores come from engine.js, so the numbers on screen are the real spec formula.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion'
import { Icon, Hint, rise } from './ui.jsx'
import { rank, fmt, EXCLUDED, PARCEL } from './engine.js'
import { PHASES, DRIVE } from './flow.js'
import kiranaImg from './assets/kirana_club.png'
import scooterImg from './assets/scooter.png'
import rtoImg from './assets/rto.png'

const MAP_W = 840, MAP_H = 236
const KIRANA = { x: 57, y: 66 }
const HOME = { x: EXCLUDED.mx, y: EXCLUDED.my }
const ORDER = ['enroute', 'door', 'stage1', 'scoring', 'rescue', 'toKirana', 'wave1', 'offer', 'reserved', 'delivering', 'collected', 'wave2', 'rto']
const at = (phase, p) => ORDER.indexOf(phase) >= ORDER.indexOf(p)

export default function OpsConsole({ phase, go, hint, mode, selected, setSelected }) {
  const ranked = useMemo(() => rank(mode), [mode])
  const status = PHASES[phase].status
  const scored = at(phase, 'scoring') && phase !== 'enroute'
  return (
    <div style={{ width: '100%', height: '100%', background: 'var(--cream)', borderRadius: 26, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: 'inset 0 0 0 1px #E6D6DF' }}>
      <div style={{ position: 'relative', height: 52, flex: 'none', display: 'flex', alignItems: 'center', gap: 12, padding: '0 20px', borderBottom: '1px solid var(--line)', background: '#fff' }}>
        <Icon name="console" size={18} style={{ color: 'var(--plum-800)' }} />
        <span className="display" style={{ fontWeight: 700, fontSize: 14 }}>Valmo Ops · Rescue engine</span>
        <span style={{ flex: 1 }} />
        <span className="mono" style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>{PARCEL.id} · Kurti · Tier {PARCEL.tier}</span>
        <AnimatePresence mode="popLayout">
          <motion.span key={status[0]} className={`chip ${status[1]}`} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}>{status[0]}</motion.span>
        </AnimatePresence>
      </div>
      <MapView phase={phase} go={go} hint={hint} ranked={ranked} scored={scored} selected={selected} setSelected={setSelected} />
      <div style={{ flex: 1, display: 'flex', minHeight: 0, background: '#fff' }}>
        <Stage1 phase={phase} />
        <div style={{ flex: 1, minWidth: 0, padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="eyebrow">Stage 2 · Buyer matching</div>
            <span style={{ flex: 1 }} />
            <span className="mono" style={{ fontSize: 11, color: 'var(--ink-2)' }}>0.8 × strongest signal × match{mode === 'enhanced' ? ' × intent' : ''}</span>
          </div>
          {scored
            ? <Scores ranked={ranked} mode={mode} phase={phase} selected={selected} setSelected={setSelected} />
            : <Waiting />}
        </div>
      </div>
      <ActionBar phase={phase} go={go} hint={hint} />
    </div>
  )
}

// The console's one primary action always lives here, bottom right.
function ActionBar({ phase, go, hint }) {
  const A = {
    stage1: { t: 'Checking the parcel…', s: 'Runs automatically. No one has to do anything.', busy: true },
    scoring: { t: 'Top 3 buyers found', s: 'They get the offer once the parcel reaches the Rescue Point. Tap a buyer to see their score.', btn: 'Send rider to Rescue Point', icon: 'nav', to: 'rescue' },
    wave2: { t: 'Wave 2 · next 5 buyers · wider radius', s: 'Wave 1 expired. The parcel is still at the kirana.', btn: 'Nobody buys again', icon: 'clock', to: 'rto' },
    rto: { t: 'Back to a normal return', s: 'A delivery partner collects it from the kirana. Only extra cost: holding time.', done: true },
  }[phase] || { t: 'Rescue engine', s: 'Watching this parcel.' }
  return (
    <div style={{ height: 64, flex: 'none', borderTop: '1px solid var(--line)', background: 'var(--cream)', display: 'flex', alignItems: 'center', gap: 14, padding: '0 16px 0 20px' }}>
      {A.busy && <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ width: 18, height: 18, borderRadius: '50%', border: '2.5px solid var(--magenta)', borderTopColor: 'transparent', flex: 'none' }} />}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="display" style={{ fontWeight: 700, fontSize: 14 }}>{A.t}</div>
        <div style={{ fontSize: 12, color: 'var(--ink-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{A.s}</div>
      </div>
      {A.btn && (
        <Hint on={hint} radius={14}>
          <motion.button className="btn btn-primary" style={{ height: 46, fontSize: 14 }} whileTap={{ scale: 0.96 }} onClick={() => go(A.to)}>
            <Icon name={A.icon} size={16} /> {A.btn}
          </motion.button>
        </Hint>
      )}
    </div>
  )
}

function Stage1({ phase }) {
  const run = at(phase, 'stage1') && phase !== 'enroute' && phase !== 'door'
  const gates = [
    { t: 'Seller opted in', s: 'Gate a' },
    { t: 'Tier B · not Tier C', s: 'Gate b' },
  ]
  return (
    <div style={{ width: 196, flex: 'none', borderRight: '1px solid var(--line)', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className="eyebrow">Stage 1 · Eligibility</div>
      {!run && <div style={{ fontSize: 12.5, color: 'var(--ink-3)', lineHeight: 1.5 }}>Runs as soon as a COD parcel is refused at the door.</div>}
      {run && gates.map((g, i) => (
        <motion.div key={g.t} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: phase === 'stage1' ? 0.3 + i * 0.6 : 0 }}
          style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'var(--teal-100)', borderRadius: 10, padding: '8px 10px' }}>
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: phase === 'stage1' ? 0.5 + i * 0.6 : 0, type: 'spring', stiffness: 500, damping: 15 }} style={{ color: 'var(--teal)', display: 'flex' }}><Icon name="check" size={17} stroke={3} /></motion.span>
          <span style={{ fontSize: 12.5, fontWeight: 600 }}>{g.t}<br /><span style={{ fontWeight: 500, fontSize: 11, color: 'var(--ink-3)' }}>{g.s}</span></span>
        </motion.div>
      ))}
      {run && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: phase === 'stage1' ? 1.6 : 0 }}
          style={{ marginTop: 'auto', borderRadius: 14, background: 'var(--plum-800)', color: '#fff', padding: '10px 14px' }}>
          <div style={{ fontSize: 11, opacity: 0.75 }}>Base weight</div>
          <div className="mono" style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.1 }}>0.8</div>
        </motion.div>
      )}
    </div>
  )
}

function Waiting() {
  return (
    <div style={{ flex: 1, border: '1.5px dashed #E4CFDB', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, textAlign: 'center' }}>
      <div style={{ fontSize: 13, color: 'var(--ink-3)', maxWidth: 380, lineHeight: 1.5 }}>Runs right after Stage 1 passes. Nearby buyers are scored on cart, wishlist, search and local demand.</div>
    </div>
  )
}

function Scores({ ranked, mode, phase, selected, setSelected }) {
  const enh = mode === 'enhanced'
  const cols = `16px 28px minmax(0,1fr) 62px ${enh ? '42px ' : ''}100px`
  const sel = ranked.find((c) => c.id === selected) || ranked[0]
  return (
    <div style={{ flex: 1, display: 'flex', gap: 14, minHeight: 0 }}>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <div className="table-row" style={{ gridTemplateColumns: cols, cursor: 'default', fontSize: 10, fontWeight: 700, letterSpacing: '.06em', color: 'var(--ink-3)', minHeight: 20, padding: '0 10px' }}>
          <span>#</span><span>ID</span><span>BEST SIGNAL</span><span>MATCH</span>{enh && <span>INTENT</span>}<span>SCORE</span>
        </div>
        <motion.div layout style={{ display: 'flex', flexDirection: 'column' }}>
          {ranked.map((c, i) => {
            const st = rowState(c, phase)
            return (
              <motion.button layout key={c.id} className={`table-row ${sel.id === c.id ? 'sel' : ''}`} onClick={() => setSelected(c.id)}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: st.dim ? 0.45 : 1, y: 0 }} transition={{ layout: { type: 'spring', stiffness: 300, damping: 30 }, delay: i * 0.05 }}
                style={{ gridTemplateColumns: cols, minHeight: 25, padding: '2px 10px', background: st.bg }}>
                <span className="mono" style={{ color: 'var(--ink-3)' }}>{c.rank}</span>
                <span className="mono" style={{ fontWeight: 700 }}>{c.id}</span>
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--ink-2)' }}>{c.best.label}{c.sigs.length > 1 ? ` (+${c.sigs.length - 1})` : ''}</span>
                <span className="mono" style={{ fontSize: 11, whiteSpace: 'nowrap' }}>{c.match === 'exact' ? 'exact' : 'sim'} ×{c.mult}</span>
                {enh && <span className="mono" style={{ fontSize: 11.5, color: c.intent < 0.6 ? 'var(--magenta-600)' : '#0B6355' }}>×{c.intent}</span>}
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ flex: 1, height: 7, background: '#F0E4EA', borderRadius: 4, overflow: 'hidden' }}>
                    <motion.span style={{ display: 'block', height: '100%', background: st.color, borderRadius: 4 }} initial={{ width: 0 }} animate={{ width: `${c.score * 100}%` }} transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }} />
                  </span>
                  <span className="mono" style={{ fontWeight: 700, width: 38, textAlign: 'right' }}>{fmt(c.score)}</span>
                </span>
              </motion.button>
            )
          })}
        </motion.div>
      </div>
      <Breakdown c={sel} enh={enh} />
    </div>
  )
}

function rowState(c, phase) {
  const won = ['reserved', 'delivering', 'collected'].includes(phase) && c.id === 'C3'
  if (won) return { bg: 'var(--teal-100)', color: 'var(--teal)' }
  if (phase === 'wave2' || phase === 'rto') return c.wave === 2 ? { bg: 'var(--pink-50)', color: 'var(--magenta)' } : { dim: true, color: '#B9A5B4' }
  if (c.wave === 1) return { bg: 'var(--pink-50)', color: at(phase, 'wave1') ? 'var(--plum-600)' : 'var(--magenta)', dim: ['reserved', 'delivering', 'collected'].includes(phase) }
  return { color: '#C9B5C2', dim: ['reserved', 'delivering', 'collected'].includes(phase) }
}

function Breakdown({ c, enh }) {
  const parts = [
    { k: 'Base', v: c.base, s: 'Tier B' },
    { k: 'Signal', v: c.best.score, s: c.best.type === 'region' ? 'area' : c.best.type },
    { k: 'Match', v: c.mult, s: c.match },
    ...(enh ? [{ k: 'Intent', v: c.intent, s: 'model' }] : []),
  ]
  return (
    <div style={{ width: 196, flex: 'none', background: 'var(--cream)', borderRadius: 16, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <span className="display" style={{ fontWeight: 700 }}>Buyer {c.id}</span>
        <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>rank {c.rank} · wave {c.wave}</span>
      </div>
      <AnimatePresence mode="popLayout">
        <motion.div key={c.id + enh} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {c.sigs.map((s, i) => (
              <div key={i} style={{ fontSize: 11.5, display: 'flex', justifyContent: 'space-between', color: s === c.best ? 'var(--ink)' : 'var(--ink-3)', textDecoration: s === c.best || c.sigs.length === 1 ? 'none' : 'line-through' }}>
                <span>{s.label}</span><span className="mono">{fmt(s.score)}</span>
              </div>
            ))}
            {c.sigs.length > 1 && <div style={{ fontSize: 10.5, color: 'var(--magenta-600)', fontWeight: 700 }}>Strongest signal used, never added</div>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
            {parts.map((p, i) => (
              <span key={p.k} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                {i > 0 && <span style={{ color: 'var(--ink-3)', fontSize: 12 }}>×</span>}
                <span style={{ background: '#fff', borderRadius: 8, padding: '3px 6px', textAlign: 'center', boxShadow: 'inset 0 0 0 1px var(--line)' }}>
                  <span className="mono" style={{ display: 'block', fontSize: 13, fontWeight: 700 }}>{fmt(p.v)}</span>
                  <span style={{ display: 'block', fontSize: 9, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.05em' }}>{p.s}</span>
                </span>
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--ink-2)' }}>Final score</span>
            <span className="mono display" style={{ fontSize: 26, fontWeight: 700, color: 'var(--plum-800)' }}>{fmt(c.score)}</span>
          </div>
          {c.note && <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{c.note}</div>}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

/* ---------------- MAP ---------------- */

// Rider routes follow the drawn roads (map % coords). DRIVE matches the rider phone's timers.
const PARK_HOME = { x: 37, y: 47 }
const PARK_KIRANA = { x: 53.5, y: 66 }
const PARK_BUYER = { x: 67.5, y: 76 }
const ROUTES = {
  enroute: [{ x: 8, y: 100 }, { x: 16, y: 72 }, { x: 25, y: 48 }, PARK_HOME],
  toKirana: [PARK_HOME, { x: 51, y: 48 }, { x: 52.5, y: 58 }, PARK_KIRANA],
  delivering: [PARK_KIRANA, { x: 54.5, y: 75 }, PARK_BUYER],
}
function riderPos(phase) {
  if (ROUTES[phase]) return { route: ROUTES[phase] }
  if (['door', 'stage1', 'scoring', 'rescue'].includes(phase)) return { at: PARK_HOME }
  if (phase === 'reserved') return { at: PARK_KIRANA }
  if (phase === 'collected') return { at: PARK_BUYER }
  if (['wave1', 'offer', 'wave2'].includes(phase)) return { at: PARK_KIRANA, faded: true }
  return null
}
const CAM_S = 1.35
const clampC = (v) => Math.max(50 / CAM_S, Math.min(100 - 50 / CAM_S, v))
const camXY = (cx, cy, sc) => ({ x: (0.5 - clampC(cx) / 100) * MAP_W * sc, y: (0.5 - clampC(cy) / 100) * MAP_H * sc })
// Point along a polyline at progress t (0..1), by distance.
function along(r, t) {
  const d = r.slice(1).map((p, i) => Math.hypot((p.x - r[i].x) * MAP_W, (p.y - r[i].y) * MAP_H))
  let goal = d.reduce((a, b) => a + b, 0) * t
  for (let i = 0; i < d.length; i++) {
    if (goal <= d[i] || i === d.length - 1) { const k = d[i] ? Math.min(1, goal / d[i]) : 1; return { x: r[i].x + (r[i + 1].x - r[i].x) * k, y: r[i].y + (r[i + 1].y - r[i].y) * k } }
    goal -= d[i]
  }
  return r[r.length - 1]
}

// One progress value drives both the rider and the map camera, so they never drift apart.
function useDrive(phase, rp) {
  const t = useMotionValue(1)
  const route = useRef([{ x: 0, y: 0 }, { x: 0, y: 0 }])
  const camX = useMotionValue(0), camY = useMotionValue(0), camS = useMotionValue(1)
  useEffect(() => {
    const stops = []
    if (rp?.route) {
      route.current = rp.route
      t.set(0)
      stops.push(animate(camS, CAM_S, { duration: 0.6, ease: 'easeOut' }))
      const follow = (v) => { const p = along(rp.route, v); const c = camXY(p.x, p.y, camS.get()); camX.set(c.x); camY.set(c.y) }
      follow(0)
      const unsub = t.on('change', follow)
      stops.push({ stop: unsub })
      stops.push(animate(t, 1, { duration: DRIVE, ease: [0.45, 0, 0.35, 1] }))
    } else {
      if (rp?.at) route.current = [rp.at, rp.at]
      t.set(1)
      const zoom = phase === 'door' || phase === 'stage1'
      const target = zoom ? { s: CAM_S, ...camXY(PARK_HOME.x, PARK_HOME.y - 6, CAM_S) } : { s: 1, x: 0, y: 0 }
      const o = { duration: 1.1, ease: [0.4, 0, 0.2, 1] }
      stops.push(animate(camS, target.s, o), animate(camX, target.x, o), animate(camY, target.y, o))
    }
    return () => stops.forEach((s) => s.stop())
  }, [phase])
  const left = useTransform(t, (v) => `${along(route.current, v).x}%`)
  const top = useTransform(t, (v) => `${along(route.current, v).y}%`)
  return { left, top, camX, camY, camS }
}

function MapView({ phase, go, hint, ranked, scored, selected, setSelected }) {
  const rp = useMemo(() => riderPos(phase), [phase])
  const drive = useDrive(phase, rp)
  const won = ['reserved', 'delivering', 'collected'].includes(phase)
  const wave = phase === 'wave2' || phase === 'rto' ? 2 : at(phase, 'wave1') && !won ? 1 : 0
  const offered = at(phase, 'wave1') ? ranked.filter((c) => (phase === 'wave2' || phase === 'rto' ? c.wave === 2 : c.wave === 1)) : []
  const lines = won ? ranked.filter((c) => c.id === 'C3') : phase === 'rto' ? [] : offered
  const px = (p) => ({ left: `${p.x}%`, top: `${p.y}%` })

  return (
    <div style={{ height: MAP_H, flex: 'none', position: 'relative', overflow: 'hidden', background: '#F5EBDD' }}>
      <motion.div style={{ position: 'absolute', inset: 0, transformOrigin: '50% 50%', x: drive.camX, y: drive.camY, scale: drive.camS }}>
      <svg width={MAP_W} height={MAP_H} style={{ position: 'absolute', inset: 0 }}>
        <path d="M0 240 C 120 220, 200 280, 330 262 S 560 290, 840 250" stroke="#CFE3EA" strokeWidth="26" fill="none" />
        <g stroke="#fff" strokeWidth="11" fill="none" strokeLinecap="round">
          <path d="M0 115 L840 145" /><path d="M60 300 L330 0" /><path d="M420 0 L460 300" /><path d="M590 300 L790 0" /><path d="M0 36 L840 64" /><path d="M150 0 L240 300" />
        </g>
        <g stroke="#fff" strokeWidth="4.5" fill="none">
          <path d="M0 196 L840 206" /><path d="M335 0 L365 300" /><path d="M660 0 L640 300" /><path d="M520 0 L560 300" /><path d="M0 290 L840 300" /><path d="M70 0 L95 300" />
        </g>
        <g fill="#EADCC9">
          <rect x="250" y="155" width="60" height="28" rx="5" /><rect x="480" y="78" width="60" height="46" rx="5" /><rect x="680" y="165" width="70" height="28" rx="5" /><rect x="100" y="55" width="42" height="44" rx="5" /><rect x="720" y="40" width="50" height="40" rx="5" />
        </g>
        <g fill="#D7E6B8"><circle cx="560" cy="200" r="22" /><circle cx="200" cy="230" r="16" /></g>
      </svg>

      {/* wave rings */}
      <AnimatePresence>
        {wave > 0 && (
          <motion.div key={'w' + wave} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1, ease: 'easeOut' }}
            style={{ position: 'absolute', ...px(KIRANA), width: wave === 1 ? 680 : 860, height: wave === 1 ? 680 : 860, marginLeft: wave === 1 ? -340 : -430, marginTop: wave === 1 ? -340 : -430, borderRadius: '50%', background: 'rgba(213,54,126,.07)', border: '2px solid rgba(213,54,126,.35)' }} />
        )}
      </AnimatePresence>
      {wave > 0 && (
        <motion.div key={'p' + wave} style={{ position: 'absolute', ...px(KIRANA), width: 600, height: 600, marginLeft: -300, marginTop: -300, borderRadius: '50%', border: '3px solid rgba(213,54,126,.55)' }}
          animate={{ scale: [0.1, 1.2], opacity: [0.9, 0] }} transition={{ duration: 2.6, repeat: Infinity, ease: 'easeOut' }} />
      )}

      {/* excluded neighbourhood */}
      <AnimatePresence>
        {scored && (
          <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'absolute', ...px(HOME), width: 120, height: 120, marginLeft: -60, marginTop: -60, borderRadius: '50%', background: 'repeating-linear-gradient(45deg, rgba(62,6,50,.1) 0 6px, transparent 6px 12px)', border: '1.5px dashed rgba(62,6,50,.45)' }}>
            <span style={{ position: 'absolute', bottom: -20, left: '50%', transform: 'translateX(-50%)', fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap', background: 'rgba(255,255,255,.9)', padding: '1px 6px', borderRadius: 5, color: 'var(--ink-2)' }}>Original buyer’s area · excluded</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* offer lines */}
      <svg width={MAP_W} height={MAP_H} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <AnimatePresence>
          {lines.map((c) => (
            <motion.line key={c.id + phase} x1={KIRANA.x * MAP_W / 100} y1={KIRANA.y * MAP_H / 100} x2={c.mx * MAP_W / 100} y2={c.my * MAP_H / 100}
              stroke={won ? 'var(--teal)' : 'var(--magenta)'} strokeWidth="2.5" strokeDasharray="6 6"
              initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1, strokeDashoffset: [0, -24] }} exit={{ opacity: 0 }}
              transition={{ pathLength: { duration: 0.8 }, strokeDashoffset: { duration: 1, repeat: Infinity, ease: 'linear' } }} />
          ))}
        </AnimatePresence>
      </svg>

      {/* home pin */}
      <div style={{ position: 'absolute', ...px(HOME), transform: 'translate(-50%,-100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 4 }}>
        <AnimatePresence mode="popLayout">
          <motion.div key={phase === 'enroute' ? 'a' : 'b'} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ background: phase === 'enroute' ? 'var(--plum-800)' : 'var(--coral)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 8px', borderRadius: 8, whiteSpace: 'nowrap' }}>
            {phase === 'enroute' ? 'Delivery address' : 'Refused here'}
          </motion.div>
        </AnimatePresence>
        <div style={{ width: 2, height: 9, background: 'var(--plum-800)' }} />
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--plum-800)', transform: 'translateY(5px)' }} />
      </div>

      {/* candidates */}
      <AnimatePresence>
        {scored && ranked.map((c, i) => {
          const isOffered = offered.some((o) => o.id === c.id)
          const isWin = won && c.id === 'C3'
          const top = c.wave === 1
          const bg = isWin ? 'var(--teal)' : isOffered ? 'var(--plum-600)' : (!at(phase, 'wave1') && top) ? 'var(--magenta)' : '#B9A5B4'
          const big = isWin || isOffered || (!at(phase, 'wave1') && top)
          return (
            <motion.button key={c.id} onClick={() => setSelected(c.id)} aria-label={`Buyer ${c.id}, score ${fmt(c.score)}`}
              initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: won && !isWin ? 0.5 : 1 }} exit={{ scale: 0 }}
              transition={{ delay: phase === 'scoring' ? 0.15 + i * 0.1 : 0, type: 'spring', stiffness: 400, damping: 18 }}
              style={{ position: 'absolute', ...px({ x: c.mx, y: c.my }), width: 44, height: 44, marginLeft: -22, marginTop: -22, border: 0, background: 'transparent', cursor: 'pointer', zIndex: 5, display: 'grid', placeItems: 'center', padding: 0 }}>
              <motion.span animate={{ width: big ? 28 : 18, height: big ? 28 : 18, background: bg }}
                style={{ borderRadius: '50%', border: '3px solid #fff', boxShadow: selected === c.id ? '0 0 0 3px var(--saffron), 0 3px 10px rgba(62,6,50,.3)' : '0 3px 10px rgba(62,6,50,.3)', display: 'grid', placeItems: 'center', color: '#fff', fontSize: 11, fontWeight: 800, fontFamily: 'var(--mono)' }}>
                {isWin ? <Icon name="check" size={13} stroke={3.5} /> : big ? c.rank : ''}
              </motion.span>
              <span className="mono" style={{ position: 'absolute', top: 38, left: '50%', transform: 'translateX(-50%)', fontSize: 10, fontWeight: 700, background: 'rgba(255,255,255,.92)', padding: '1px 5px', borderRadius: 5, whiteSpace: 'nowrap', color: 'var(--ink)' }}>{c.id} · {fmt(c.score)}</span>
            </motion.button>
          )
        })}
      </AnimatePresence>

      {/* kirana */}
      <motion.div style={{ position: 'absolute', ...px(KIRANA), x: '-50%', y: '-78%', zIndex: 6, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
        animate={at(phase, 'toKirana') && phase !== 'enroute' ? { scale: [1, 1.08, 1] } : {}} transition={{ duration: 0.6 }}>
        <img src={kiranaImg} alt="" style={{ height: 40, borderRadius: 10, border: '3px solid #fff', filter: 'drop-shadow(0 4px 8px rgba(62,6,50,.25))' }} />
        <span style={{ fontSize: 10.5, fontWeight: 800, background: '#fff', padding: '2px 7px', borderRadius: 6, whiteSpace: 'nowrap', marginTop: -2, fontFamily: 'var(--display)' }}>Rescue Point · Kirana Club</span>
      </motion.div>

      {/* rider */}
      {/* route */}
      {rp?.route && (
        <svg width={MAP_W} height={MAP_H} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 6 }}>
          <motion.polyline points={rp.route.map((p) => `${p.x * MAP_W / 100},${p.y * MAP_H / 100}`).join(' ')} fill="none" stroke="var(--magenta)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="2 8"
            initial={{ pathLength: 0, opacity: 0.9 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6 }} />
        </svg>
      )}
      {/* rider */}
      {rp && (
        <motion.div style={{ position: 'absolute', zIndex: 7, width: 0, height: 0, left: drive.left, top: drive.top }} animate={{ opacity: rp.faded ? 0.55 : 1 }}>
          <motion.img src={scooterImg} alt="" style={{ position: 'absolute', height: 46, left: -23, top: -40, filter: 'drop-shadow(0 4px 6px rgba(62,6,50,.3))' }}
            animate={rp.route ? { y: [0, -2, 0] } : { y: 0 }} transition={{ duration: 0.3, repeat: rp.route ? Infinity : 0 }} />
          <motion.span style={{ position: 'absolute', left: -7, top: -7, width: 14, height: 14, borderRadius: '50%', background: 'rgba(213,54,126,.35)' }}
            animate={{ scale: [1, 2.2], opacity: [0.7, 0] }} transition={{ duration: 1.4, repeat: Infinity }} />
        </motion.div>
      )}
      {phase === 'rto' && (
        <motion.img src={rtoImg} alt="" initial={{ opacity: 0, x: 0 }} animate={{ opacity: 1, x: 60 }} transition={{ duration: 2, ease: 'easeInOut' }}
          style={{ position: 'absolute', ...px({ x: KIRANA.x + 6, y: KIRANA.y }), height: 56, zIndex: 7, marginTop: -20 }} />
      )}

      </motion.div>

      <MapOverlay phase={phase} go={go} hint={hint} />

      <div style={{ position: 'absolute', right: 12, bottom: 10, background: 'rgba(255,255,255,.94)', borderRadius: 10, padding: '6px 10px', display: 'flex', gap: 12, fontSize: 10.5, color: 'var(--ink-2)', zIndex: 8 }}>
        {[['var(--magenta)', 'Top 3'], ['var(--plum-600)', 'Offer sent'], ['#B9A5B4', 'Other buyer'], ['var(--teal)', 'Bought']].map(([c, t]) => (
          <span key={t} style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 9, height: 9, borderRadius: '50%', background: c }} />{t}</span>
        ))}
        <span className="mono" style={{ color: 'var(--ink-3)' }}>Coimbatore · simulated</span>
      </div>
    </div>
  )
}

function MapOverlay({ phase, go, hint }) {
  let body = null
  if (phase === 'wave1' || phase === 'offer') body = (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }} style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--magenta)' }} />
        <span className="display" style={{ fontWeight: 700, fontSize: 13 }}>Wave 1 · top 3 · 12 h</span>
      </div>
      <div style={{ fontSize: 11.5, color: 'var(--ink-2)' }}>Offers sent to C1, C2, C3. Max one push a day each.</div>
      <button className="btn btn-line" style={{ minHeight: 36, fontSize: 12, padding: '0 12px' }} onClick={() => go('wave2')}>
        <Icon name="clock" size={14} /> Skip ahead: nobody buys
      </button>
    </>
  )
  if (phase === 'reserved') body = (
    <>
      <div className="display" style={{ fontWeight: 700, fontSize: 13, color: '#0B6355' }}>Sold to C3 · rider assigned</div>
      <div style={{ fontSize: 11.5, color: 'var(--ink-2)' }}>C1 and C2 are told the deal is gone. The nearest rider picks the parcel up from the kirana.</div>
    </>
  )
  if (phase === 'delivering') body = (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }} style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--teal)' }} />
        <span className="display" style={{ fontWeight: 700, fontSize: 13 }}>Out for delivery · 1.4 km</span>
      </div>
      <div style={{ fontSize: 11.5, color: 'var(--ink-2)' }}>Kirana to buyer C3. A local hop instead of a return trip to the seller.</div>
    </>
  )
  if (phase === 'collected') body = (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--teal)', color: '#fff', display: 'grid', placeItems: 'center' }}><Icon name="check" size={15} stroke={3} /></span>
        <span className="display" style={{ fontWeight: 800, fontSize: 16, color: '#0B6355' }}>Parcel rescued</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 8 }}>
        {[['₹419', 'sale saved'], ['2', 'return trips avoided'], ['4 h 8 m', 'refusal to delivery'], ['₹12', 'kirana fee']].map(([v, l], i) => (
          <motion.div key={l} {...rise(0.15 + i * 0.08)} style={{ background: 'var(--cream)', borderRadius: 10, padding: '6px 8px' }}>
            <div className="mono" style={{ fontWeight: 700, fontSize: 15 }}>{v}</div>
            <div style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>{l}</div>
          </motion.div>
        ))}
      </div>
    </>
  )
  return (
    <AnimatePresence mode="popLayout">
      {body && (
        <motion.div key={phase === 'offer' ? 'wave1' : phase} initial={{ opacity: 0, y: -10, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6 }}
          style={{ position: 'absolute', left: 12, top: 12, width: 232, background: 'rgba(255,255,255,.97)', borderRadius: 16, padding: 12, display: 'flex', flexDirection: 'column', gap: 8, boxShadow: '0 12px 30px -14px rgba(62,6,50,.4)', zIndex: 9 }}>
          {body}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
