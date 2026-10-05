import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Html, RoundedBox, QuadraticBezierLine } from '@react-three/drei'
import * as THREE from 'three'
import { DRIVE } from './flow.js'
import logoUrl from './assets/kirana_club.png'

/* A small low-poly town in the deck's palette. Every step is a camera shot of it. */

const C = {
  ground: '#EAD6C3', road: '#5B4659', lane: '#F6EAF0', walk: '#DCC4B3', grass: '#CFD58E',
  plum: '#570A47', magenta: '#D5367E', pink: '#E25175', saffron: '#F7A21B', lime: '#C6C44A',
  skin: '#B97A56', skin2: '#8E5A3C', hair: '#2A1622', card: '#D9A066', white: '#FFF8EC',
}
const WALLS = ['#FFE4B8', '#F9D3DF', '#DDE8C0', '#F6C99B', '#E9D7F0', '#FFD9C7']
const ROOFS = ['#B8246A', '#8A1D68', '#E25175', '#C0631A']

// World layout: main road along x at z = 0. North houses face +z, south houses face -z.
const HOME_A = [-10, -7]
const KIRANA = [14, -7]
const BUYERS = {
  C1: [-28, 7], C2: [2, 7], C3: [34, 7], C4: [-34, -7], C5: [38, -7], C6: [26, -7], C7: [-16, 7], C8: [50, -7],
}
const NORTH = [-46, -34, -22, -10, 26, 38, 50, 62]
const SOUTH = [-40, -28, -16, 2, 20, 34, 46, 58]

const ROUTES = {
  enroute: [[-48, -1.6], [-12.5, -1.6]],
  toKirana: [[-12.5, -1.6], [11.5, -1.6]],
  delivering: [[11.5, -1.6], [21, -1.6], [25, 1.6], [31.6, 1.6]],
  rto: [[16, -1.6], [-60, -1.6]],
}
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
function along(r, t) {
  const d = r.slice(1).map((p, i) => Math.hypot(p[0] - r[i][0], p[1] - r[i][1]))
  let goal = d.reduce((a, b) => a + b, 0) * t
  for (let i = 0; i < d.length; i++) {
    if (goal <= d[i] || i === d.length - 1) {
      const k = d[i] ? Math.min(1, goal / d[i]) : 1
      return { x: r[i][0] + (r[i + 1][0] - r[i][0]) * k, z: r[i][1] + (r[i + 1][1] - r[i][1]) * k, yaw: Math.atan2(-(r[i + 1][1] - r[i][1]), r[i + 1][0] - r[i][0]) }
    }
    goal -= d[i]
  }
  const l = r[r.length - 1]; return { x: l[0], z: l[1], yaw: 0 }
}

// Where the scooter sits in each step (when it isn't driving).
const PARK = {
  enroute: null, door: [-12.5, -1.6], stage1: [-12.5, -1.6], scoring: [-12.5, -1.6], rescue: [-12.5, -1.6],
  toKirana: null, wave1: [11.5, -1.6], offer: [11.5, -1.6], reserved: [11.5, -1.6], delivering: null,
  collected: [31.6, 1.6], wave2: [11.5, -1.6], rto: null,
}

// Camera shots. follow = chase the moving vehicle.
const SHOTS = {
  enroute: { follow: 'scooter' },
  door: { pos: [-6.0, 2.2, -1.5], look: [-10.1, 1.4, -4.35] },
  stage1: { pos: [-6, 17, 14], look: [-10, 0, -5] },
  scoring: { pos: [3, 84, 80], look: [3, 0, 0] },
  rescue: { pos: [-8.6, 2.1, 1.8], look: [-12.6, 1.35, -3.2] },
  toKirana: { follow: 'scooter' },
  wave1: { pos: [3, 58, 58], look: [3, 0, 0] },
  offer: { pos: [31.3, 2.0, 0.3], look: [34, 1.55, 4.6] },
  reserved: { pos: [10.4, 2.6, 1.6], look: [14, 1.3, -4.6] },
  delivering: { follow: 'scooter' },
  collected: { pos: [37.4, 2.2, 1.2], look: [33.8, 1.4, 4.1] },
  wave2: { pos: [8, 64, 62], look: [8, 0, 0] },
  rto: { follow: 'truck' },
}

export default function Town3D({ phase }) {
  return (
    <Canvas shadows dpr={[1, 2]} resize={{ offsetSize: true, scroll: false, debounce: { scroll: 0, resize: 0 } }} camera={{ fov: 40, position: [-55, 4, 8], near: 0.1, far: 300 }} gl={{ antialias: true, alpha: true }}
      style={{ position: 'absolute', inset: 0 }}>
      <fog attach="fog" args={['#FBE4DA', 70, 230]} />
      <hemisphereLight args={['#FFF3E2', '#C9A3B8', 0.95]} />
      <directionalLight position={[-20, 30, 18]} intensity={1.5} color="#FFE7CF" castShadow
        shadow-mapSize={[2048, 2048]} shadow-camera-left={-70} shadow-camera-right={70} shadow-camera-top={30} shadow-camera-bottom={-30} shadow-bias={-0.0004} />
      <World phase={phase} />
    </Canvas>
  )
}

