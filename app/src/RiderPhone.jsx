// Ravi's phone (Valmo rider app). Each phase maps to one screen; buttons advance the story.
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Icon, Hint, Ill, screen, rise } from './ui.jsx'
import { PARCEL } from './engine.js'
import { DRIVE } from './flow.js'
import refuseImg from './assets/refuse.png'
import riderPhoneImg from './assets/rider_phone.png'
import kiranaImg from './assets/kirana_club.png'
import scooterImg from './assets/scooter.png'
import rtoImg from './assets/rto.png'
import buyerImg from './assets/buyer_phone.png'

const REASONS = [
  { id: 'refused', label: 'Customer refused at door' },
  { id: 'unreachable', label: 'Customer not reachable' },
  { id: 'address', label: 'Address not found' },
]

export default function RiderPhone({ phase, go, hint, pay }) {
  const view =
    phase === 'enroute' ? 'enroute'
      : phase === 'door' ? 'door'
        : phase === 'stage1' ? 'checking'
          : phase === 'scoring' ? 'checking'
          : phase === 'rescue' ? 'eligible'
            : phase === 'toKirana' ? 'driving'
              : phase === 'rto' ? 'rto'
                : phase === 'reserved' ? 'pickup'
                  : phase === 'delivering' ? 'deliver'
                    : phase === 'collected' ? 'delivered'
                : 'handed'
  return (
    <div className="phone">
      <div className="phone-notch" />
      <div className="phone-screen">
        <div className="app-head" style={{ background: 'var(--plum-800)' }}>
          <span className="display" style={{ fontWeight: 700, fontSize: 16 }}>Valmo Rider</span>
          <span className="mono" style={{ fontSize: 10.5, opacity: 0.7 }}>Stop 3 of 18</span>
        </div>
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <AnimatePresence>
            <motion.div key={view} {...screen} className="screen-body" style={{ position: 'absolute', inset: 0 }}>
              {view === 'enroute' && <EnRoute go={go} hint={hint} />}
              {view === 'door' && <Door go={go} hint={hint} />}
              {view === 'checking' && <Checking />}
              {view === 'eligible' && <Eligible go={go} hint={hint} />}
              {view === 'driving' && <Driving go={go} hint={hint} />}
              {view === 'handed' && <Handed />}
              {view === 'rto' && <Rto />}
              {view === 'pickup' && <Pickup go={go} hint={hint} pay={pay} />}
              {view === 'deliver' && <Deliver go={go} hint={hint} pay={pay} />}
              {view === 'delivered' && <Delivered pay={pay} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

function ParcelCard() {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="mono" style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>{PARCEL.id}</span>
        <span className="chip warn">COD ₹{PARCEL.price}</span>
      </div>
      <div className="display" style={{ fontWeight: 600, fontSize: 15 }}>{PARCEL.item} · {PARCEL.size}</div>
      <div style={{ fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.4 }}>Near Ganesh temple, 4th cross, Ramanathapuram</div>
    </div>
  )
}

function EnRoute({ go, hint }) {
  const [there, setThere] = useState(false)
  useEffect(() => { const t = setTimeout(() => setThere(true), DRIVE * 1000); return () => clearTimeout(t) }, [])
  return (
    <>
      <div className="eyebrow">Next stop</div>
      <ParcelCard />
      <motion.div {...rise(0.15)} style={{ background: 'var(--cream-200)', borderRadius: 18, height: 150, position: 'relative', overflow: 'hidden' }}>
        <svg width="100%" height="100%" viewBox="0 0 260 150" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0 }}>
          <path d="M-10 120 C 60 120, 90 60, 150 70 S 230 40, 270 30" stroke="#fff" strokeWidth="14" fill="none" />
          <motion.path d="M-10 120 C 60 120, 90 60, 150 70 S 230 40, 270 30" stroke="var(--magenta)" strokeWidth="4" fill="none" strokeDasharray="1 0"
            initial={{ pathLength: 0 }} animate={{ pathLength: 0.82 }} transition={{ duration: DRIVE, ease: 'easeInOut' }} />
        </svg>
        <motion.div style={{ position: 'absolute', top: 18, right: 22 }} animate={{ y: [0, -5, 0] }} transition={{ duration: 1.4, repeat: Infinity }}>
          <Icon name="pin" size={30} style={{ color: 'var(--plum-800)' }} />
        </motion.div>
        <motion.img src={scooterImg} alt="" style={{ position: 'absolute', height: 54, bottom: 8 }}
          initial={{ left: -10 }} animate={{ left: 150 }} transition={{ duration: DRIVE, ease: 'easeInOut' }} />
      </motion.div>
      <div style={{ fontSize: 12.5, color: there ? '#0B6355' : 'var(--ink-2)', fontWeight: there ? 700 : 400, display: 'flex', gap: 6, alignItems: 'center' }}><Icon name={there ? 'check' : 'clock'} size={14} /> {there ? 'You’ve reached the address' : 'Arriving · 400 m'}</div>
      <div style={{ flex: 1 }} />
      <Hint on={hint && there}>
        <motion.button className="btn btn-dark" style={{ width: '100%', height: 52 }} disabled={!there} whileTap={{ scale: 0.96 }} onClick={() => go('door')}>I’ve arrived</motion.button>
      </Hint>
    </>
  )
}

