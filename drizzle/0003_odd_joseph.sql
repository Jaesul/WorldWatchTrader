CREATE TABLE "listing_deals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid NOT NULL,
	"seller_id" text NOT NULL,
	"buyer_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"chain_id" integer DEFAULT 480 NOT NULL,
	"chain_name" text DEFAULT 'World Chain' NOT NULL,
	"user_op_hash" text,
	"transaction_hash" text,
	"block_number" bigint,
	"from_address" text,
	"to_address" text,
	"token_contract" text,
	"token_symbol" text NOT NULL,
	"amount_raw" text NOT NULL,
	"price_usd" integer NOT NULL,
	"executed_with" text,
	"failure_reason" text,
	"confirmed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "listing_deals" ADD CONSTRAINT "listing_deals_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_deals" ADD CONSTRAINT "listing_deals_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_deals" ADD CONSTRAINT "listing_deals_buyer_id_users_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "listing_deals_listing_id_idx" ON "listing_deals" USING btree ("listing_id");--> statement-breakpoint
CREATE INDEX "listing_deals_buyer_id_idx" ON "listing_deals" USING btree ("buyer_id");--> statement-breakpoint
CREATE INDEX "listing_deals_seller_id_idx" ON "listing_deals" USING btree ("seller_id");--> statement-breakpoint
CREATE INDEX "listing_deals_status_idx" ON "listing_deals" USING btree ("status");--> statement-breakpoint
CREATE INDEX "listing_deals_created_at_idx" ON "listing_deals" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "listing_deals_user_op_hash_uidx" ON "listing_deals" USING btree ("user_op_hash") WHERE "listing_deals"."user_op_hash" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "listing_deals_transaction_hash_uidx" ON "listing_deals" USING btree ("transaction_hash") WHERE "listing_deals"."transaction_hash" IS NOT NULL;