function World({ phase }) {
  const start = useRef(0)
  const clock = useThree((s) => s.clock)
  useEffect(() => { start.current = clock.getElapsedTime() }, [phase, clock])
  const prog = () => ease(Math.min(1, (clock.getElapsedTime() - start.current) / DRIVE))
  const vehicle = useRef(new THREE.Vector3(-48, 0, -1.6))
  const props = { phase, prog, vehicle }
  return (
    <>
      <Ground />
      {NORTH.map((x, i) => x !== KIRANA[0] && <House key={'n' + x} x={x} z={-7} face={0} i={i} open={x === HOME_A[0] && ['door', 'stage1', 'scoring'].includes(phase)} />)}
      {SOUTH.map((x, i) => <House key={'s' + x} x={x} z={7} face={Math.PI} i={i + 3} />)}
      <Kirana phase={phase} />
      <Trees />
      <Scooter {...props} />
      <Cast phase={phase} />
      <Truck {...props} />
      <Effects phase={phase} />
      <CameraRig {...props} />
    </>
  )
}

/* ---------------- scenery ---------------- */

function Ground() {
  const dashes = useMemo(() => Array.from({ length: 60 }, (_, i) => -80 + i * 3), [])
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} receiveShadow><planeGeometry args={[400, 200]} /><meshStandardMaterial color={C.ground} /></mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.01, 0]} receiveShadow><planeGeometry args={[300, 7]} /><meshStandardMaterial color={C.road} /></mesh>
      {[-4.3, 4.3].map((z) => <mesh key={z} rotation-x={-Math.PI / 2} position={[0, 0.02, z]} receiveShadow><planeGeometry args={[300, 1.6]} /><meshStandardMaterial color={C.walk} /></mesh>)}
      {dashes.map((x) => <mesh key={x} rotation-x={-Math.PI / 2} position={[x, 0.03, 0]}><planeGeometry args={[1.4, 0.18]} /><meshBasicMaterial color={C.lane} /></mesh>)}
      {[[-55, 18], [8, -18], [40, 18], [-20, -20]].map(([x, z], i) => (
        <mesh key={i} rotation-x={-Math.PI / 2} position={[x, 0.015, z]} receiveShadow><circleGeometry args={[9, 24]} /><meshStandardMaterial color={C.grass} /></mesh>
      ))}
    </group>
  )
}

function House({ x, z, face, i, open }) {
  const door = useRef()
  useFrame((_, dt) => { if (door.current) door.current.rotation.y = THREE.MathUtils.damp(door.current.rotation.y, open ? -1.9 : 0, 4, dt) })
  const wall = WALLS[i % WALLS.length], roof = ROOFS[i % ROOFS.length]
  return (
    <group position={[x, 0, z]} rotation-y={face}>
      <mesh position={[0, 1.6, 0]} castShadow receiveShadow><boxGeometry args={[4.6, 3.2, 4]} /><meshStandardMaterial color={wall} flatShading /></mesh>
      <mesh position={[0, 4.05, 0]} rotation-y={Math.PI / 4} castShadow><coneGeometry args={[3.6, 1.8, 4]} /><meshStandardMaterial color={roof} flatShading /></mesh>
      <mesh position={[0, 0.9, 1.99]}><boxGeometry args={[0.95, 1.8, 0.04]} /><meshStandardMaterial color="#2A1622" /></mesh>
      <group ref={door} position={[-0.475, 0, 2.04]}>
        <mesh position={[0.475, 0.9, 0]}><boxGeometry args={[0.95, 1.8, 0.08]} /><meshStandardMaterial color={i % 2 ? C.plum : '#8A1D68'} /></mesh>
        <mesh position={[0.78, 0.9, 0.05]}><sphereGeometry args={[0.05, 8, 8]} /><meshStandardMaterial color={C.saffron} /></mesh>
      </group>
      {[-1.5, 1.5].map((wx) => (
        <group key={wx} position={[wx, 1.95, 2.01]}>
          <mesh><boxGeometry args={[0.95, 0.85, 0.06]} /><meshStandardMaterial color="#FFFFFF" /></mesh>
          <mesh position={[0, 0, 0.03]}><boxGeometry args={[0.78, 0.68, 0.04]} /><meshStandardMaterial color="#BFDCE6" emissive="#BFDCE6" emissiveIntensity={0.15} /></mesh>
        </group>
      ))}
      <mesh position={[0, 0.08, 2.4]} receiveShadow><boxGeometry args={[1.5, 0.16, 0.8]} /><meshStandardMaterial color="#E7CDB8" /></mesh>
      <group position={[1.6, 0, 2.6]}>
        <mesh position={[0, 0.22, 0]} castShadow><cylinderGeometry args={[0.22, 0.17, 0.44, 10]} /><meshStandardMaterial color="#C0631A" /></mesh>
        <mesh position={[0, 0.65, 0]} castShadow><icosahedronGeometry args={[0.36, 0]} /><meshStandardMaterial color="#8DAE45" flatShading /></mesh>
      </group>
    </group>
  )
}

