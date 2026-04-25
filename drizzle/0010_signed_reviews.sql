CREATE TABLE "dm_review_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"thread_id" uuid NOT NULL,
	"listing_deal_id" uuid NOT NULL,
	"seller_id" text NOT NULL,
	"buyer_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"completed_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dm_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"review_request_id" uuid NOT NULL,
	"listing_deal_id" uuid NOT NULL,
	"seller_id" text NOT NULL,
	"buyer_id" text NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	"signed_message" text NOT NULL,
	"signature" text NOT NULL,
	"signer_address" text NOT NULL,
	"signed_nonce" text NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "dm_messages" ADD COLUMN "review_request_id" uuid;--> statement-breakpoint
ALTER TABLE "dm_review_requests" ADD CONSTRAINT "dm_review_requests_thread_id_dm_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."dm_threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dm_review_requests" ADD CONSTRAINT "dm_review_requests_listing_deal_id_listing_deals_id_fk" FOREIGN KEY ("listing_deal_id") REFERENCES "public"."listing_deals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dm_review_requests" ADD CONSTRAINT "dm_review_requests_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dm_review_requests" ADD CONSTRAINT "dm_review_requests_buyer_id_users_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dm_reviews" ADD CONSTRAINT "dm_reviews_review_request_id_dm_review_requests_id_fk" FOREIGN KEY ("review_request_id") REFERENCES "public"."dm_review_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dm_reviews" ADD CONSTRAINT "dm_reviews_listing_deal_id_listing_deals_id_fk" FOREIGN KEY ("listing_deal_id") REFERENCES "public"."listing_deals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dm_reviews" ADD CONSTRAINT "dm_reviews_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dm_reviews" ADD CONSTRAINT "dm_reviews_buyer_id_users_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "dm_review_requests_listing_deal_uidx" ON "dm_review_requests" USING btree ("listing_deal_id");--> statement-breakpoint
CREATE INDEX "dm_review_requests_thread_created_idx" ON "dm_review_requests" USING btree ("thread_id","created_at");--> statement-breakpoint
CREATE INDEX "dm_review_requests_buyer_status_idx" ON "dm_review_requests" USING btree ("buyer_id","status");--> statement-breakpoint
CREATE INDEX "dm_review_requests_seller_idx" ON "dm_review_requests" USING btree ("seller_id");--> statement-breakpoint
CREATE UNIQUE INDEX "dm_reviews_review_request_uidx" ON "dm_reviews" USING btree ("review_request_id");--> statement-breakpoint
CREATE UNIQUE INDEX "dm_reviews_listing_deal_uidx" ON "dm_reviews" USING btree ("listing_deal_id");--> statement-breakpoint
CREATE INDEX "dm_reviews_seller_id_idx" ON "dm_reviews" USING btree ("seller_id");--> statement-breakpoint
CREATE INDEX "dm_reviews_buyer_id_idx" ON "dm_reviews" USING btree ("buyer_id");--> statement-breakpoint
ALTER TABLE "dm_messages" ADD CONSTRAINT "dm_messages_review_request_id_dm_review_requests_id_fk" FOREIGN KEY ("review_request_id") REFERENCES "public"."dm_review_requests"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "dm_messages_review_request_id_idx" ON "dm_messages" USING btree ("review_request_id");
