CREATE TABLE "auth_events" (
  "id" UUID PRIMARY KEY,
  "user_id" VARCHAR(128) NOT NULL REFERENCES "app_users"("id") ON DELETE CASCADE,
  "action" VARCHAR(16) NOT NULL CHECK ("action" IN ('register', 'login')),
  "app_id" VARCHAR(64) NOT NULL,
  "client_ip" VARCHAR(45),
  "peer_ip" VARCHAR(45),
  "request_id" VARCHAR(128) NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "auth_events_created_at_id_idx" ON "auth_events"("created_at" DESC, "id" DESC);
CREATE INDEX "auth_events_user_id_created_at_idx" ON "auth_events"("user_id", "created_at" DESC);