function Kirana({ phase }) {
  const [x, z] = KIRANA
  const stripes = Array.from({ length: 8 }, (_, i) => i)
  const goods = useMemo(() => Array.from({ length: 18 }, (_, i) => ({ x: -2.2 + (i % 6) * 0.88, y: 1.0 + Math.floor(i / 6) * 0.7, c: [C.saffron, C.magenta, C.lime, '#6FB3C9', C.pink][i % 5] })), [])
  const hasParcel = ['toKirana', 'wave1', 'offer', 'wave2'].includes(phase)
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 1.8, -1.9]} castShadow receiveShadow><boxGeometry args={[6.4, 3.6, 0.3]} /><meshStandardMaterial color="#FFE9C9" /></mesh>
      {[-3.1, 3.1].map((sx) => <mesh key={sx} position={[sx, 1.8, 0]} castShadow><boxGeometry args={[0.3, 3.6, 4]} /><meshStandardMaterial color="#FFE9C9" /></mesh>)}
      <mesh position={[0, 3.7, 0]} castShadow><boxGeometry args={[6.6, 0.3, 4.2]} /><meshStandardMaterial color="#E7C9A8" /></mesh>
      {goods.map((g, i) => <mesh key={i} position={[g.x, g.y, -1.55]} castShadow><boxGeometry args={[0.6, 0.45, 0.4]} /><meshStandardMaterial color={g.c} flatShading /></mesh>)}
      {[0.75, 1.45, 2.15].map((y) => <mesh key={y} position={[0, y, -1.5]}><boxGeometry args={[5.8, 0.06, 0.6]} /><meshStandardMaterial color="#C99B6E" /></mesh>)}
      <mesh position={[0, 0.55, 1.6]} castShadow receiveShadow><boxGeometry args={[5.6, 1.1, 0.8]} /><meshStandardMaterial color={C.magenta} flatShading /></mesh>
      {hasParcel && <Parcel position={[1.2, 1.3, 1.6]} />}
      {stripes.map((i) => (
        <mesh key={i} position={[-2.8 + i * 0.8, 3.45, 2.6]} rotation-x={0.45} castShadow>
          <boxGeometry args={[0.8, 0.08, 1.6]} /><meshStandardMaterial color={i % 2 ? '#FFFFFF' : C.magenta} />
        </mesh>
      ))}
      <mesh position={[0, 4.35, 1.9]} castShadow><boxGeometry args={[5.4, 1.0, 0.18]} /><meshStandardMaterial color="#C9502E" /></mesh>
      <Sign position={[0, 4.35, 2.0]} w={5.2} h={0.86} />
      <Person position={[0, 0, 0.2]} skin="#BC8259" top="#FFFFFF" bottom="#3C2A3A" hair={C.hair} pose={phase === 'reserved' ? 'give' : 'idle'} mustache />
    </group>
  )
}

// Shop sign drawn to a canvas at the board's exact size, so the name always fits inside it.
function Sign({ position, w, h }) {
  const tex = useMemo(() => {
    const cv = document.createElement('canvas'); cv.width = 1040; cv.height = Math.round(1040 * h / w)
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8
    const draw = (logo) => {
      const g = cv.getContext('2d'), H = cv.height
      g.fillStyle = '#DD613F'; g.fillRect(0, 0, cv.width, H)
      const pad = H * 0.12, ls = H - pad * 2
      if (logo) g.drawImage(logo, pad, pad, ls, ls)
      const left = pad * 2 + ls, maxW = cv.width - left - pad * 1.5
      let size = H * 0.56
      g.font = `800 ${size}px Poppins, sans-serif`
      while (g.measureText('Kirana Club').width > maxW && size > 10) { size -= 2; g.font = `800 ${size}px Poppins, sans-serif` }
      g.fillStyle = '#FFFFFF'; g.textBaseline = 'middle'; g.fillText('Kirana Club', left, H / 2 + size * 0.04)
      t.needsUpdate = true
    }
    const img = new Image(); img.src = logoUrl
    Promise.all([document.fonts?.load('800 60px Poppins').catch(() => {}), new Promise((r) => { img.onload = r; img.onerror = r })]).then(() => draw(img.complete && img.naturalWidth ? img : null))
    draw(null)
    return t
  }, [w, h])
  return <mesh position={position}><planeGeometry args={[w, h]} /><meshBasicMaterial map={tex} toneMapped={false} /></mesh>
}

function Trees() {
  const spots = useMemo(() => {
    const s = []
    for (let x = -50; x < 66; x += 6) { if (x % 12 === 2) s.push([x, -4.6]); if (x % 12 === -4 || x % 12 === 8) s.push([x + 1, 4.6]) }
    return s
  }, [])
  return (
    <>
      {spots.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 0.7, 0]} castShadow><cylinderGeometry args={[0.12, 0.16, 1.4, 6]} /><meshStandardMaterial color="#8A5A3C" /></mesh>
          <mesh position={[0, 1.85, 0]} castShadow><icosahedronGeometry args={[0.9, 0]} /><meshStandardMaterial color={i % 2 ? '#9DBB4E' : C.lime} flatShading /></mesh>
        </group>
      ))}
    </>
  )
}

