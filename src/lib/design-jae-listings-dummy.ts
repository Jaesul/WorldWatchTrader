/** Dummy marketplace data for `/design/jae/listings/*` only. */

export const FEATURED_LISTING_ID = 'rolex-dj41-mint';

export const OMEGA_SPEEDMASTER_LISTING_ID = 'omega-speedy-3861';

/** Chrono24 — Omega Speedmaster Professional Moonwatch (design sandbox). */
export const OMEGA_LISTING_IMAGE_HERO =
  'https://img.chrono24.com/images/uhren/44331936-daj5wbrbigjfl4w9swycg3yj-Square420.jpg';

export const OMEGA_LISTING_IMAGE_GALLERY = [
  'https://img.chrono24.com/images/uhren/44331936-ujouhs8awsw7938i24kudlkx-Square420.jpg',
  'https://img.chrono24.com/images/uhren/44331936-fna3vegvnr33e1wedknedlfw-Square420.jpg',
  'https://img.chrono24.com/images/uhren/44331936-ke9j5hrgeavd6s7vparruriz-Square420.jpg',
] as const;

export const TUDOR_BLACK_BAY_LISTING_ID = 'tudor-bb58-blue';

/** Chrono24 — Tudor Black Bay 58 blue (design sandbox). */
export const TUDOR_LISTING_IMAGE_HERO =
  'https://img.chrono24.com/images/uhren/44609886-s72xu1iq9r3cjuuwb8yy6dwz-Square420.jpg';

export const TUDOR_LISTING_IMAGE_GALLERY = [
  'https://img.chrono24.com/images/uhren/44609886-duy63xg2cwnkd0pzcc3up1ny-Square420.jpg',
  'https://img.chrono24.com/images/uhren/44609886-dh2zr9nnetgsh12i0qdzvgnc-Square420.jpg',
] as const;

export const LISTING_IMAGE_HERO =
  'https://img.chrono24.com/images/uhren/35109275-64d1iggwo82g9kez5tqwpcn5-ExtraLarge.jpg';

export const LISTING_IMAGE_GALLERY = [
  'https://img.chrono24.com/images/uhren/35109275-8xzhwbvmdtiy7356zgwo943u-ExtraLarge.jpg',
  'https://img.chrono24.com/images/uhren/35109275-7pjh4629mr6qtw8imog88x0y-ExtraLarge.jpg',
  'https://img.chrono24.com/images/uhren/35109275-4squ9iuthotnjeoivyiw8gdf-ExtraLarge.jpg',
] as const;

export type DummyComment = {
  id: string;
  initials: string;
  displayName: string;
  walletShort: string;
  body: string;
  timeLabel: string;
};

/** US-style listing location: City, State, Country (e.g. country code `US`). */
export type DummyListingLocation = {
  city: string;
  state: string;
  country: string;
};

export function formatUsListingLocation(loc: DummyListingLocation): string {
  return `${loc.city}, ${loc.state}, ${loc.country}`;
}

/** Two-letter initials for `AvatarFallback` from a display name. */
export function sellerDisplayInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0]!.charAt(0) + parts[1]!.charAt(0)).toUpperCase();
  }
  if (parts.length === 1) {
    const w = parts[0]!;
    return w.slice(0, 2).toUpperCase();
  }
  return '??';
}

export function listingCardPreviewImages(listing: DummyListingCard): string[] {
  const hero = listing.thumbUrl ? [listing.thumbUrl] : [];

  switch (listing.id) {
    case FEATURED_LISTING_ID:
      return [...hero, ...LISTING_IMAGE_GALLERY.slice(0, 2)];
    case OMEGA_SPEEDMASTER_LISTING_ID:
      return [...hero, ...OMEGA_LISTING_IMAGE_GALLERY.slice(0, 2)];
    case TUDOR_BLACK_BAY_LISTING_ID:
      return [...hero, ...TUDOR_LISTING_IMAGE_GALLERY.slice(0, 2)];
    default:
      return hero;
  }
}

export type DummyListingCard = {
  id: string;
  title: string;
  teaser: string;
  /** Shown next to avatar on the card (browse). */
  sellerDisplayName: string;
  /** Optional profile image URL; falls back to initials. */
  sellerAvatarUrl?: string | null;
  /** Short label inside shadcn `Badge` (e.g. @handle). */
  sellerBadge: string;
  /** Text fallback for surfaces that do not render badge chips. */
  sellerHint: string;
  sellerSalesBadge: string;
  sellerStatusBadge: string;
  postedAtLabel: string;
  price: string | null;
  thumbUrl: string | null;
  location: DummyListingLocation;
  likeCount: number;
  commentCount: number;
  /** World ID — listing posted by an orb-verified seller. */
  orbVerified?: boolean;
};

