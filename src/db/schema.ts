import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';

/** Extend this as you link NextAuth wallet users to persisted rows. */
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  walletAddress: text('wallet_address').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});