function Parcel({ position, scale = 1 }) {
  return (
    <group position={position} scale={scale}>
      <mesh castShadow><boxGeometry args={[0.55, 0.42, 0.45]} /><meshStandardMaterial color={C.card} flatShading /></mesh>
      <mesh position={[0, 0.215, 0]}><boxGeometry args={[0.56, 0.02, 0.1]} /><meshStandardMaterial color="#B97F45" /></mesh>
      <mesh position={[0, 0, 0.228]}><boxGeometry args={[0.22, 0.16, 0.01]} /><meshStandardMaterial color={C.magenta} /></mesh>
    </group>
  )
}

/* ---------------- characters ---------------- */

function Limb({ r = 0.085, len = 0.62, color }) {
  return (
    <mesh position={[0, -len / 2, 0]} castShadow>
      <capsuleGeometry args={[r, len - 2 * r, 4, 8]} /><meshStandardMaterial color={color} />
    </mesh>
  )
}

function Person({ position, rotation = 0, skin, top, bottom, hair, pose = 'idle', helmet, bun, mustache }) {
  const root = useRef(), head = useRef(), aL = useRef(), aR = useRef(), lL = useRef(), lR = useRef(), phone = useRef()
  useFrame((s) => {
    const t = s.clock.getElapsedTime()
    let body = 0, hy = 0, hx = 0, al = 0.05, ar = 0.05, alz = 0.08, arz = -0.08, ll = 0, lr = 0
    if (pose === 'idle') { body = Math.sin(t * 2) * 0.01 }
    if (pose === 'refuse') { hy = Math.sin(t * 7) * 0.4; ar = -1.5; arz = -0.25; al = -0.4 }
    if (pose === 'phone') { ar = -1.9; arz = 0.18; hx = 0.12; body = Math.sin(t * 2) * 0.01 }
    if (pose === 'hold') { al = -1.1; ar = -1.1; alz = 0.25; arz = -0.25 }
    if (pose === 'give') { ar = -1.0 + Math.sin(t * 2) * 0.1; al = -0.9 }
    if (pose === 'happy') { body = Math.abs(Math.sin(t * 5)) * 0.14; al = -2.6; ar = -2.6; alz = 0.4; arz = -0.4 }
    root.current.position.y = body
    head.current.rotation.set(hx, hy, 0)
    aL.current.rotation.set(al, 0, alz); aR.current.rotation.set(ar, 0, arz)
    lL.current.rotation.x = ll; lR.current.rotation.x = lr
    if (phone.current) phone.current.material.emissiveIntensity = 0.8 + Math.sin(t * 4) * 0.3
  })
  return (
    <group position={position} rotation-y={rotation}>
      <group ref={root}>
        <group ref={lL} position={[-0.13, 0.86, 0]}><Limb r={0.1} len={0.86} color={bottom} /></group>
        <group ref={lR} position={[0.13, 0.86, 0]}><Limb r={0.1} len={0.86} color={bottom} /></group>
        <mesh position={[0, 1.18, 0]} castShadow><capsuleGeometry args={[0.24, 0.34, 4, 10]} /><meshStandardMaterial color={top} /></mesh>
        <group ref={aL} position={[-0.33, 1.42, 0]}><Limb color={top} /><mesh position={[0, -0.64, 0]}><sphereGeometry args={[0.08, 8, 8]} /><meshStandardMaterial color={skin} /></mesh></group>
        <group ref={aR} position={[0.33, 1.42, 0]}>
          <Limb color={top} /><mesh position={[0, -0.64, 0]}><sphereGeometry args={[0.08, 8, 8]} /><meshStandardMaterial color={skin} /></mesh>
          {pose === 'phone' && <mesh ref={phone} position={[0, -0.66, 0.06]} rotation-x={1.9}><boxGeometry args={[0.13, 0.24, 0.025]} /><meshStandardMaterial color="#222" emissive="#9FD8FF" emissiveIntensity={0.9} /></mesh>}
        </group>
        <group ref={head} position={[0, 1.72, 0]}>
          <mesh castShadow><sphereGeometry args={[0.22, 20, 16]} /><meshStandardMaterial color={skin} roughness={0.7} /></mesh>
          {[-0.075, 0.075].map((ex) => <mesh key={ex} position={[ex, 0.03, 0.2]}><sphereGeometry args={[0.03, 8, 8]} /><meshBasicMaterial color="#1A0D16" /></mesh>)}
          {[-0.12, 0.12].map((ex) => <mesh key={'c' + ex} position={[ex, -0.04, 0.17]}><sphereGeometry args={[0.035, 8, 8]} /><meshBasicMaterial color="#F08FA8" transparent opacity={0.55} /></mesh>)}
          <mesh position={[0, -0.085, 0.205]} rotation-z={pose === 'refuse' ? 0 : Math.PI}><torusGeometry args={[0.04, 0.012, 6, 12, Math.PI]} /><meshBasicMaterial color="#6B1F3A" /></mesh>
          {mustache && <mesh position={[0, -0.06, 0.185]}><boxGeometry args={[0.12, 0.025, 0.02]} /><meshBasicMaterial color="#1A0D16" /></mesh>}
          {helmet ? (
            <>
              <mesh position={[0, 0.05, -0.01]} castShadow><sphereGeometry args={[0.235, 16, 12, 0, Math.PI * 2, 0, Math.PI / 1.8]} /><meshStandardMaterial color={C.magenta} /></mesh>
              <mesh position={[0, 0.06, 0.17]} rotation-x={-0.3}><boxGeometry args={[0.3, 0.04, 0.16]} /><meshStandardMaterial color={C.magenta} /></mesh>
            </>
          ) : (
            <>
              <mesh position={[0, 0.05, -0.03]}><sphereGeometry args={[0.235, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2.2]} /><meshStandardMaterial color={hair} /></mesh>
              {bun && <mesh position={[0, 0.05, -0.22]}><sphereGeometry args={[0.1, 10, 10]} /><meshStandardMaterial color={hair} /></mesh>}
              {bun && <mesh position={[0, -0.2, -0.14]}><capsuleGeometry args={[0.15, 0.3, 4, 10]} /><meshStandardMaterial color={hair} /></mesh>}
            </>
          )}
        </group>
        {pose === 'hold' && <Parcel position={[0, 1.08, 0.5]} />}
      </group>
    </group>
  )
}

