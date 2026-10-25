ALTER TABLE app_users ADD COLUMN is_test BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE app_users ADD COLUMN test_note VARCHAR(200);
ALTER TABLE app_users ADD COLUMN test_updated_by VARCHAR(80);
ALTER TABLE app_users ADD COLUMN test_updated_at TIMESTAMPTZ(3);
CREATE TABLE admin_user_label_events (
 id UUID PRIMARY KEY, user_id VARCHAR(128) NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
 previous_is_test BOOLEAN NOT NULL, is_test BOOLEAN NOT NULL, note VARCHAR(200) NOT NULL,
 operator VARCHAR(80) NOT NULL, created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX admin_user_label_events_user_idx ON admin_user_label_events(user_id,created_at);
CREATE TABLE payment_refund_receipts (
 id VARCHAR(160) PRIMARY KEY,
 order_id VARCHAR(64) NOT NULL REFERENCES membership_orders(id) ON DELETE RESTRICT,
 amount INTEGER NOT NULL CHECK(amount > 0),
 confirmed_at TIMESTAMPTZ(3),
 observed_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 source VARCHAR(24) NOT NULL,
 time_source VARCHAR(24) NOT NULL
);
CREATE INDEX payment_refund_receipts_order_idx ON payment_refund_receipts(order_id);
CREATE INDEX payment_refund_receipts_confirmed_idx ON payment_refund_receipts(confirmed_at);
-- Preserve known historical full refunds, without inventing a refund date.
INSERT INTO payment_refund_receipts(id,order_id,amount,confirmed_at,source,time_source)
SELECT 'legacy:'||o.id,o.id,o.amount,NULL,'historical','unknown'
FROM membership_orders o WHERE o.status='refunded' AND o.channel IN ('wechat','virtual') AND o.currency='CNY';
