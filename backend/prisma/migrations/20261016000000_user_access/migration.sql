ALTER TABLE "app_users"
ADD COLUMN "last_access_ip" VARCHAR(45),
ADD COLUMN "last_access_at" TIMESTAMPTZ(3);
