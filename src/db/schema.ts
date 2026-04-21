import { relations } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  walletAddress: text('wallet_address').notNull().unique(),
  username: text('username').notNull().default(''),
  profilePictureUrl: text('profile_picture_url'),
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
}));

export const listingsRelations = relations(listings, ({ one, many }) => ({
  seller: one(users, { fields: [listings.sellerId], references: [users.id] }),
  photos: many(listingPhotos),
  likes: many(listingLikes),
  saves: many(listingSaves),
  comments: many(listingComments),
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

export type ListingStatus = 'draft' | 'active' | 'sold' | 'archived';
