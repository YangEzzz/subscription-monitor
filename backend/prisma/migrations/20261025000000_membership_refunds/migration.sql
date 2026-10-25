CREATE TABLE "membership_refunds" (
 "order_id" VARCHAR(64) PRIMARY KEY REFERENCES "membership_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
 "refund_id" VARCHAR(32) NOT NULL UNIQUE,
 "amount" INTEGER NOT NULL CHECK ("amount" > 0),
 "status" VARCHAR(24) NOT NULL CHECK ("status" IN ('submitting','processing','unknown','succeeded','failed')),
 "reason" VARCHAR(200) NOT NULL,
 "reason_code" VARCHAR(1) NOT NULL,
 "operator" VARCHAR(80) NOT NULL,
 "error_code" VARCHAR(64),
 "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updated_at" TIMESTAMPTZ(3) NOT NULL,
 "completed_at" TIMESTAMPTZ(3)
);
CREATE INDEX "membership_refunds_status_order_idx" ON "membership_refunds"("status","order_id");
