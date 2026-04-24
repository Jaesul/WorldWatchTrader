CREATE TABLE "dm_shipments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"thread_id" uuid NOT NULL,
	"sender_id" text NOT NULL,
	"recipient_id" text NOT NULL,
	"listing_deal_id" uuid,
	"carrier_code" text NOT NULL,
	"carrier_name" text NOT NULL,
	"tracking_number" text,
	"tracking_url" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "dm_messages" ADD COLUMN "shipment_id" uuid;--> statement-breakpoint
ALTER TABLE "dm_shipments" ADD CONSTRAINT "dm_shipments_thread_id_dm_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."dm_threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dm_shipments" ADD CONSTRAINT "dm_shipments_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dm_shipments" ADD CONSTRAINT "dm_shipments_recipient_id_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dm_shipments" ADD CONSTRAINT "dm_shipments_listing_deal_id_listing_deals_id_fk" FOREIGN KEY ("listing_deal_id") REFERENCES "public"."listing_deals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "dm_shipments_thread_created_idx" ON "dm_shipments" USING btree ("thread_id","created_at");--> statement-breakpoint
CREATE INDEX "dm_shipments_listing_deal_idx" ON "dm_shipments" USING btree ("listing_deal_id");--> statement-breakpoint
CREATE INDEX "dm_shipments_sender_idx" ON "dm_shipments" USING btree ("sender_id");--> statement-breakpoint
ALTER TABLE "dm_messages" ADD CONSTRAINT "dm_messages_shipment_id_dm_shipments_id_fk" FOREIGN KEY ("shipment_id") REFERENCES "public"."dm_shipments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "dm_messages_shipment_id_idx" ON "dm_messages" USING btree ("shipment_id");