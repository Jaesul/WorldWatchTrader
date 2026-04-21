CREATE TABLE "listing_comment_likes" (
	"user_id" text NOT NULL,
	"comment_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "listing_comment_likes_user_id_comment_id_pk" PRIMARY KEY("user_id","comment_id")
);
--> statement-breakpoint
ALTER TABLE "listing_comment_likes" ADD CONSTRAINT "listing_comment_likes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_comment_likes" ADD CONSTRAINT "listing_comment_likes_comment_id_listing_comments_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."listing_comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "listing_comment_likes_comment_id_idx" ON "listing_comment_likes" USING btree ("comment_id");
