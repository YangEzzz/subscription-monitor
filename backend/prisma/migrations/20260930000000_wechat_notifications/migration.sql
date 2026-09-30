ALTER TABLE "app_users" ADD COLUMN "wechat_app_id" VARCHAR(64), ADD COLUMN "wechat_open_id" VARCHAR(128);
CREATE UNIQUE INDEX "app_users_wechat_identity_key" ON "app_users"("wechat_app_id", "wechat_open_id");

CREATE TABLE "notification_grants" (
  "id" VARCHAR(64) PRIMARY KEY,
  "user_id" VARCHAR(128) NOT NULL REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "request_id" VARCHAR(64) NOT NULL,
  "template_id" VARCHAR(128) NOT NULL,
  "result" VARCHAR(16) NOT NULL,
  "status" VARCHAR(16) NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "notification_grants_request_key" ON "notification_grants"("user_id", "request_id");
CREATE INDEX "notification_grants_available_idx" ON "notification_grants"("user_id", "template_id", "status");

CREATE TABLE "notification_deliveries" (
  "id" VARCHAR(64) PRIMARY KEY,
  "user_id" VARCHAR(128) NOT NULL REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "subscription_id" VARCHAR(64) NOT NULL REFERENCES "subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "subscription_name" VARCHAR(120) NOT NULL,
  "billing_date" DATE NOT NULL,
  "offset" INTEGER NOT NULL,
  "template_id" VARCHAR(128) NOT NULL,
  "grant_id" VARCHAR(64) NOT NULL,
  "status" VARCHAR(16) NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 1,
  "error_code" VARCHAR(64),
  "next_attempt_at" TIMESTAMPTZ(3),
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "notification_deliveries_period_key" ON "notification_deliveries"("user_id", "subscription_id", "billing_date", "offset");
CREATE INDEX "notification_deliveries_user_idx" ON "notification_deliveries"("user_id", "created_at");
CREATE INDEX "notification_deliveries_recovery_idx" ON "notification_deliveries"("status", "updated_at");
