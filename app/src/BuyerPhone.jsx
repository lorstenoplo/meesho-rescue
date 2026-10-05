// Kavya's phone (Meesho app): lock-screen notification, offer, order tracking, delivered.
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Icon, Hint, Ill, screen, rise } from './ui.jsx'
import { PARCEL } from './engine.js'
import { DRIVE } from './flow.js'
import scooterImg from './assets/scooter.png'
import buyerImg from './assets/buyer_phone.png'

export default function BuyerPhone({ phase, go, hint, pay, setPay }) {
  const view =
    phase === 'offer' ? 'offer'
      : phase === 'reserved' ? 'confirmed'
        : phase === 'delivering' ? 'tracking'
          : phase === 'collected' ? 'collected'
          : 'lock'
  return (
    <div className="phone">
      <div className="phone-notch" />
      <div className="phone-screen">
        <AnimatePresence>
          <motion.div key={view} {...screen} style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>
            {view === 'lock' && <Lock phase={phase} go={go} hint={hint} />}
            {view !== 'lock' && <AppHead />}
            {view === 'offer' && <Offer go={go} hint={hint} pay={pay} setPay={setPay} />}
            {view === 'confirmed' && <Tracking pay={pay} stage={1} />}
            {view === 'tracking' && <Tracking pay={pay} stage={2} />}
            {view === 'collected' && <Collected pay={pay} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

function AppHead() {
  return (
    <div className="app-head" style={{ background: 'var(--magenta)' }}>
      <span className="display" style={{ fontWeight: 800, fontSize: 19, letterSpacing: '-0.02em' }}>meesho</span>
      <span className="chip" style={{ background: 'rgba(255,255,255,.2)', color: '#fff' }}>RESCUE DEAL</span>
    </div>
  )
}

function Lock({ phase, go, hint }) {
  const showNotif = phase === 'wave1'
  const missed = phase === 'wave2' || phase === 'rto'
  return (
    <div style={{ flex: 1, background: 'linear-gradient(170deg, #3E0632, #6D1251 55%, #B8246A)', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 70, position: 'relative', overflow: 'hidden' }}>
      <svg width="300" height="300" viewBox="-150 -40 300 300" style={{ position: 'absolute', bottom: -60, opacity: 0.12 }} fill="none" stroke="#fff" strokeWidth="14">
        {[130, 100, 70, 40].map((r) => <path key={r} d={`M${-r} 260 V80 A${r} ${r} 0 0 1 ${r} 80 V260`} />)}
      </svg>
      <div className="display" style={{ fontSize: 60, fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1 }}>{showNotif ? '14:31' : missed ? '09:10' : '14:12'}</div>
      <div style={{ fontSize: 13.5, opacity: 0.8, marginTop: 6 }}>{missed ? 'Monday, 5 October' : 'Sunday, 4 October'}</div>
      <AnimatePresence>
        {showNotif && (
          <motion.div initial={{ opacity: 0, y: -50, scale: 0.92 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 20, delay: 0.6 }} style={{ marginTop: 34, width: 256 }}>
            <Hint on={hint} radius={22}>
              <button onClick={() => go('offer')} style={{ width: '100%', textAlign: 'left', border: 0, cursor: 'pointer', background: 'rgba(255,255,255,.96)', color: 'var(--ink)', borderRadius: 20, padding: 14, boxShadow: '0 16px 40px -10px rgba(0,0,0,.5)', display: 'flex', flexDirection: 'column', gap: 5 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--ink-3)' }}>
                  <span className="display" style={{ width: 20, height: 20, borderRadius: 6, background: 'var(--magenta)', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 11 }}>m</span>
                  meesho · now
                </span>
                <span className="display" style={{ fontWeight: 700, fontSize: 14 }}>The kurti in your cart is nearby</span>
                <span style={{ fontSize: 12.5, lineHeight: 1.4, color: 'var(--ink-2)' }}>Size M, can reach you today by 6:30 pm. ₹{PARCEL.rescuePrice} (was ₹{PARCEL.price}).</span>
              </button>
            </Hint>
          </motion.div>
        )}
      </AnimatePresence>
      {!showNotif && (
        <div style={{ marginTop: 40, fontSize: 12, opacity: 0.6, textAlign: 'center', padding: '0 34px', lineHeight: 1.5 }}>
          {missed ? 'Rescue offer from yesterday expired' : 'Kurti in cart · added 5 h ago, not checked out'}
        </div>
      )}
      <div style={{ flex: 1 }} />
      <Ill src={buyerImg} h={150} style={{ marginBottom: -2, opacity: showNotif ? 1 : 0.9 }} />
    </div>
  )
}

function Kurti({ size = 120 }) {
  return (
    <svg width={size} height={size * 1.3} viewBox="0 0 100 130" fill="none">
      <path d="M35 6 L50 16 L65 6 L84 14 L96 44 L82 50 L76 34 L80 124 L20 124 L24 34 L18 50 L4 44 L16 14 Z" fill="#E25175" />
      <path d="M42 10 L50 30 L58 10" stroke="#fff" strokeWidth="2" />
      <path d="M22 108 H78" stroke="#FAC961" strokeWidth="5" />
      <g fill="#FFD3E4">{[[38, 60], [62, 60], [50, 78], [34, 92], [66, 92]].map(([x, y]) => <circle key={x + '' + y} cx={x} cy={y} r="3" />)}</g>
    </svg>
  )
}

function Countdown() {
  const [s, setS] = useState(9 * 3600 + 42 * 60 + 10)
  useEffect(() => { const t = setInterval(() => setS((v) => v - 1), 1000); return () => clearInterval(t) }, [])
  const p = (n) => String(n).padStart(2, '0')
  return <span className="mono">{p(Math.floor(s / 3600))}:{p(Math.floor(s / 60) % 60)}:{p(s % 60)}</span>
}

function Offer({ go, hint, pay, setPay }) {
  const opts = [
    { id: 'cod', icon: 'cash', title: 'Cash on delivery', sub: 'Pay the rider when it arrives' },
    { id: 'upi', icon: 'upi', title: 'Pay now with UPI', sub: 'Nothing to pay at the door' },
  ]
  return (
    <div className="screen-body" style={{ paddingTop: 10, gap: 9 }}>
      <motion.div {...rise(0)} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ width: 86, height: 100, borderRadius: 14, background: 'var(--pink-100)', display: 'grid', placeItems: 'center', flex: 'none' }}><Kurti size={62} /></div>
        <div style={{ minWidth: 0 }}>
          <div className="display" style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.3 }}>{PARCEL.item} · {PARCEL.size}</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
            <span className="display" style={{ fontSize: 24, fontWeight: 800 }}>₹{PARCEL.rescuePrice}</span>
            <span style={{ textDecoration: 'line-through', color: 'var(--ink-3)', fontSize: 13 }}>₹{PARCEL.price}</span>
          </div>
          <div style={{ color: '#0B6355', fontSize: 12, fontWeight: 700 }}>16% off · same item from your cart</div>
        </div>
      </motion.div>
      <motion.div {...rise(0.08)} style={{ display: 'flex', gap: 10, alignItems: 'center', background: 'var(--saffron-100)', borderRadius: 14, padding: '6px 10px' }}>
        <img src={scooterImg} alt="" style={{ height: 40 }} />
        <div style={{ fontSize: 12, lineHeight: 1.35 }}><b>Delivered today by 6:30 pm</b><br />Ships from a store 1.4 km away</div>
      </motion.div>
      <div style={{ fontSize: 11.5, color: 'var(--magenta-600)', fontWeight: 700, display: 'flex', gap: 6, alignItems: 'center' }}><Icon name="clock" size={13} /> Offer ends in <Countdown /></div>
      <div className="eyebrow" style={{ marginTop: 2 }}>Tap to order</div>
      <div style={{ flex: 1 }} />
      <Hint on={hint} radius={16} style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {opts.map((o, i) => (
          <motion.button key={o.id} {...rise(0.12 + i * 0.06)} className={`btn ${i === 0 ? 'btn-primary' : 'btn-line'}`} whileTap={{ scale: 0.96 }}
            onClick={() => { setPay(o.id); go('reserved') }} style={{ width: '100%', height: 56, justifyContent: 'flex-start', padding: '0 14px', gap: 12 }}>
            <Icon name={o.icon} size={20} />
            <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.2 }}>
              <span style={{ fontSize: 14.5 }}>{o.id === 'cod' ? `Cash on delivery · ₹${PARCEL.rescuePrice}` : `Pay now with UPI · ₹${PARCEL.rescuePrice}`}</span>
              <span style={{ fontSize: 11.5, fontWeight: 500, opacity: 0.8 }}>{o.sub}</span>
            </span>
          </motion.button>
        ))}
      </Hint>
    </div>
  )
}

