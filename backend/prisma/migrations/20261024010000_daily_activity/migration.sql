CREATE TABLE "user_daily_activity" (
 "user_id" VARCHAR(128) NOT NULL,
 "activity_date" DATE NOT NULL,
 "first_seen_at" TIMESTAMPTZ(3) NOT NULL,
 "last_seen_at" TIMESTAMPTZ(3) NOT NULL,
 CONSTRAINT "user_daily_activity_pkey" PRIMARY KEY ("user_id","activity_date"),
 CONSTRAINT "user_daily_activity_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "user_daily_activity_date_idx" ON "user_daily_activity"("activity_date");
