CREATE TABLE "dm_transaction_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"thread_id" uuid NOT NULL,
	"listing_id" uuid NOT NULL,
	"sender_id" text NOT NULL,
	"recipient_id" text NOT NULL,
	"price_usd" integer NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"decline_reason" text,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "dm_messages" ADD COLUMN "tx_request_id" uuid;--> statement-breakpoint
ALTER TABLE "dm_transaction_requests" ADD CONSTRAINT "dm_transaction_requests_thread_id_dm_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."dm_threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dm_transaction_requests" ADD CONSTRAINT "dm_transaction_requests_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dm_transaction_requests" ADD CONSTRAINT "dm_transaction_requests_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dm_transaction_requests" ADD CONSTRAINT "dm_transaction_requests_recipient_id_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "dm_transaction_requests_recipient_status_idx" ON "dm_transaction_requests" USING btree ("recipient_id","status","created_at");--> statement-breakpoint
CREATE INDEX "dm_transaction_requests_thread_created_idx" ON "dm_transaction_requests" USING btree ("thread_id","created_at");--> statement-breakpoint
CREATE INDEX "dm_transaction_requests_sender_idx" ON "dm_transaction_requests" USING btree ("sender_id");--> statement-breakpoint
CREATE INDEX "dm_transaction_requests_listing_idx" ON "dm_transaction_requests" USING btree ("listing_id");--> statement-breakpoint
ALTER TABLE "dm_messages" ADD CONSTRAINT "dm_messages_tx_request_id_dm_transaction_requests_id_fk" FOREIGN KEY ("tx_request_id") REFERENCES "public"."dm_transaction_requests"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "dm_messages_tx_request_id_idx" ON "dm_messages" USING btree ("tx_request_id");