function Tracking({ pay, stage }) {
  const cod = pay !== 'upi'
  const steps = [
    { t: 'Order confirmed', s: '16:48' },
    { t: 'Out for delivery', s: stage >= 2 ? '17:55 · 1.4 km away' : 'Rider picks it up from a nearby store' },
    { t: 'Delivered', s: 'By 6:30 pm today' },
  ]
  return (
    <div className="screen-body">
      <motion.div {...rise(0)} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ width: 64, height: 74, borderRadius: 12, background: 'var(--pink-100)', display: 'grid', placeItems: 'center', flex: 'none' }}><Kurti size={44} /></div>
        <div>
          <div className="display" style={{ fontWeight: 800, fontSize: 18, lineHeight: 1.2 }}>{stage >= 2 ? 'On its way!' : 'Order confirmed'}</div>
          <div style={{ fontSize: 12.5, color: 'var(--ink-2)', marginTop: 2 }}>{PARCEL.item} · {PARCEL.size}</div>
        </div>
      </motion.div>
      <motion.div {...rise(0.08)} style={{ background: stage >= 2 ? 'var(--pink-50)' : 'var(--cream-200)', borderRadius: 16, height: 92, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: 14, right: 14, bottom: 22, height: 4, background: '#fff', borderRadius: 2 }} />
        <span style={{ position: 'absolute', right: 10, bottom: 16, color: 'var(--plum-800)' }}><Icon name="pin" size={24} /></span>
        <motion.img src={scooterImg} alt="" style={{ position: 'absolute', bottom: 18, height: 50 }}
          initial={{ left: 6 }} animate={{ left: stage >= 2 ? 190 : 6 }} transition={{ duration: stage >= 2 ? DRIVE : 0, ease: [0.45, 0, 0.35, 1] }} />
        <div style={{ position: 'absolute', left: 12, top: 10, fontSize: 11.5, fontWeight: 700, color: 'var(--ink-2)' }}>{stage >= 2 ? 'Arriving in 12 min' : 'Rider assigned'}</div>
      </motion.div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0, padding: '2px 4px' }}>
        {steps.map((st, i) => {
          const done = i < stage, cur = i === stage - 1
          return (
            <div key={st.t} style={{ display: 'flex', gap: 10 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <motion.span animate={{ background: done ? 'var(--teal)' : '#E2D3DC', scale: cur ? [1, 1.2, 1] : 1 }} transition={{ scale: { duration: 1.4, repeat: cur ? Infinity : 0 } }}
                  style={{ width: 16, height: 16, borderRadius: '50%', display: 'grid', placeItems: 'center', color: '#fff' }}>{done && <Icon name="check" size={10} stroke={4} />}</motion.span>
                {i < steps.length - 1 && <span style={{ width: 2, height: 26, background: i < stage - 1 ? 'var(--teal)' : '#E2D3DC' }} />}
              </div>
              <div style={{ marginTop: -1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: done ? 'var(--ink)' : 'var(--ink-3)' }}>{st.t}</div>
                <div style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>{st.s}</div>
              </div>
            </div>
          )
        })}
      </div>
      <div style={{ flex: 1 }} />
      <motion.div {...rise(0.15)} style={{ background: cod ? 'var(--saffron-100)' : 'var(--teal-100)', borderRadius: 14, padding: '10px 12px', display: 'flex', gap: 10, alignItems: 'center', fontSize: 12.5, fontWeight: 600 }}>
        <Icon name={cod ? 'cash' : 'check'} size={18} />
        {cod ? `Keep ₹${PARCEL.rescuePrice} ready. Pay the rider at the door.` : `Paid ₹${PARCEL.rescuePrice} with UPI. Nothing to pay at the door.`}
      </motion.div>
    </div>
  )
}

