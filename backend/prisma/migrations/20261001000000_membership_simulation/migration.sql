ALTER TABLE "memberships" ADD COLUMN "source" VARCHAR(24) NOT NULL DEFAULT 'legacy';
ALTER TABLE "memberships" ADD COLUMN "source_order_id" VARCHAR(64);

CREATE TABLE "membership_orders" (
  "id" VARCHAR(64) NOT NULL,
  "user_id" VARCHAR(128) NOT NULL,
  "request_id" VARCHAR(80) NOT NULL,
  "product_id" VARCHAR(32) NOT NULL,
  "product_name" VARCHAR(80) NOT NULL,
  "amount" INTEGER NOT NULL,
  "currency" CHAR(3) NOT NULL,
  "channel" VARCHAR(24) NOT NULL,
  "status" VARCHAR(24) NOT NULL,
  "paid_at" TIMESTAMPTZ(3),
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "membership_orders_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "membership_orders_amount_check" CHECK ("amount" >= 0),
  CONSTRAINT "membership_orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "membership_orders_user_request_key" ON "membership_orders"("user_id", "request_id");
CREATE INDEX "membership_orders_user_created_idx" ON "membership_orders"("user_id", "created_at");
CREATE UNIQUE INDEX "membership_orders_pending_user_key" ON "membership_orders"("user_id") WHERE "status" = 'pending';
