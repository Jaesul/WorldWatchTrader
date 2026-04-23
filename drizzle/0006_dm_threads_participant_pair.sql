DROP INDEX IF EXISTS "dm_threads_buyer_seller_listing_uidx";--> statement-breakpoint
ALTER TABLE "dm_threads" ALTER COLUMN "listing_id" DROP NOT NULL;--> statement-breakpoint
UPDATE "dm_threads" SET
  "buyer_id" = LEAST("buyer_id", "seller_id"),
  "seller_id" = GREATEST("buyer_id", "seller_id");--> statement-breakpoint
WITH "ranked" AS (
  SELECT
    "id",
    FIRST_VALUE("id") OVER (
      PARTITION BY "buyer_id", "seller_id"
      ORDER BY "last_message_at" DESC, "id" DESC
    ) AS "keeper_id"
  FROM "dm_threads"
),
"moved" AS (
  SELECT "id", "keeper_id" FROM "ranked" WHERE "id" <> "keeper_id"
)
UPDATE "dm_messages" AS "m"
SET "thread_id" = "mv"."keeper_id"
FROM "moved" AS "mv"
WHERE "m"."thread_id" = "mv"."id";--> statement-breakpoint
WITH "ranked" AS (
  SELECT
    "id",
    FIRST_VALUE("id") OVER (
      PARTITION BY "buyer_id", "seller_id"
      ORDER BY "last_message_at" DESC, "id" DESC
    ) AS "keeper_id"
  FROM "dm_threads"
)
DELETE FROM "dm_threads" AS "d"
USING "ranked" AS "r"
WHERE "d"."id" = "r"."id" AND "r"."id" <> "r"."keeper_id";--> statement-breakpoint
CREATE UNIQUE INDEX "dm_threads_participants_uidx" ON "dm_threads" USING btree ("buyer_id","seller_id");
