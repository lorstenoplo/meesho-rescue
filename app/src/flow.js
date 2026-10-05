// Seconds a rider drive takes; the map and the rider phone share it.
export const DRIVE = 3.4

// The demo is a state machine. Each phase says who acts, what the audience
// should notice, and what the presenter taps next.
export const PHASES = {
  enroute: {
    wait: 'Watch Ravi ride to the customer’s address…',
    screen: 'rider', scene: 'Ravi is riding to the customer’s address',
    n: 1, actor: 'rider', clock: 'Day 1 · 14:05', status: ['Out for delivery', 'neutral'],
    title: 'A COD parcel is out for delivery',
    body: 'Tier B cotton kurti, ₹499 cash on delivery. The seller has joined Rescue.',
    cue: 'Tap “I’ve arrived” on Ravi’s phone',
  },
  door: {
    screen: 'rider', scene: 'At the door, the customer refuses the parcel',
    n: 2, actor: 'rider', clock: 'Day 1 · 14:11', status: ['At the door', 'neutral'],
    title: 'The buyer refuses it at the door',
    body: 'Today this parcel would go all the way back to the seller, and Valmo pays for both trips.',
    cue: 'Tap “Customer refused at door” on Ravi’s phone',
  },
  stage1: {
    wait: 'The engine checks the parcel by itself…',
    screen: 'ops', scene: 'Behind the scenes, the Rescue engine checks the parcel',
    n: 3, actor: 'ops', clock: 'Day 1 · 14:12', status: ['Eligibility check', 'warn'],
    title: 'Stage 1: is this parcel eligible?',
    body: 'Two gates: the seller opted in, and the category isn’t Tier C. Clothing is Tier B, so the base weight is 0.8.',
    cue: 'Nothing to tap. The engine runs by itself',
  },
  scoring: {
    screen: 'ops', scene: 'It looks for nearby buyers who already want this kurti',
    n: 4, actor: 'ops', clock: 'Day 1 · 14:12', status: ['Buyers scored', 'warn'],
    title: 'Stage 2: score every buyer nearby',
    body: 'Score = base weight × strongest signal × exact/similar match. Signals are never added up. Tap any buyer to see the maths.',
    cue: 'Tap “Send rider to Rescue Point” in the console',
  },
  rescue: {
    screen: 'rider', scene: 'Instead of sending it back to the seller, Ravi takes it to a nearby kirana',
    n: 5, actor: 'rider', clock: 'Day 1 · 14:13', status: ['Rescue eligible', 'warn'],
    title: 'The rider is told: don’t send it back to the seller',
    body: 'Instead of starting a return, the app sends the rider to the nearest Kirana Club store on their route.',
    cue: 'Tap “Navigate to Rescue Point” on Ravi’s phone',
  },
  toKirana: {
    wait: 'Watch Ravi ride to the Kirana Club store…',
    screen: 'rider', scene: 'Ravi drops the parcel at a Kirana Club store nearby',
    n: 6, actor: 'rider', clock: 'Day 1 · 14:24', status: ['To Rescue Point', 'warn'],
    title: 'The parcel goes to a Kirana Club store, not back to the seller',
    body: 'The nearest Kirana Club store on the rider’s route becomes the Rescue Point and holds the parcel.',
    cue: 'Tap “Scan & hand over” when Ravi reaches the kirana',
  },
  wave1: {
    wait: 'Watch the offers go out…',
    screen: 'buyer', scene: 'Three likely buyers get an offer on their phones',
    n: 7, actor: 'ops', clock: 'Day 1 · 14:30', status: ['Wave 1 live · 12 h', 'live'],
    title: 'Wave 1: the top 3 buyers get the offer',
    body: 'The kirana holds the parcel. Wave 1 lasts 12 h. Each buyer gets at most one Rescue push a day; the original buyer’s area is excluded.',
    cue: 'Tap the notification on Kavya’s phone',
  },
  offer: {
    screen: 'buyer', scene: 'Kavya sees the kurti she left in her cart',
    n: 8, actor: 'buyer', clock: 'Day 1 · 14:33', status: ['Wave 1 live · 12 h', 'live'],
    title: 'Kavya (buyer C3) opens the offer',
    body: 'They had this exact kurti in their cart 5 hours ago. They can pay cash on delivery, like any Meesho order, or pay now with UPI.',
    cue: 'Tap a payment option on Kavya’s phone to order',
  },
  reserved: {
    wait: 'Watch the rider pick up the parcel from the kirana…',
    screen: 'rider', scene: 'The next rider picks the parcel up from the kirana',
    n: 9, actor: 'rider', clock: 'Day 1 · 16:48', status: ['Sold to C3', 'live'],
    title: 'Confirmed. A rider picks it up from the kirana',
    body: 'The other buyers are told it’s gone. The next rider passing the kirana collects the parcel for delivery.',
    cue: 'Nothing to tap. Watch the pickup',
  },
  delivering: {
    wait: 'Watch Ravi ride to Kavya’s home…',
    screen: 'rider', scene: 'Out for delivery, only 1.4 km away',
    n: 10, actor: 'rider', clock: 'Day 1 · 17:55', status: ['Out for delivery', 'live'],
    title: 'Out for delivery to buyer C3',
    body: 'A short local trip, about 1.4 km, instead of a long return journey to the seller.',
    cue: 'Tap “Delivered” when the rider reaches Kavya',
  },
  collected: {
    screen: 'buyer', scene: 'Delivered. No return trip needed',
    n: 11, actor: 'all', clock: 'Day 1 · 18:20', status: ['Rescued', 'good'],
    title: 'Delivered. Parcel rescued',
    body: 'The sale is saved, the seller is paid and there’s no return trip. The rider and the kirana are both paid.',
    cue: 'Demo complete. The parcel was rescued.',
  },
  wave2: {
    screen: 'ops', scene: 'No takers yet, so the offer goes wider',
    n: 8, actor: 'ops', clock: 'Day 2 · 02:30', status: ['Wave 2 live · 12 h', 'live'],
    title: 'Nobody bought it in Wave 1, so Wave 2 starts',
    body: 'The radius gets wider and the next 5 buyers get the offer. The parcel stays at the kirana.',
    cue: 'Tap “Nobody buys again” in the ops console',
  },
  rto: {
    screen: 'ops', scene: 'Still no buyer, so it goes back as a normal return',
    n: 9, actor: 'ops', clock: 'Day 2 · 14:30', status: ['Standard RTO', 'bad'],
    title: 'No buyer, so it goes back as a normal return',
    body: 'A delivery partner collects it from the kirana. The only extra cost is the holding time.',
    cue: 'Demo complete. This is what happens when nobody buys.',
  },
}

export const HAPPY = ['enroute', 'door', 'stage1', 'scoring', 'rescue', 'toKirana', 'wave1', 'offer', 'reserved', 'delivering', 'collected']
