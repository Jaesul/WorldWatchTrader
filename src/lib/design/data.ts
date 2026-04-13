export type Badge = 'world-verified' | 'power-seller';

export interface Seller {
  name: string;
  handle: string;
  badges: Badge[];
}

export interface Listing {
  id: string;
  model: string;
  price: number;
  description: string;
  condition: string;
  boxPapers: string;
  postedAt: string;
  likes: number;
  seller: Seller;
  /** Verified Unsplash CDN URL for the primary photo */
  photo: string;
}

export const LISTINGS: Listing[] = [
  // ── Alex Kim — 3 listings ─────────────────────────────────────────────
  {
    id: '1',
    model: 'Rolex Submariner 126610LN',
    price: 12500,
    description:
      'Full set with box and papers from 2022. Unworn, crystal-clear condition. Green ceramic bezel. Purchased directly from AD.',
    condition: 'Unworn',
    boxPapers: 'Full set',
    postedAt: '2h ago',
    likes: 14,
    seller: { name: 'Alex Kim', handle: 'alexkim', badges: ['world-verified', 'power-seller'] },
    photo: 'https://images.unsplash.com/photo-1611243705491-71487c2ed137?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: '8',
    model: 'Rolex Datejust 41 126334',
    price: 9200,
    description:
      'Wimbledon dial, oyster bracelet. Box and papers from 2023. Light wear on bracelet only, case is pristine.',
    condition: 'Excellent',
    boxPapers: 'Full set',
    postedAt: '1d ago',
    likes: 8,
    seller: { name: 'Alex Kim', handle: 'alexkim', badges: ['world-verified', 'power-seller'] },
    photo: 'https://images.unsplash.com/photo-1526045431048-f857369baa09?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: '9',
    model: 'Rolex GMT-Master II 126710BLRO "Pepsi"',
    price: 18500,
    description:
      'Pepsi bezel on Jubilee. One of the most sought-after Rolexes. Full set, purchased in 2021.',
    condition: 'Like new',
    boxPapers: 'Full set',
    postedAt: '3d ago',
    likes: 27,
    seller: { name: 'Alex Kim', handle: 'alexkim', badges: ['world-verified', 'power-seller'] },
    photo: 'https://images.unsplash.com/photo-1605101232508-283d0cd4909e?auto=format&fit=crop&w=800&q=80',
  },

  // ── Harbor Time — 2 listings ──────────────────────────────────────────
  {
    id: '2',
    model: 'Omega Speedmaster Professional Moonwatch',
    price: 5800,
    description:
      'Iconic moonwatch in excellent condition. Serviced in 2023. Comes with bracelet, no box or papers.',
    condition: 'Excellent',
    boxPapers: 'None',
    postedAt: '5h ago',
    likes: 7,
    seller: { name: 'Harbor Time Co.', handle: 'harbortime', badges: ['world-verified'] },
    photo: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: '10',
    model: 'Omega Seamaster 300M 210.30.42.20.01.001',
    price: 4600,
    description:
      'Bond watch. Ceramic bezel, full set. Never worn outside the house. Beautiful blue dial.',
    condition: 'Unworn',
    boxPapers: 'Full set',
    postedAt: '2d ago',
    likes: 11,
    seller: { name: 'Harbor Time Co.', handle: 'harbortime', badges: ['world-verified'] },
    photo: 'https://images.unsplash.com/photo-1556453007-ee036169934b?auto=format&fit=crop&w=800&q=80',
  },

  // ── Cristian V. — 2 listings ──────────────────────────────────────────
  {
    id: '4',
    model: 'Audemars Piguet Royal Oak 15202ST',
    price: 89000,
    description:
      'Jumbo "A-series" dial — the holy grail of AP. Full set, lightly worn. One of the cleanest on the market.',
    condition: 'Excellent',
    boxPapers: 'Full set',
    postedAt: '2d ago',
    likes: 31,
    seller: { name: 'Cristian V.', handle: 'cristianv', badges: ['world-verified', 'power-seller'] },
    photo: 'https://images.unsplash.com/photo-1617714651073-17a0fcd14f9e?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: '11',
    model: 'Audemars Piguet Royal Oak Offshore 26400SO',
    price: 54000,
    description:
      'Offshore "Lebron" in steel. Large 44mm case, ceramic bezel. Box only. Light wrist time.',
    condition: 'Excellent',
    boxPapers: 'Box only',
    postedAt: '4d ago',
    likes: 19,
    seller: { name: 'Cristian V.', handle: 'cristianv', badges: ['world-verified', 'power-seller'] },
    photo: 'https://images.unsplash.com/photo-1615029530759-79e0ca82371a?auto=format&fit=crop&w=800&q=80',
  },

  // ── Single-listing sellers ─────────────────────────────────────────────
  {
    id: '3',
    model: 'Patek Philippe Nautilus 5711/1A',
    price: 120000,
    description:
      'First generation dial. Only worn a handful of times. Box only. Serious buyers with verified profiles only.',
    condition: 'Like new',
    boxPapers: 'Box only',
    postedAt: '1d ago',
    likes: 42,
    seller: { name: 'Marco R.', handle: 'marcor', badges: ['power-seller'] },
    photo: 'https://images.unsplash.com/photo-1600003014755-ba31aa59c4b6?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: '5',
    model: 'Cartier Santos 40mm WSSA0018',
    price: 6400,
    description:
      'Large steel model with interchangeable bracelet and strap system. Box and warranty card included.',
    condition: 'Excellent',
    boxPapers: 'Box only',
    postedAt: '3d ago',
    likes: 9,
    seller: { name: 'Jules W.', handle: 'julesw', badges: [] },
    photo: 'https://images.unsplash.com/photo-1677445166019-4fa91a090e49?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: '6',
    model: 'Tudor Black Bay 58 Navy Blue',
    price: 3200,
    description:
      'Great everyday diver. Worn daily for 1 year, no scratches on crystal. Bracelet shows light wear.',
    condition: 'Good',
    boxPapers: 'None',
    postedAt: '4d ago',
    likes: 5,
    seller: { name: 'Dmitri L.', handle: 'dmitril', badges: ['world-verified'] },
    photo: 'https://images.unsplash.com/photo-1670404160620-a3a86428560e?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: '7',
    model: 'Grand Seiko SBGA211 Snowflake',
    price: 4800,
    description:
      'Spring Drive movement, iconic snowflake dial. Full set, perfect condition. A true collector piece.',
    condition: 'Unworn',
    boxPapers: 'Full set',
    postedAt: '5d ago',
    likes: 19,
    seller: { name: 'Yuki T.', handle: 'yukit', badges: ['world-verified'] },
    photo: 'https://images.unsplash.com/photo-1674208884812-cdc0b4bc1cf0?auto=format&fit=crop&w=800&q=80',
  },
];

export function formatPrice(n: number) {
  return '$' + n.toLocaleString('en-US');
}

export function getListingById(id: string): Listing | undefined {
  return LISTINGS.find((l) => l.id === id);
}
