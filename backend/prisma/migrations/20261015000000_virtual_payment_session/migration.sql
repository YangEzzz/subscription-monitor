ALTER TABLE "app_users" ADD COLUMN "wechat_session_key_encrypted" TEXT;
ALTER TABLE "app_users" ADD COLUMN "wechat_session_updated_at" TIMESTAMPTZ(3);
ALTER TABLE "membership_orders" ADD COLUMN "payment_requested_at" TIMESTAMPTZ(3);
ALTER TABLE "membership_orders" ADD COLUMN "delivery_confirmed_at" TIMESTAMPTZ(3);
CREATE INDEX "membership_orders_reconcile_idx" ON "membership_orders"("channel", "status", "id");