export type DummyListingDetail = {
  id: string;
  title: string;
  teaser: string;
  price: string;
  heroUrl: string;
  galleryUrls: readonly string[];
  details: string;
  condition: string;
  modelNumber: string;
  caseSize: string;
  location: DummyListingLocation;
  seller: {
    handle: string;
    displayName: string;
    hint: string;
  };
  comments: DummyComment[];
  orbVerified?: boolean;
};

export const DUMMY_LISTING_CARDS: DummyListingCard[] = [
  {
    id: FEATURED_LISTING_ID,
    title: 'Rolex Datejust 41 — mint dial, Jubilee, smooth bezel',
    teaser:
      'Highly sought-after mint green sunray dial. Full set, 2024. Oystersteel, calibre 3235.',
    sellerDisplayName: 'Marcus Chen',
    sellerBadge: '@watchvault',
    sellerHint: '127 sales · High volume seller',
    sellerSalesBadge: '127 sales',
    sellerStatusBadge: 'High volume seller',
    postedAtLabel: '18m',
    price: '$10,500',
    thumbUrl: LISTING_IMAGE_HERO,
    location: { city: 'Los Angeles', state: 'CA', country: 'US' },
    likeCount: 22,
    commentCount: 8,
    orbVerified: true,
  },
  {
    id: OMEGA_SPEEDMASTER_LISTING_ID,
    title: 'Omega Speedmaster Moonwatch Professional',
    teaser: '3861 movement, sapphire sandwich. Light desk wear on bracelet.',
    sellerDisplayName: 'Nicolas Rivera',
    sellerBadge: '@horology_nico',
    sellerHint: '12 sales · Established seller',
    sellerSalesBadge: '12 sales',
    sellerStatusBadge: 'Established seller',
    postedAtLabel: '41m',
    price: '$6,200',
    thumbUrl: OMEGA_LISTING_IMAGE_HERO,
    location: { city: 'New York', state: 'NY', country: 'US' },
    likeCount: 15,
    commentCount: 5,
    orbVerified: false,
  },
  {
    id: TUDOR_BLACK_BAY_LISTING_ID,
    title: 'Tudor Black Bay 58 Blue',
    teaser: 'Steel bracelet, in-house MT5402. Full set — box, papers, chronometer card.',
    sellerDisplayName: 'Jordan Walsh',
    sellerBadge: '@bayarea_watches',
    sellerHint: '3 sales · Quick replies',
    sellerSalesBadge: '3 sales',
    sellerStatusBadge: 'Quick replies',
    postedAtLabel: '1h',
    price: null,
    thumbUrl: TUDOR_LISTING_IMAGE_HERO,
    location: { city: 'Austin', state: 'TX', country: 'US' },
    likeCount: 9,
    commentCount: 3,
    orbVerified: true,
  },
];

export const DUMMY_LISTING_DETAIL: DummyListingDetail = {
  id: FEATURED_LISTING_ID,
  title: 'Rolex Datejust 41 — mint dial, Jubilee, smooth bezel',
  teaser:
    'Stunning Datejust 41 with the mint green sunray dial on Jubilee. Smooth bezel for a clean, modern line.',
  price: '$10,500',
  heroUrl: LISTING_IMAGE_HERO,
  galleryUrls: LISTING_IMAGE_GALLERY,
  condition: 'Unworn / new-old stock (2024)',
  modelNumber: '126300',
  caseSize: '41mm',
  location: { city: 'Los Angeles', state: 'CA', country: 'US' },
  orbVerified: true,
  details:
    'Up for sale is a Rolex Datejust 41 (126300) in Oystersteel with the popular mint green sunray dial, smooth polished bezel, and Jubilee bracelet. Complete with inner/outer box, warranty card, booklets, and hang tags. Plastic still on the case sides as delivered. Trades considered for comparable modern Rolex or Cartier — use Messages for private offers.',
  seller: {
    handle: 'watchvault',
    displayName: 'Marcus Chen',
    hint: '127 sales · High volume seller',
  },
  comments: [
    {
      id: 'c1',
      initials: 'MK',
      displayName: 'Marco K.',
      walletShort: '0x71c3…3a2f',
      body: 'Does this include the full set with warranty card dated 2024?',
      timeLabel: '2h ago',
    },
    {
      id: 'c2',
      initials: 'AL',
      displayName: 'Alex L.',
      walletShort: '0x9ce1…e1bd',
      body: 'Open to a straight trade for a DJ 36 fluted on oyster?',
      timeLabel: '1d ago',
    },
    {
      id: 'c3',
      initials: 'SJ',
      displayName: 'Sam J.',
      walletShort: '0x402b…88f1',
      body: 'Beautiful dial — is the crystal clean under the cyclops in person?',
      timeLabel: '3d ago',
    },
  ],
};