function Door({ go, hint }) {
  const [msg, setMsg] = useState('')
  return (
    <>
      <motion.div {...rise(0)} style={{ background: 'var(--pink-50)', borderRadius: 18, display: 'flex', justifyContent: 'center', padding: '10px 0 0' }}>
        <Ill src={refuseImg} h={112} />
      </motion.div>
      <div className="eyebrow" style={{ marginTop: 2 }}>What happened at {PARCEL.id}?</div>
      {REASONS.map((r, i) => (
        <motion.div key={r.id} {...rise(0.1 + i * 0.06)}>
          {r.id === 'refused' ? (
            <Hint on={hint} radius={16}>
              <button className="option" onClick={() => go('stage1')}>
                <Icon name="x" size={16} style={{ color: 'var(--magenta)' }} />{r.label}
              </button>
            </Hint>
          ) : (
            <button className="option" onClick={() => setMsg('This demo follows the refusal path. Rescue only kicks in after a refusal.')}>
              <Icon name="user" size={16} />{r.label}
            </button>
          )}
        </motion.div>
      ))}
      <AnimatePresence>
        {msg && <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ fontSize: 12, color: 'var(--ink-2)', background: 'var(--saffron-100)', padding: '8px 10px', borderRadius: 10 }}>{msg}</motion.div>}
      </AnimatePresence>
    </>
  )
}

function Checking() {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, textAlign: 'center' }}>
      <Ill src={riderPhoneImg} h={130} float />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{ width: 18, height: 18, borderRadius: '50%', border: '2.5px solid var(--magenta)', borderTopColor: 'transparent' }} />
        <span className="display" style={{ fontWeight: 600 }}>Checking Rescue…</span>
      </div>
      <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5, padding: '0 10px' }}>Keep the parcel with you. Don’t send it back to the seller yet.</div>
    </div>
  )
}

function Eligible({ go, hint }) {
  return (
    <>
      <motion.div {...rise(0)} style={{ background: 'var(--teal-100)', borderRadius: 18, padding: 14, display: 'flex', gap: 10 }}>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 14, delay: 0.15 }}
          style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--teal)', color: '#fff', display: 'grid', placeItems: 'center', flex: 'none' }}>
          <Icon name="check" size={18} stroke={3} />
        </motion.div>
        <div>
          <div className="display" style={{ fontWeight: 700, color: '#0B6355' }}>Rescue eligible</div>
          <div style={{ fontSize: 12.5, lineHeight: 1.45, marginTop: 2 }}>Don’t send it back to the seller. Drop it at the Rescue Point on your route instead.</div>
        </div>
      </motion.div>
      <motion.div {...rise(0.12)} className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        <img src={kiranaImg} alt="Kirana Club" style={{ height: 84, borderRadius: 20 }} />
        <div className="display" style={{ fontWeight: 700, fontSize: 15 }}>Kirana Club store</div>
        <div style={{ fontSize: 12, color: 'var(--ink-2)' }}>Kirana Club partner · 1.2 km · on your route</div>
      </motion.div>
      <div style={{ flex: 1 }} />
      <div style={{ fontSize: 11.5, color: 'var(--ink-3)', textAlign: 'center' }}>Rescue drop is paid as a completed task</div>
      <Hint on={hint}>
        <motion.button className="btn btn-primary" style={{ width: '100%', height: 52 }} whileTap={{ scale: 0.96 }} onClick={() => go('toKirana')}>
          <Icon name="nav" size={16} /> Navigate to Rescue Point
        </motion.button>
      </Hint>
    </>
  )
}

