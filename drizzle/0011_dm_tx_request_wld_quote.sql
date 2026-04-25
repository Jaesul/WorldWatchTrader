ALTER TABLE "dm_transaction_requests" ADD COLUMN "pay_reference" text;--> statement-breakpoint
ALTER TABLE "dm_transaction_requests" ADD COLUMN "settlement_token_symbol" text DEFAULT 'WLD';--> statement-breakpoint
ALTER TABLE "dm_transaction_requests" ADD COLUMN "settlement_amount_raw" text;--> statement-breakpoint
ALTER TABLE "dm_transaction_requests" ADD COLUMN "usd_per_wld_rate" text;--> statement-breakpoint
ALTER TABLE "dm_transaction_requests" ADD COLUMN "quote_locked_at" timestamp with time zone;--> statement-breakpoint
CREATE UNIQUE INDEX "dm_transaction_requests_pay_reference_uidx" ON "dm_transaction_requests" ("pay_reference") WHERE "pay_reference" IS NOT NULL;
