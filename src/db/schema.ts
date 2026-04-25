import { relations, sql } from 'drizzle-orm';
import {
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  walletAddress: text('wallet_address').notNull().unique(),
  username: text('username').notNull().default(''),
  profilePictureUrl: text('profile_picture_url'),
  bio: text('bio').notNull().default(''),
  handle: text('handle').unique(),
  orbVerified: boolean('orb_verified').notNull().default(false),
  powerSeller: boolean('power_seller').notNull().default(false),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const listings = pgTable(
  'listings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sellerId: text('seller_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    status: text('status').notNull().default('draft'),
    title: text('title').notNull(),
    teaser: text('teaser').notNull().default(''),
    details: text('details').notNull().default(''),
    priceUsd: integer('price_usd').notNull(),
    condition: text('condition'),
    modelNumber: text('model_number'),
    caseSize: text('case_size'),
    city: text('city'),
    stateRegion: text('state_region'),
    countryCode: text('country_code'),
    orbVerifiedAtListing: timestamp('orb_verified_at_listing', { withTimezone: true }),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('listings_seller_status_published_idx').on(t.sellerId, t.status, t.publishedAt),
    index('listings_status_published_idx').on(t.status, t.publishedAt),
  ],
);

export const listingPhotos = pgTable(
  'listing_photos',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    listingId: uuid('listing_id')
      .notNull()
      .references(() => listings.id, { onDelete: 'cascade' }),
    url: text('url').notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index('listing_photos_listing_sort_idx').on(t.listingId, t.sortOrder)],
);

export const listingLikes = pgTable(
  'listing_likes',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    listingId: uuid('listing_id')
      .notNull()
      .references(() => listings.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.listingId] }),
    index('listing_likes_listing_id_idx').on(t.listingId),
  ],
);

export const listingSaves = pgTable(
  'listing_saves',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    listingId: uuid('listing_id')
      .notNull()
      .references(() => listings.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.listingId] }),
    index('listing_saves_listing_id_idx').on(t.listingId),
  ],
);