const RIDER = { skin: '#C98B63', top: C.magenta, bottom: '#3C2A3A', hair: C.hair }
const WOMAN_A = { skin: '#DBA27C', top: '#F48FB1', bottom: '#6B2B5A', hair: C.hair, bun: true }
const KAVYA = { skin: '#D39570', top: '#2A9D8F', bottom: C.plum, hair: C.hair, bun: true }

// Who stands where in each step.
function Cast({ phase }) {
  const p = phase
  return (
    <>
      {/* refusing customer at home A */}
      {['door', 'stage1', 'scoring'].includes(p) && <StepOut from={-6.2} to={-4.8} x={-10} animate={p === 'door'}><Person position={[0, 0, 0]} {...WOMAN_A} pose={p === 'door' ? 'refuse' : 'idle'} /></StepOut>}
      {/* rider on foot */}
      {p === 'door' && <Person position={[-10, 0, -3.85]} rotation={Math.PI} {...RIDER} helmet pose="hold" />}
      {p === 'rescue' && <Person position={[-12.6, 0, -3.3]} rotation={0.2} {...RIDER} helmet pose="phone" />}
      {p === 'reserved' && <Person position={[14, 0, -4.6]} rotation={Math.PI} {...RIDER} helmet pose="hold" />}
      {p === 'collected' && <Person position={[33.6, 0, 3.6]} rotation={0} {...RIDER} helmet pose="idle" />}
      {/* Kavya, buyer C3 */}
      {p === 'offer' && <Person position={[34, 0, 4.5]} rotation={Math.PI} {...KAVYA} pose="phone" />}
      {p === 'collected' && <Person position={[34, 0, 4.55]} rotation={Math.PI} {...KAVYA} pose="happy" />}
      {['delivering'].includes(p) && <Person position={[34, 0, 4.7]} rotation={Math.PI} {...KAVYA} pose="phone" />}
      {/* speech bubbles */}
      {p === 'door' && <Bubble at={[-10, 2.45, -4.8]} tone="bad" delay={1500}>“I don’t want it anymore.”</Bubble>}
      {p === 'rescue' && <Bubble at={[-12.6, 2.5, -3.3]} tone="good" delay={500}>“Don’t send it back to the seller. Drop it at Kirana Club store.”</Bubble>}
      {p === 'offer' && <Bubble at={[34, 2.5, 4.5]} delay={500}>“My cart kurti, ₹419 and delivered today!”</Bubble>}
      {p === 'reserved' && <Bubble at={[14, 2.5, -4.6]} delay={500}>Picked up for delivery</Bubble>}
      {p === 'collected' && <Bubble at={[34, 2.6, 4.55]} tone="good" delay={300}>Delivered ✓ · ₹419 paid</Bubble>}
    </>
  )
}

// Customer walks out of her front door once the rider has arrived.
function StepOut({ x, from, to, animate, children }) {
  const g = useRef(), t0 = useRef(null)
  useFrame((s) => {
    if (!g.current) return
    if (!animate) { g.current.position.z = to; return }
    if (t0.current === null) t0.current = s.clock.getElapsedTime()
    const k = Math.min(1, Math.max(0, (s.clock.getElapsedTime() - t0.current - 0.2) / 1.1))
    g.current.position.z = from + (to - from) * (1 - Math.pow(1 - k, 3))
  })
  return <group ref={g} position={[x, 0, animate ? from : to]}>{children}</group>
}

function Bubble({ at, children, tone, delay = 0 }) {
  const [on, setOn] = useState(false)
  useEffect(() => { const t = setTimeout(() => setOn(true), delay); return () => clearTimeout(t) }, [delay])
  const bg = tone === 'bad' ? '#FFE3E5' : tone === 'good' ? '#DDF3EE' : '#FFFFFF'
  const fg = tone === 'bad' ? '#B3202E' : tone === 'good' ? '#0B6355' : '#2A0D24'
  return (
    <Html position={at} center zIndexRange={[20, 10]} pointerEvents="none">
      <div style={{ transform: `translateY(-40px) scale(${on ? 1 : 0.5})`, opacity: on ? 1 : 0, transition: 'all .35s cubic-bezier(.2,1.4,.4,1)', background: bg, color: fg, padding: '10px 14px', borderRadius: 16, fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 15, whiteSpace: 'nowrap', boxShadow: '0 12px 28px -12px rgba(62,6,50,.55)', position: 'relative' }}>
        {tone === 'bad' && <span style={{ display: 'inline-grid', placeItems: 'center', width: 22, height: 22, borderRadius: '50%', background: '#E5394A', color: '#fff', marginRight: 8, fontSize: 13 }}>✕</span>}
        {children}
        <span style={{ position: 'absolute', left: '50%', bottom: -6, width: 12, height: 12, background: bg, transform: 'translateX(-50%) rotate(45deg)' }} />
      </div>
    </Html>
  )
}

