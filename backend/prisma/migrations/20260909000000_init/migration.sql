-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('active', 'trial', 'pending', 'paused', 'cancelled', 'archived');
CREATE TYPE "BillingCycle" AS ENUM ('weekly', 'monthly', 'quarterly', 'semiannual', 'yearly', 'custom_days', 'one_off');
CREATE TYPE "SubscriptionCategory" AS ENUM ('video', 'music', 'cloud', 'ai', 'productivity', 'reading', 'other');
CREATE TYPE "PaymentMethod" AS ENUM ('wechat', 'alipay', 'app_store', 'card', 'official_site', 'other');
CREATE TYPE "MembershipStatus" AS ENUM ('free', 'active');
CREATE TYPE "MembershipPlan" AS ENUM ('free', 'member');

-- CreateTable
CREATE TABLE "app_users" (
    "id" VARCHAR(128) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "app_users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "subscriptions" (
    "id" VARCHAR(64) NOT NULL,
    "user_id" VARCHAR(128) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "plan" VARCHAR(120),
    "logo" VARCHAR(16),
    "color" VARCHAR(16) NOT NULL DEFAULT '#16834d',
    "amount" DECIMAL(12,2),
    "currency" CHAR(3) NOT NULL DEFAULT 'CNY',
    "cycle" "BillingCycle" NOT NULL,
    "cycle_value" INTEGER,
    "anchor_day" INTEGER NOT NULL,
    "next_billing_date" DATE NOT NULL,
    "payment" "PaymentMethod" NOT NULL DEFAULT 'other',
    "category" "SubscriptionCategory" NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'active',
    "auto_renew" BOOLEAN NOT NULL DEFAULT true,
    "trial_end_date" DATE,
    "note" VARCHAR(1000) NOT NULL DEFAULT '',
    "cancel_guide" VARCHAR(1000) NOT NULL DEFAULT '',
    "is_demo" BOOLEAN NOT NULL DEFAULT false,
    "last_renewed_at" TIMESTAMPTZ(3),
    "last_renewal_next_billing_date" DATE,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),
    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "subscription_reminders" (
    "subscription_id" VARCHAR(64) NOT NULL,
    "offset_days" INTEGER NOT NULL,
    CONSTRAINT "subscription_reminders_pkey" PRIMARY KEY ("subscription_id", "offset_days")
);

CREATE TABLE "renewal_events" (
    "id" VARCHAR(64) NOT NULL,
    "subscription_id" VARCHAR(64) NOT NULL,
    "renewed_at" TIMESTAMPTZ(3) NOT NULL,
    "previous_status" "SubscriptionStatus" NOT NULL,
    "previous_next_billing_date" DATE NOT NULL,
    "next_billing_date" DATE NOT NULL,
    "amount" DECIMAL(12,2),
    "currency" CHAR(3) NOT NULL,
    CONSTRAINT "renewal_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "user_settings" (
    "user_id" VARCHAR(128) NOT NULL,
    "amount_visible" BOOLEAN NOT NULL DEFAULT true,
    "notification_enabled" BOOLEAN NOT NULL DEFAULT false,
    "notification_authorization" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "weekly_summary" BOOLEAN NOT NULL DEFAULT true,
    "default_currency" CHAR(3) NOT NULL DEFAULT 'CNY',
    "default_reminders" INTEGER[] DEFAULT ARRAY[7, 3, 1]::INTEGER[],
    "reminder_time" VARCHAR(5) NOT NULL DEFAULT '09:00',
    "timezone" VARCHAR(64) NOT NULL DEFAULT 'Asia/Shanghai',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("user_id")
);

CREATE TABLE "memberships" (
    "user_id" VARCHAR(128) NOT NULL,
    "status" "MembershipStatus" NOT NULL DEFAULT 'free',
    "plan" "MembershipPlan" NOT NULL DEFAULT 'free',
    "started_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "memberships_pkey" PRIMARY KEY ("user_id")
);

-- CreateIndex
CREATE INDEX "subscriptions_user_deleted_idx" ON "subscriptions"("user_id", "deleted_at");
CREATE INDEX "subscriptions_user_billing_idx" ON "subscriptions"("user_id", "next_billing_date");
CREATE INDEX "subscriptions_user_category_idx" ON "subscriptions"("user_id", "category");
CREATE INDEX "subscriptions_user_status_idx" ON "subscriptions"("user_id", "status");
CREATE INDEX "renewal_events_subscription_time_idx" ON "renewal_events"("subscription_id", "renewed_at");
CREATE UNIQUE INDEX "renewal_events_period_key" ON "renewal_events"("subscription_id", "previous_next_billing_date");

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "subscription_reminders" ADD CONSTRAINT "subscription_reminders_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "renewal_events" ADD CONSTRAINT "renewal_events_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
