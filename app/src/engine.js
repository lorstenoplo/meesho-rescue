// Meesho Rescue scoring — exactly as the spec PDF (two stages).
export const BASE = { A: 1.0, B: 0.8, C: 0.0 }
export const MATCH = { A: { exact: 1.0, similar: 0.8 }, B: { exact: 1.0, similar: 0.4 } }

const cart = (h) => (h < 3 ? 1.0 : h < 24 ? 0.8 : h < 72 ? 0.5 : 0.2)
const wish = (h) => (h < 3 ? 0.9 : h < 24 ? 0.7 : h < 72 ? 0.4 : 0.1)
const search = (d) => (d <= 3 ? 0.6 : d <= 7 ? 0.4 : 0.2)
const REGION = { high_30d: 0.5, repeat_buyer: 0.3, category_only: 0.1 }

export function scoreSignal(s) {
  if (s.type === 'cart') return { ...s, score: cart(s.hours), label: `Cart · ${s.hours} h ago` }
  if (s.type === 'wishlist') return { ...s, score: wish(s.hours), label: `Wishlist · ${s.hours} h ago` }
  if (s.type === 'search') return { ...s, score: search(s.days), label: `Searched · ${s.days} d ago` }
  const names = { high_30d: 'High area demand (30 d)', repeat_buyer: 'Repeat buyer, category', category_only: 'Category demand only' }
  return { ...s, score: REGION[s.kind], label: names[s.kind] }
}

export const PARCEL = {
  id: 'VLM-48213', item: 'Cotton A-line kurti', size: 'M', tier: 'B', sellerOptedIn: true,
  price: 499, rescuePrice: 419,
}

// SIMULATED buyers around the Rescue Point (demo data, not Meesho data). mx/my = % position on the map.
// `intent` is a hand-set placeholder for the Enhanced-mode intent model (XGBoost/LightGBM, see README → Pending).
export const CANDIDATES = [
  { id: 'C1', match: 'exact', intent: 0.45, mx: 25, my: 78, ring: 1, signals: [{ type: 'cart', hours: 1 }], note: 'Idle cart, rarely checks out' },
  { id: 'C2', match: 'exact', intent: 0.9, mx: 67, my: 26, ring: 1, signals: [{ type: 'wishlist', hours: 10 }, { type: 'search', days: 2 }] },
  { id: 'C3', match: 'exact', intent: 0.95, mx: 71, my: 74, ring: 1, signals: [{ type: 'cart', hours: 5 }] },
  { id: 'C4', match: 'similar', intent: 0.8, mx: 13, my: 56, ring: 1, signals: [{ type: 'search', days: 2 }] },
  { id: 'C5', match: 'similar', intent: 0.85, mx: 85, my: 50, ring: 1, signals: [{ type: 'cart', hours: 2 }], note: 'Same kurti, size L' },
  { id: 'C6', match: 'similar', intent: 0.6, mx: 55, my: 12, ring: 1, signals: [{ type: 'region', kind: 'high_30d' }] },
  { id: 'C7', match: 'similar', intent: 0.7, mx: 5, my: 80, ring: 2, signals: [{ type: 'region', kind: 'repeat_buyer' }] },
  { id: 'C8', match: 'similar', intent: 0.5, mx: 93, my: 86, ring: 2, signals: [{ type: 'region', kind: 'category_only' }] },
]
// Original buyer's neighbourhood never sees the offer.
export const EXCLUDED = { id: 'X', mx: 37, my: 34, signals: [{ type: 'cart', hours: 2 }] }

export function rank(mode) {
  const base = PARCEL.sellerOptedIn ? BASE[PARCEL.tier] : 0
  return CANDIDATES.map((c) => {
    const sigs = c.signals.map(scoreSignal)
    const best = sigs.reduce((a, b) => (b.score > a.score ? b : a))
    const mult = MATCH[PARCEL.tier][c.match]
    const spec = base * best.score * mult
    const score = mode === 'enhanced' ? spec * c.intent : spec
    return { ...c, sigs, best, mult, base, spec, score: Math.round(score * 1000) / 1000 }
  })
    .sort((a, b) => b.score - a.score)
    .map((c, i) => ({ ...c, rank: i + 1, wave: i < 3 ? 1 : 2 }))
}

export const fmt = (n) => String(Math.round(n * 1000) / 1000)