/* ---------------- vehicles ---------------- */

function useVehicle(route, park, prog, vehicle, ref, wheels, idleYaw = 0) {
  useFrame((_, dt) => {
    const g = ref.current
    if (!g) return
    let x, z, yaw = idleYaw, moving = false
    if (route) { const p = along(route, prog()); x = p.x; z = p.z; yaw = p.yaw; moving = prog() < 1 } else if (park) { x = park[0]; z = park[1] } else return
    g.position.x = x; g.position.z = z
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, yaw, 8, dt)
    g.position.y = moving ? Math.abs(Math.sin(performance.now() / 90)) * 0.03 : 0
    vehicle.current.set(x, 0, z)
    if (moving) wheels.forEach((w) => w.current && (w.current.rotation.z -= dt * 14))
  })
}

function Scooter({ phase, prog, vehicle }) {
  const g = useRef(), w1 = useRef(), w2 = useRef()
  const route = ['enroute', 'toKirana', 'delivering'].includes(phase) ? ROUTES[phase] : null
  const park = PARK[phase]
  useVehicle(route, park, prog, vehicle, g, [w1, w2])
  const seated = route || phase === 'stage1' || phase === 'scoring' || phase === 'wave1' || phase === 'offer' || phase === 'wave2'
  const box = ['enroute', 'door', 'stage1', 'scoring', 'rescue', 'toKirana', 'delivering'].includes(phase)
  if (phase === 'rto') return null
  return (
    <group ref={g} position={[-48, 0, -1.6]}>
      {[[0.68, w1], [-0.62, w2]].map(([wx, r]) => (
        <group key={wx} position={[wx, 0.3, 0]}>
          <mesh ref={r} rotation-x={Math.PI / 2} castShadow><cylinderGeometry args={[0.3, 0.3, 0.18, 16]} /><meshStandardMaterial color="#2B2129" /></mesh>
          <mesh rotation-x={Math.PI / 2}><cylinderGeometry args={[0.13, 0.13, 0.2, 10]} /><meshStandardMaterial color="#B9AEB6" /></mesh>
        </group>
      ))}
      <RoundedBox args={[1.25, 0.18, 0.5]} radius={0.06} position={[0.02, 0.42, 0]} castShadow><meshStandardMaterial color="#3B2A38" /></RoundedBox>
      <RoundedBox args={[0.9, 0.48, 0.56]} radius={0.16} position={[-0.42, 0.62, 0]} castShadow><meshStandardMaterial color={C.magenta} /></RoundedBox>
      <RoundedBox args={[0.82, 0.14, 0.42]} radius={0.06} position={[-0.38, 0.93, 0]} castShadow><meshStandardMaterial color="#2B2129" /></RoundedBox>
      <RoundedBox args={[0.22, 0.95, 0.52]} radius={0.08} position={[0.58, 0.85, 0]} rotation-z={-0.22} castShadow><meshStandardMaterial color={C.magenta} /></RoundedBox>
      <mesh position={[0.74, 1.3, 0]} rotation-x={Math.PI / 2}><cylinderGeometry args={[0.03, 0.03, 0.72, 8]} /><meshStandardMaterial color="#2B2129" /></mesh>
      <mesh position={[0.8, 1.12, 0]}><sphereGeometry args={[0.09, 10, 10]} /><meshStandardMaterial color="#FFF6D6" emissive="#FFE7A0" emissiveIntensity={1} /></mesh>
      {box && <Parcel position={[-0.82, 1.22, 0]} scale={1.15} />}
      {seated && <SeatedRider />}
    </group>
  )
}

function SeatedRider() {
  const { skin, top, bottom } = RIDER
  return (
    <group position={[-0.32, 0.95, 0]}>
      {[-0.13, 0.13].map((z) => (
        <group key={z}>
          <mesh position={[0.25, 0.08, z]} rotation-z={Math.PI / 2 - 0.1} castShadow><capsuleGeometry args={[0.1, 0.42, 4, 8]} /><meshStandardMaterial color={bottom} /></mesh>
          <mesh position={[0.5, -0.24, z]} rotation-z={0.25} castShadow><capsuleGeometry args={[0.09, 0.42, 4, 8]} /><meshStandardMaterial color={bottom} /></mesh>
        </group>
      ))}
      <mesh position={[0.06, 0.42, 0]} rotation-z={-0.22} castShadow><capsuleGeometry args={[0.23, 0.32, 4, 10]} /><meshStandardMaterial color={top} /></mesh>
      {[-0.3, 0.3].map((z) => <mesh key={z} position={[0.42, 0.52, z * 0.9]} rotation-z={-1.1} castShadow><capsuleGeometry args={[0.075, 0.5, 4, 8]} /><meshStandardMaterial color={top} /></mesh>)}
      <group position={[0.2, 0.92, 0]}>
        <mesh castShadow><sphereGeometry args={[0.2, 16, 14]} /><meshStandardMaterial color={skin} /></mesh>
        <mesh position={[0, 0.05, 0]} castShadow><sphereGeometry args={[0.235, 16, 12, 0, Math.PI * 2, 0, Math.PI / 1.8]} /><meshStandardMaterial color={C.magenta} /></mesh>
        <mesh position={[0.19, 0.0, 0]} rotation-z={0.2}><boxGeometry args={[0.06, 0.14, 0.3]} /><meshStandardMaterial color="#3B2A38" transparent opacity={0.8} /></mesh>
      </group>
    </group>
  )
}