export const listingComments = pgTable(
  'listing_comments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    listingId: uuid('listing_id')
      .notNull()
      .references(() => listings.id, { onDelete: 'cascade' }),
    authorId: text('author_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    body: text('body').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => [index('listing_comments_listing_created_idx').on(t.listingId, t.createdAt)],
);

/** Marketplace settlement / on-chain payment record (MiniKit-shaped; mock rows use executed_with = mock). */
export const listingDeals = pgTable(
  'listing_deals',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    listingId: uuid('listing_id')
      .notNull()
      .references(() => listings.id, { onDelete: 'restrict' }),
    sellerId: text('seller_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    buyerId: text('buyer_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    status: text('status').notNull().default('pending'),
    chainId: integer('chain_id').notNull().default(480),
    chainName: text('chain_name').notNull().default('World Chain'),
    userOpHash: text('user_op_hash'),
    transactionHash: text('transaction_hash'),
    blockNumber: bigint('block_number', { mode: 'number' }),
    fromAddress: text('from_address'),
    toAddress: text('to_address'),
    tokenContract: text('token_contract'),
    tokenSymbol: text('token_symbol').notNull(),
    amountRaw: text('amount_raw').notNull(),
    priceUsd: integer('price_usd').notNull(),
    executedWith: text('executed_with'),
    failureReason: text('failure_reason'),
    confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('listing_deals_listing_id_idx').on(t.listingId),
    index('listing_deals_buyer_id_idx').on(t.buyerId),
    index('listing_deals_seller_id_idx').on(t.sellerId),
    index('listing_deals_status_idx').on(t.status),
    index('listing_deals_created_at_idx').on(t.createdAt),
    uniqueIndex('listing_deals_user_op_hash_uidx')
      .on(t.userOpHash)
      .where(sql`${t.userOpHash} IS NOT NULL`),
    uniqueIndex('listing_deals_transaction_hash_uidx')
      .on(t.transactionHash)
      .where(sql`${t.transactionHash} IS NOT NULL`),
  ],
);

/**
 * DM thread between two users. `buyer_id` / `seller_id` store a canonical pair:
 * `buyer_id` is always lexicographically less than `seller_id` (string compare).
 * `listing_id` is optional legacy anchor; topic is carried by message listing cards.
 */
export const dmThreads = pgTable(
  'dm_threads',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    listingId: uuid('listing_id').references(() => listings.id, { onDelete: 'restrict' }),
    buyerId: text('buyer_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    sellerId: text('seller_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    lastMessageAt: timestamp('last_message_at', { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex('dm_threads_participants_uidx').on(t.buyerId, t.sellerId),
    index('dm_threads_buyer_last_msg_idx').on(t.buyerId, t.lastMessageAt),
    index('dm_threads_seller_last_msg_idx').on(t.sellerId, t.lastMessageAt),
  ],
);

/**
 * Seller-initiated transaction request between two users within a DM thread.
 * Status transitions: pending -> accepted | declined. On accept, a matching
 * `listing_deals` row is inserted (mocked values) and the listing is marked sold.
 */
export const dmTransactionRequests = pgTable(
  'dm_transaction_requests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    threadId: uuid('thread_id')
      .notNull()
      .references(() => dmThreads.id, { onDelete: 'cascade' }),
    listingId: uuid('listing_id')
      .notNull()
      .references(() => listings.id, { onDelete: 'restrict' }),
    senderId: text('sender_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    recipientId: text('recipient_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    priceUsd: integer('price_usd').notNull(),
    description: text('description').notNull().default(''),
    status: text('status').notNull().default('pending'),
    declineReason: text('decline_reason'),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('dm_transaction_requests_recipient_status_idx').on(
      t.recipientId,
      t.status,
      t.createdAt,
    ),
    index('dm_transaction_requests_thread_created_idx').on(t.threadId, t.createdAt),
    index('dm_transaction_requests_sender_idx').on(t.senderId),
    index('dm_transaction_requests_listing_idx').on(t.listingId),
  ],
);

/**
 * Shipping update sent by a participant within a DM thread. Informational only
 * (no accept/decline). May optionally be linked to a confirmed `listing_deals`
 * row so the profile History surface can show a "Shipped" indicator.
 */
export const dmShipments = pgTable(
  'dm_shipments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    threadId: uuid('thread_id')
      .notNull()
      .references(() => dmThreads.id, { onDelete: 'cascade' }),
    senderId: text('sender_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    recipientId: text('recipient_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    listingDealId: uuid('listing_deal_id').references(() => listingDeals.id, {
      onDelete: 'set null',
    }),
    carrierCode: text('carrier_code').notNull(),
    carrierName: text('carrier_name').notNull(),
    trackingNumber: text('tracking_number'),
    trackingUrl: text('tracking_url').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('dm_shipments_thread_created_idx').on(t.threadId, t.createdAt),
    index('dm_shipments_listing_deal_idx').on(t.listingDealId),
    index('dm_shipments_sender_idx').on(t.senderId),
  ],
);

/** Seller-initiated request for buyer feedback tied to a confirmed deal. */
export const dmReviewRequests = pgTable(
  'dm_review_requests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    threadId: uuid('thread_id')
      .notNull()
      .references(() => dmThreads.id, { onDelete: 'cascade' }),
    listingDealId: uuid('listing_deal_id')
      .notNull()
      .references(() => listingDeals.id, { onDelete: 'cascade' }),
    sellerId: text('seller_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    buyerId: text('buyer_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    status: text('status').notNull().default('pending'),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex('dm_review_requests_listing_deal_uidx').on(t.listingDealId),
    index('dm_review_requests_thread_created_idx').on(t.threadId, t.createdAt),
    index('dm_review_requests_buyer_status_idx').on(t.buyerId, t.status),
    index('dm_review_requests_seller_idx').on(t.sellerId),
  ],
);

/** Buyer-submitted review for a completed deal, signed in World App. */
export const dmReviews = pgTable(
  'dm_reviews',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    reviewRequestId: uuid('review_request_id')
      .notNull()
      .references(() => dmReviewRequests.id, { onDelete: 'cascade' }),
    listingDealId: uuid('listing_deal_id')
      .notNull()
      .references(() => listingDeals.id, { onDelete: 'cascade' }),
    sellerId: text('seller_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    buyerId: text('buyer_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    rating: integer('rating').notNull(),
    comment: text('comment'),
    signedMessage: text('signed_message').notNull(),
    signature: text('signature').notNull(),
    signerAddress: text('signer_address').notNull(),
    signedNonce: text('signed_nonce').notNull(),
    submittedAt: timestamp('submitted_at', { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex('dm_reviews_review_request_uidx').on(t.reviewRequestId),
    uniqueIndex('dm_reviews_listing_deal_uidx').on(t.listingDealId),
    index('dm_reviews_seller_id_idx').on(t.sellerId),
    index('dm_reviews_buyer_id_idx').on(t.buyerId),
  ],
);

export const dmMessages = pgTable(
  'dm_messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    threadId: uuid('thread_id')
      .notNull()
      .references(() => dmThreads.id, { onDelete: 'cascade' }),
    senderId: text('sender_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    body: text('body').notNull(),
    /** Immutable listing card payload when this message includes a listing attachment. */
    listingSnapshot: jsonb('listing_snapshot').$type<Record<string, unknown> | null>(),
    /** Links the message to a transaction request so clients can render the tx card. */
    txRequestId: uuid('tx_request_id').references(() => dmTransactionRequests.id, {
      onDelete: 'set null',
    }),
    /** Links the message to a shipping update so clients can render the shipment card. */
    shipmentId: uuid('shipment_id').references(() => dmShipments.id, {
      onDelete: 'set null',
    }),
    /** Links the message to a review request so clients can render review cards. */
    reviewRequestId: uuid('review_request_id').references(() => dmReviewRequests.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('dm_messages_thread_created_idx').on(t.threadId, t.createdAt),
    index('dm_messages_tx_request_id_idx').on(t.txRequestId),
    index('dm_messages_shipment_id_idx').on(t.shipmentId),
    index('dm_messages_review_request_id_idx').on(t.reviewRequestId),
  ],
);

export const listingCommentLikes = pgTable(
  'listing_comment_likes',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    commentId: uuid('comment_id')
      .notNull()
      .references(() => listingComments.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.commentId] }),
    index('listing_comment_likes_comment_id_idx').on(t.commentId),
  ],
);

export const usersRelations = relations(users, ({ many }) => ({
  listings: many(listings),
  likes: many(listingLikes),
  saves: many(listingSaves),
  comments: many(listingComments),
  commentLikes: many(listingCommentLikes),
  listingDealsAsBuyer: many(listingDeals, { relationName: 'listingDealBuyer' }),
  listingDealsAsSeller: many(listingDeals, { relationName: 'listingDealSeller' }),
  dmThreadsAsBuyer: many(dmThreads, { relationName: 'dmThreadBuyer' }),
  dmThreadsAsSeller: many(dmThreads, { relationName: 'dmThreadSeller' }),
}));

export const listingsRelations = relations(listings, ({ one, many }) => ({
  seller: one(users, { fields: [listings.sellerId], references: [users.id] }),
  photos: many(listingPhotos),
  likes: many(listingLikes),
  saves: many(listingSaves),
  comments: many(listingComments),
  deals: many(listingDeals),
  dmThreads: many(dmThreads),
}));

export const listingPhotosRelations = relations(listingPhotos, ({ one }) => ({
  listing: one(listings, { fields: [listingPhotos.listingId], references: [listings.id] }),
}));

export const listingLikesRelations = relations(listingLikes, ({ one }) => ({
  user: one(users, { fields: [listingLikes.userId], references: [users.id] }),
  listing: one(listings, { fields: [listingLikes.listingId], references: [listings.id] }),
}));

export const listingSavesRelations = relations(listingSaves, ({ one }) => ({
  user: one(users, { fields: [listingSaves.userId], references: [users.id] }),
  listing: one(listings, { fields: [listingSaves.listingId], references: [listings.id] }),
}));

export const listingCommentsRelations = relations(listingComments, ({ one, many }) => ({
  listing: one(listings, { fields: [listingComments.listingId], references: [listings.id] }),
  author: one(users, { fields: [listingComments.authorId], references: [users.id] }),
  likes: many(listingCommentLikes),
}));

export const listingCommentLikesRelations = relations(listingCommentLikes, ({ one }) => ({
  user: one(users, { fields: [listingCommentLikes.userId], references: [users.id] }),
  comment: one(listingComments, {
    fields: [listingCommentLikes.commentId],
    references: [listingComments.id],
  }),
}));

export const listingDealsRelations = relations(listingDeals, ({ one }) => ({
  listing: one(listings, { fields: [listingDeals.listingId], references: [listings.id] }),
  seller: one(users, {
    fields: [listingDeals.sellerId],
    references: [users.id],
    relationName: 'listingDealSeller',
  }),
  buyer: one(users, {
    fields: [listingDeals.buyerId],
    references: [users.id],
    relationName: 'listingDealBuyer',
  }),
}));

export const dmThreadsRelations = relations(dmThreads, ({ one, many }) => ({
  listing: one(listings, { fields: [dmThreads.listingId], references: [listings.id] }),
  buyer: one(users, {
    fields: [dmThreads.buyerId],
    references: [users.id],
    relationName: 'dmThreadBuyer',
  }),
  seller: one(users, {
    fields: [dmThreads.sellerId],
    references: [users.id],
    relationName: 'dmThreadSeller',
  }),
  messages: many(dmMessages),
}));

export const dmMessagesRelations = relations(dmMessages, ({ one }) => ({
  thread: one(dmThreads, { fields: [dmMessages.threadId], references: [dmThreads.id] }),
  sender: one(users, { fields: [dmMessages.senderId], references: [users.id] }),
  txRequest: one(dmTransactionRequests, {
    fields: [dmMessages.txRequestId],
    references: [dmTransactionRequests.id],
  }),
  shipment: one(dmShipments, {
    fields: [dmMessages.shipmentId],
    references: [dmShipments.id],
  }),
  reviewRequest: one(dmReviewRequests, {
    fields: [dmMessages.reviewRequestId],
    references: [dmReviewRequests.id],
  }),
}));

export const dmTransactionRequestsRelations = relations(dmTransactionRequests, ({ one, many }) => ({
  thread: one(dmThreads, { fields: [dmTransactionRequests.threadId], references: [dmThreads.id] }),
  listing: one(listings, {
    fields: [dmTransactionRequests.listingId],
    references: [listings.id],
  }),
  sender: one(users, {
    fields: [dmTransactionRequests.senderId],
    references: [users.id],
    relationName: 'dmTxRequestSender',
  }),
  recipient: one(users, {
    fields: [dmTransactionRequests.recipientId],
    references: [users.id],
    relationName: 'dmTxRequestRecipient',
  }),
  messages: many(dmMessages),
}));

export const dmShipmentsRelations = relations(dmShipments, ({ one, many }) => ({
  thread: one(dmThreads, { fields: [dmShipments.threadId], references: [dmThreads.id] }),
  sender: one(users, {
    fields: [dmShipments.senderId],
    references: [users.id],
    relationName: 'dmShipmentSender',
  }),
  recipient: one(users, {
    fields: [dmShipments.recipientId],
    references: [users.id],
    relationName: 'dmShipmentRecipient',
  }),
  deal: one(listingDeals, {
    fields: [dmShipments.listingDealId],
    references: [listingDeals.id],
  }),
  messages: many(dmMessages),
}));

export const dmReviewRequestsRelations = relations(dmReviewRequests, ({ one, many }) => ({
  thread: one(dmThreads, { fields: [dmReviewRequests.threadId], references: [dmThreads.id] }),
  deal: one(listingDeals, {
    fields: [dmReviewRequests.listingDealId],
    references: [listingDeals.id],
  }),
  seller: one(users, {
    fields: [dmReviewRequests.sellerId],
    references: [users.id],
    relationName: 'dmReviewRequestSeller',
  }),
  buyer: one(users, {
    fields: [dmReviewRequests.buyerId],
    references: [users.id],
    relationName: 'dmReviewRequestBuyer',
  }),
  review: one(dmReviews, {
    fields: [dmReviewRequests.id],
    references: [dmReviews.reviewRequestId],
  }),
  messages: many(dmMessages),
}));

export const dmReviewsRelations = relations(dmReviews, ({ one }) => ({
  request: one(dmReviewRequests, {
    fields: [dmReviews.reviewRequestId],
    references: [dmReviewRequests.id],
  }),
  deal: one(listingDeals, {
    fields: [dmReviews.listingDealId],
    references: [listingDeals.id],
  }),
  seller: one(users, {
    fields: [dmReviews.sellerId],
    references: [users.id],
    relationName: 'dmReviewSeller',
  }),
  buyer: one(users, {
    fields: [dmReviews.buyerId],
    references: [users.id],
    relationName: 'dmReviewBuyer',
  }),
}));

export type ListingStatus = 'draft' | 'active' | 'pending' | 'sold' | 'archived';

export type ListingDealStatus = 'pending' | 'submitted' | 'confirmed' | 'failed';

export type DmTransactionRequestStatus = 'pending' | 'accepted' | 'declined';

export type DmShipmentCarrierCode = 'ups' | 'fedex' | 'usps' | 'dhl' | 'other';
export type DmReviewRequestStatus = 'pending' | 'completed' | 'expired' | 'cancelled';