function Collected({ pay }) {
  const bits = Array.from({ length: 18 }, (_, i) => i)
  const colors = ['#F7A21B', '#D5367E', '#C6C44A', '#E25175', '#0F7B6C']
  return (
    <div className="screen-body" style={{ alignItems: 'center', textAlign: 'center', position: 'relative' }}>
      {bits.map((i) => (
        <motion.span key={i} style={{ position: 'absolute', zIndex: 5, top: 70, left: '50%', width: 8, height: 12, borderRadius: 2, background: colors[i % 5] }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
          animate={{ x: Math.cos(i * 0.7) * (70 + (i % 4) * 22), y: [0, -60 - (i % 3) * 20, 220], opacity: [1, 1, 0], rotate: i * 40 }}
          transition={{ duration: 1.8, ease: 'easeOut', delay: 0.2 }} />
      ))}
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 380, damping: 14 }}
        style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--teal)', color: '#fff', display: 'grid', placeItems: 'center', marginTop: 20 }}>
        <Icon name="check" size={38} stroke={3} />
      </motion.div>
      <div className="display" style={{ fontWeight: 800, fontSize: 21 }}>Delivered!</div>
      <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.45 }}>Your kurti arrived at 18:20.<br />{pay === 'upi' ? `₹${PARCEL.rescuePrice} paid with UPI.` : `₹${PARCEL.rescuePrice} paid in cash to the rider.`}</div>
      <motion.div {...rise(0.3)} style={{ background: 'var(--pink-100)', borderRadius: 18, padding: 10, display: 'grid', placeItems: 'center', width: '100%' }}><Kurti size={70} /></motion.div>
      <div style={{ flex: 1 }} />
      <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>Rate your Rescue deal ★★★★★</div>
    </div>
  )
}