function Truck({ phase, prog, vehicle }) {
  const g = useRef(), w1 = useRef(), w2 = useRef()
  const route = phase === 'rto' ? ROUTES.rto : null
  useVehicle(route, null, prog, vehicle, g, [w1, w2], Math.PI)
  if (phase !== 'rto') return null
  return (
    <group ref={g} position={[16, 0, -1.6]}>
      <RoundedBox args={[3.2, 2.0, 1.8]} radius={0.12} position={[-0.6, 1.4, 0]} castShadow><meshStandardMaterial color="#FFFFFF" /></RoundedBox>
      <mesh position={[-0.6, 1.4, 0.91]}><boxGeometry args={[3, 0.35, 0.02]} /><meshStandardMaterial color={C.magenta} /></mesh>
      <RoundedBox args={[1.3, 1.5, 1.7]} radius={0.15} position={[1.7, 1.15, 0]} castShadow><meshStandardMaterial color={C.magenta} /></RoundedBox>
      <mesh position={[2.36, 1.45, 0]}><boxGeometry args={[0.05, 0.6, 1.4]} /><meshStandardMaterial color="#BFDCE6" /></mesh>
      {[[-1.6, w1], [1.4, w2]].map(([wx, r]) => (
        <group key={wx}>{[-0.85, 0.85].map((wz) => <mesh key={wz} ref={wz < 0 ? r : undefined} position={[wx, 0.42, wz]} rotation-x={Math.PI / 2}><cylinderGeometry args={[0.42, 0.42, 0.25, 14]} /><meshStandardMaterial color="#2B2129" /></mesh>)}</group>
      ))}
      <Html position={[-0.6, 3.0, 0]} center pointerEvents="none">
        <div style={{ background: '#FFE3E5', color: '#B3202E', fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 15, padding: '8px 12px', borderRadius: 12, whiteSpace: 'nowrap' }}>Return to seller</div>
      </Html>
    </group>
  )
}

/* ---------------- overlays: pins, radar, offers, confetti ---------------- */

const TAGS = { C1: 'in cart 1 h ago', C2: 'wishlist 10 h ago', C3: 'in cart 5 h ago', C4: 'searched 2 d ago', C5: 'similar in cart', C6: 'popular here', C7: 'repeat buyer', C8: 'category fan' }