export const DUMMY_OMEGA_LISTING_DETAIL: DummyListingDetail = {
  id: OMEGA_SPEEDMASTER_LISTING_ID,
  title: 'Omega Speedmaster Moonwatch Professional',
  teaser:
    'Co-Axial Master Chronometer calibre 3861, sapphire crystal front and case back — the classic Moonwatch look with modern movement.',
  price: '$6,200',
  heroUrl: OMEGA_LISTING_IMAGE_HERO,
  galleryUrls: OMEGA_LISTING_IMAGE_GALLERY,
  condition: 'Excellent — light bracelet desk wear',
  modelNumber: '310.30.42.50.01.002',
  caseSize: '42mm',
  location: { city: 'New York', state: 'NY', country: 'US' },
  orbVerified: false,
  details:
    'Omega Speedmaster Professional Moonwatch with sapphire sandwich (sapphire on dial and display back). Stainless steel case and bracelet, black dial with applied indices, hesalite-style look with sapphire durability. Selling with inner/outer box and warranty card. Timing well within spec; chronograph resets crisply. Happy to answer questions publicly below or message for shipping / meetup in NYC.',
  seller: {
    handle: 'horology_nico',
    displayName: 'Nicolas Rivera',
    hint: '12 sales · Established seller',
  },
  comments: [
    {
      id: 'o1',
      initials: 'RP',
      displayName: 'Ryan P.',
      walletShort: '0x8a2f…c901',
      body: 'Is this the full bracelet + all links?',
      timeLabel: '5h ago',
    },
    {
      id: 'o2',
      initials: 'TM',
      displayName: 'Tessa M.',
      walletShort: '0x3d11…7ffe',
      body: 'Any service history or still under Omega warranty?',
      timeLabel: '1d ago',
    },
  ],
};

export const DUMMY_TUDOR_LISTING_DETAIL: DummyListingDetail = {
  id: TUDOR_BLACK_BAY_LISTING_ID,
  title: 'Tudor Black Bay 58 Blue',
  teaser:
    '39mm blue dial and bezel, snowflake hands, COSC-certified manufacture calibre — classic BB58 on bracelet.',
  price: 'Ask',
  heroUrl: TUDOR_LISTING_IMAGE_HERO,
  galleryUrls: TUDOR_LISTING_IMAGE_GALLERY,
  condition: 'Very good — hairlines on bracelet; crystal clean',
  modelNumber: '79030',
  caseSize: '39mm',
  location: { city: 'Austin', state: 'TX', country: 'US' },
  orbVerified: true,
  details:
    'Tudor Black Bay Fifty-Eight (79030) in blue on the rivet-style steel bracelet. Includes inner/outer box, international guarantee card, manuals, and chronometer paperwork as shown. Keeps excellent time; bezel action is tight. Prefer local handoff in Austin but can ship insured CONUS. Message for more photos or to discuss price.',
  seller: {
    handle: 'bayarea_watches',
    displayName: 'Jordan Walsh',
    hint: 'Private seller · quick replies',
  },
  comments: [
    {
      id: 't1',
      initials: 'JC',
      displayName: 'Jordan C.',
      walletShort: '0xe441…2a09',
      body: 'Does the sale include all bracelet links?',
      timeLabel: '3h ago',
    },
    {
      id: 't2',
      initials: 'LN',
      displayName: 'Lee N.',
      walletShort: '0x1bb0…903c',
      body: 'Warranty card stamped / dated?',
      timeLabel: '2d ago',
    },
  ],
};

export function getDummyListingDetail(id: string): DummyListingDetail | null {
  if (id === FEATURED_LISTING_ID || id === 'example-id') {
    return DUMMY_LISTING_DETAIL;
  }
  if (id === OMEGA_SPEEDMASTER_LISTING_ID) {
    return DUMMY_OMEGA_LISTING_DETAIL;
  }
  if (id === TUDOR_BLACK_BAY_LISTING_ID) {
    return DUMMY_TUDOR_LISTING_DETAIL;
  }
  return null;
}
