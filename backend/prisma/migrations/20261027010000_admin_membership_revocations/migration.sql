ALTER TABLE "admin_membership_grants" ADD COLUMN "action" VARCHAR(16) NOT NULL DEFAULT 'grant';
ALTER TABLE "admin_membership_grants" ADD COLUMN "previous_membership" JSONB;
ALTER TABLE "admin_membership_grants" ADD CONSTRAINT "admin_membership_grants_action_check" CHECK ("action" IN ('grant', 'revoke'));