function Pin({ id, at, top, label, sent }) {
  const g = useRef()
  useFrame((s) => { if (g.current) g.current.position.y = 6.2 + Math.sin(s.clock.getElapsedTime() * 2 + at[0]) * 0.25 })
  const color = sent ? C.plum : top ? C.magenta : '#B9A5B4'
  return (
    <group position={[at[0], 0, at[1]]}>
      <group ref={g} position={[0, 6.2, 0]}>
        <mesh rotation-x={Math.PI}><coneGeometry args={[0.5, 1.2, 12]} /><meshStandardMaterial color={color} /></mesh>
        <mesh position={[0, 0.75, 0]}><sphereGeometry args={[0.62, 16, 14]} /><meshStandardMaterial color={color} /></mesh>
        <Html position={[0, 2.1, 0]} center zIndexRange={[20, 10]} pointerEvents="none">
          <div style={{ background: '#fff', borderRadius: 10, padding: '4px 9px', fontFamily: 'Poppins, sans-serif', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', color: '#2A0D24', boxShadow: '0 8px 18px -10px rgba(62,6,50,.6)', opacity: top || sent ? 1 : 0.75 }}>
            {id} <span style={{ fontWeight: 600, color: '#5E4658' }}>· {label}</span>
          </div>
        </Html>
      </group>
    </group>
  )
}

function Ring({ at, max = 40, color = C.magenta }) {
  const m = useRef()
  useFrame((s) => {
    const k = (s.clock.getElapsedTime() % 2.4) / 2.4
    m.current.scale.setScalar(1 + k * max); m.current.material.opacity = 0.7 * (1 - k)
  })
  return (
    <mesh ref={m} position={[at[0], 0.06, at[1]]} rotation-x={-Math.PI / 2}>
      <ringGeometry args={[0.9, 1, 48]} /><meshBasicMaterial color={color} transparent />
    </mesh>
  )
}

function Offer({ from, to, i }) {
  const dot = useRef()
  const curve = useMemo(() => new THREE.QuadraticBezierCurve3(new THREE.Vector3(from[0], 4, from[1]), new THREE.Vector3((from[0] + to[0]) / 2, 12, (from[1] + to[1]) / 2), new THREE.Vector3(to[0], 5.6, to[1])), [from, to])
  useFrame((s) => { const k = ((s.clock.getElapsedTime() * 0.6 + i * 0.33) % 1); dot.current.position.copy(curve.getPoint(k)) })
  return (
    <>
      <QuadraticBezierLine start={curve.v0} mid={curve.v1} end={curve.v2} color={C.magenta} lineWidth={3} dashed dashSize={0.8} gapSize={0.6} />
      <mesh ref={dot}><sphereGeometry args={[0.38, 12, 12]} /><meshBasicMaterial color={C.saffron} /></mesh>
    </>
  )
}

function Confetti({ at }) {
  const bits = useMemo(() => Array.from({ length: 50 }, (_, i) => ({ v: new THREE.Vector3((Math.random() - 0.5) * 4, 4 + Math.random() * 3, (Math.random() - 0.5) * 4), c: [C.saffron, C.magenta, C.lime, C.pink, '#0F7B6C'][i % 5], r: Math.random() * 6 })), [])
  const refs = useRef([])
  const t0 = useRef(null)
  useFrame((s) => {
    if (t0.current === null) t0.current = s.clock.getElapsedTime()
    const t = s.clock.getElapsedTime() - t0.current
    refs.current.forEach((m, i) => {
      if (!m) return
      const b = bits[i]
      m.position.set(at[0] + b.v.x * t, 2.2 + b.v.y * t - 4.9 * t * t, at[1] + b.v.z * t)
      m.rotation.set(t * b.r, t * b.r * 0.7, 0)
      m.visible = m.position.y > 0
    })
  })
  return bits.map((b, i) => <mesh key={i} ref={(el) => (refs.current[i] = el)}><boxGeometry args={[0.12, 0.18, 0.02]} /><meshBasicMaterial color={b.c} side={THREE.DoubleSide} /></mesh>)
}

function Effects({ phase }) {
  const ids = Object.keys(BUYERS)
  return (
    <>
      {(phase === 'stage1' || phase === 'scoring') && <Ring at={HOME_A} max={phase === 'scoring' ? 46 : 8} />}
      {phase === 'stage1' && (
        <Html position={[HOME_A[0], 7, HOME_A[1]]} center pointerEvents="none">
          <div style={{ background: '#E5394A', color: '#fff', fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 15, padding: '6px 12px', borderRadius: 10, whiteSpace: 'nowrap' }}>Refused here · checking eligibility…</div>
        </Html>
      )}
      {phase === 'scoring' && ['C1', 'C2', 'C3', 'C6'].map((id) => <Pin key={id} id={id} at={BUYERS[id]} top={['C1', 'C2', 'C3'].includes(id)} label={TAGS[id]} />)}
      {phase === 'wave1' && ['C1', 'C2', 'C3'].map((id, i) => (
        <group key={id}><Offer from={KIRANA} to={BUYERS[id]} i={i} /><Pin id={id} at={BUYERS[id]} sent label="offer sent" /></group>
      ))}
      {phase === 'wave1' && <Ring at={KIRANA} max={24} />}
      {phase === 'wave2' && ['C4', 'C5', 'C6', 'C7', 'C8'].map((id, i) => (
        <group key={id}><Offer from={KIRANA} to={BUYERS[id]} i={i} /><Pin id={id} at={BUYERS[id]} sent label="offer sent" /></group>
      ))}
      {phase === 'wave2' && <Ring at={KIRANA} max={44} />}
      {phase === 'collected' && <Confetti at={[34, 4.4]} />}
    </>
  )
}

/* ---------------- camera ---------------- */

function CameraRig({ phase, vehicle }) {
  const look = useRef(new THREE.Vector3(-45, 1, -1.6))
  const tPos = useMemo(() => new THREE.Vector3(), []), tLook = useMemo(() => new THREE.Vector3(), [])
  useFrame(({ camera }, dt) => {
    const shot = SHOTS[phase]
    if (shot.follow) {
      const v = vehicle.current
      const dir = shot.follow === 'truck' ? -1 : 1
      tPos.set(v.x - 8 * dir, 3.4, v.z + 3.1)
      tLook.set(v.x + 6 * dir, 1.2, v.z - 0.8)
    } else { tPos.set(...shot.pos); tLook.set(...shot.look) }
    const k = shot.follow ? 6 : 2.2
    camera.position.x = THREE.MathUtils.damp(camera.position.x, tPos.x, k, dt)
    camera.position.y = THREE.MathUtils.damp(camera.position.y, tPos.y, k, dt)
    camera.position.z = THREE.MathUtils.damp(camera.position.z, tPos.z, k, dt)
    look.current.x = THREE.MathUtils.damp(look.current.x, tLook.x, k + 1, dt)
    look.current.y = THREE.MathUtils.damp(look.current.y, tLook.y, k + 1, dt)
    look.current.z = THREE.MathUtils.damp(look.current.z, tLook.z, k + 1, dt)
    camera.lookAt(look.current)
  })
  return null
}
