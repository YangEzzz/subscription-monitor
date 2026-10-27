CREATE TABLE "admin_membership_grants" (
  "id" UUID NOT NULL,
  "user_id" VARCHAR(128) NOT NULL,
  "note" VARCHAR(200) NOT NULL,
  "operator" VARCHAR(80) NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "admin_membership_grants_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "admin_membership_grants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
);
CREATE INDEX "admin_membership_grants_user_idx" ON "admin_membership_grants"("user_id", "created_at");