function Driving({ go, hint }) {
  const [there, setThere] = useState(false)
  useEffect(() => { const t = setTimeout(() => setThere(true), DRIVE * 1000); return () => clearTimeout(t) }, [])
  return (
    <>
      <div className="eyebrow">{there ? 'Arrived · Rescue Point' : 'Heading to Rescue Point'}</div>
      <div style={{ background: 'var(--cream-200)', borderRadius: 18, height: 190, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 22, height: 6, background: '#fff', borderRadius: 3 }} />
        <img src={kiranaImg} alt="Kirana Club" style={{ position: 'absolute', right: 14, bottom: 30, height: 96, borderRadius: 18 }} />
        <motion.img src={scooterImg} alt="" style={{ position: 'absolute', bottom: 18, height: 70 }}
          initial={{ left: -90 }} animate={{ left: 70, y: there ? 0 : [0, -2, 0] }}
          transition={{ left: { duration: DRIVE, ease: [0.4, 0, 0.2, 1] }, y: { duration: 0.3, repeat: there ? 0 : Infinity } }} />
      </div>
      <div style={{ height: 6, background: 'var(--line)', borderRadius: 3, overflow: 'hidden' }}>
        <motion.div style={{ height: '100%', background: 'var(--magenta)' }} initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: DRIVE, ease: [0.4, 0, 0.2, 1] }} />
      </div>
      <div style={{ fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.45 }}>The shopkeeper scans the parcel in. It stays here while nearby buyers get the offer.</div>
      <div style={{ flex: 1 }} />
      <Hint on={hint && there}>
        <motion.button className="btn btn-primary" style={{ width: '100%', height: 52 }} disabled={!there} whileTap={{ scale: 0.96 }} onClick={() => go('wave1')}>
          <Icon name="scan" size={16} /> Scan & hand over
        </motion.button>
      </Hint>
    </>
  )
}

function Handed() {
  return (
    <>
      <div className="eyebrow">Handed over · Kirana Club store</div>
      <motion.div {...rise(0)} className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, position: 'relative' }}>
        <img src={kiranaImg} alt="Kirana Club" style={{ height: 96, borderRadius: 20 }} />
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 380, damping: 14, delay: 0.25 }}
          style={{ position: 'absolute', top: 10, right: 12, width: 34, height: 34, borderRadius: '50%', background: 'var(--teal)', color: '#fff', display: 'grid', placeItems: 'center' }}>
          <Icon name="check" size={20} stroke={3} />
        </motion.div>
        <div className="display" style={{ fontWeight: 700, color: '#0B6355' }}>Scanned in at the kirana</div>
        <div style={{ fontSize: 12.5, color: 'var(--ink-2)', textAlign: 'center', lineHeight: 1.45 }}>Held for up to 24 h while nearby buyers get the offer.</div>
      </motion.div>
      <motion.div {...rise(0.15)} style={{ background: 'var(--saffron-100)', borderRadius: 14, padding: '10px 12px', display: 'flex', gap: 10, alignItems: 'center', fontSize: 13 }}>
        <Icon name="bolt" size={16} style={{ color: '#8A5300' }} /> Task paid: Rescue drop
      </motion.div>
      <div style={{ flex: 1 }} />
      <button className="btn btn-dark" style={{ width: '100%', height: 52 }} disabled>Continue · stop 4 of 18</button>
    </>
  )
}

function Rto() {
  return (
    <>
      <div className="eyebrow">New pickup task</div>
      <motion.div {...rise(0)} className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <Ill src={rtoImg} h={100} />
        <div className="display" style={{ fontWeight: 700 }}>Collect for return</div>
        <div style={{ fontSize: 12.5, color: 'var(--ink-2)', textAlign: 'center', lineHeight: 1.45 }}>{PARCEL.id} from Kirana Club store. It goes back on the normal return route.</div>
      </motion.div>
      <div style={{ flex: 1 }} />
      <button className="btn btn-dark" style={{ width: '100%', height: 52 }} disabled>Accept pickup</button>
    </>
  )
}

