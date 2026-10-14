ALTER TABLE "membership_orders" ADD COLUMN "transaction_id" VARCHAR(64);
CREATE UNIQUE INDEX "membership_orders_transaction_id_key" ON "membership_orders"("transaction_id");