function Pickup({ go, hint, pay }) {
  return (
    <>
      <motion.div {...rise(0)} style={{ background: 'var(--pink-50)', borderRadius: 14, padding: '10px 12px', display: 'flex', gap: 10, alignItems: 'center' }}>
        <motion.span animate={{ scale: [1, 1.25, 1] }} transition={{ duration: 1.2, repeat: Infinity }} style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--magenta)' }} />
        <span className="display" style={{ fontWeight: 700, fontSize: 14, color: 'var(--magenta-600)' }}>New task · Rescue delivery</span>
      </motion.div>
      <motion.div {...rise(0.08)} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <img src={kiranaImg} alt="Kirana Club" style={{ height: 44, borderRadius: 10 }} />
          <div style={{ fontSize: 12.5, lineHeight: 1.4 }}><span className="eyebrow">Pick up</span><br /><b>Kirana Club store</b> · on your route</div>
        </div>
        <div style={{ width: 2, height: 14, background: 'var(--line)', marginLeft: 24 }} />
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <img src={buyerImg} alt="" style={{ height: 52 }} />
          <div style={{ fontSize: 12.5, lineHeight: 1.4 }}><span className="eyebrow">Deliver to</span><br /><b>Buyer C3</b> · 1.4 km</div>
        </div>
      </motion.div>
      <motion.div {...rise(0.15)} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
        <span className="mono" style={{ color: 'var(--ink-3)' }}>{PARCEL.id}</span>
        <span className={`chip ${pay === 'upi' ? 'good' : 'warn'}`}>{pay === 'upi' ? 'PREPAID' : `COD ₹${PARCEL.rescuePrice}`}</span>
      </motion.div>
      <div style={{ flex: 1 }} />
      <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink-2)', display: 'flex', alignItems: 'center', gap: 8 }}><Icon name="box" size={15} /> Picking up from the kirana…</div>
      <div style={{ height: 8, background: 'var(--line)', borderRadius: 4, overflow: 'hidden' }}>
        <motion.div style={{ height: '100%', background: 'var(--magenta)' }} initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: 3.6, ease: 'linear' }} />
      </div>
    </>
  )
}

function Deliver({ go, hint, pay }) {
  const [there, setThere] = useState(false)
  useEffect(() => { const t = setTimeout(() => setThere(true), DRIVE * 1000); return () => clearTimeout(t) }, [])
  const cod = pay !== 'upi'
  return (
    <>
      <div className="eyebrow">{there ? 'Arrived · Buyer C3' : 'Delivering to buyer C3'}</div>
      <div style={{ background: 'var(--cream-200)', borderRadius: 18, height: 190, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 22, height: 6, background: '#fff', borderRadius: 3 }} />
        <img src={buyerImg} alt="" style={{ position: 'absolute', right: 10, bottom: 24, height: 118 }} />
        <motion.img src={scooterImg} alt="" style={{ position: 'absolute', bottom: 18, height: 70 }}
          initial={{ left: -90 }} animate={{ left: 60, y: there ? 0 : [0, -2, 0] }}
          transition={{ left: { duration: DRIVE, ease: [0.4, 0, 0.2, 1] }, y: { duration: 0.3, repeat: there ? 0 : Infinity } }} />
      </div>
      <div style={{ height: 6, background: 'var(--line)', borderRadius: 3, overflow: 'hidden' }}>
        <motion.div style={{ height: '100%', background: 'var(--magenta)' }} initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: DRIVE, ease: [0.4, 0, 0.2, 1] }} />
      </div>
      <div style={{ background: cod ? 'var(--saffron-100)' : 'var(--teal-100)', borderRadius: 14, padding: '10px 12px', fontSize: 13, fontWeight: 600, display: 'flex', gap: 8, alignItems: 'center' }}>
        <Icon name={cod ? 'cash' : 'check'} size={16} /> {cod ? `Collect ₹${PARCEL.rescuePrice} cash` : 'Prepaid · nothing to collect'}
      </div>
      <div style={{ flex: 1 }} />
      <Hint on={hint && there}>
        <motion.button className="btn btn-primary" style={{ width: '100%', height: 52 }} disabled={!there} whileTap={{ scale: 0.96 }} onClick={() => go('collected')}>
          <Icon name="check" size={16} /> {cod ? `Cash collected · delivered` : 'Mark delivered'}
        </motion.button>
      </Hint>
    </>
  )
}

function Delivered({ pay }) {
  return (
    <>
      <motion.div {...rise(0)} className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, textAlign: 'center' }}>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 380, damping: 14 }}
          style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--teal)', color: '#fff', display: 'grid', placeItems: 'center' }}>
          <Icon name="check" size={30} stroke={3} />
        </motion.div>
        <div className="display" style={{ fontWeight: 800, fontSize: 18 }}>Delivered</div>
        <div style={{ fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.45 }}>{PARCEL.id} to buyer C3 at 18:20.{pay === 'upi' ? '' : ` ₹${PARCEL.rescuePrice} cash collected.`}</div>
      </motion.div>
      <motion.div {...rise(0.12)} style={{ background: 'var(--saffron-100)', borderRadius: 14, padding: '10px 12px', display: 'flex', gap: 10, alignItems: 'center', fontSize: 13 }}>
        <Icon name="bolt" size={16} style={{ color: '#8A5300' }} /> Paid as a successful delivery
      </motion.div>
      <div style={{ flex: 1 }} />
      <button className="btn btn-dark" style={{ width: '100%', height: 52 }} disabled>Continue run</button>
    </>
  )
}
