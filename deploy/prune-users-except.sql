-- Invoked only by prune-users-except.sh with validated psql variables.
BEGIN;
SET LOCAL lock_timeout = '5s';
LOCK TABLE app_users IN SHARE ROW EXCLUSIVE MODE;

CREATE TEMP TABLE users_to_keep (id text PRIMARY KEY) ON COMMIT DROP;
INSERT INTO users_to_keep VALUES (:'keep_user_one'), (:'keep_user_two');
CREATE TEMP TABLE prune_expected_count ON COMMIT DROP AS
  SELECT :'expected_total'::integer AS total;

DO $$
BEGIN
  IF (SELECT count(*) FROM app_users u JOIN users_to_keep k USING (id)) <> 2 THEN
    RAISE EXCEPTION 'A retained account is missing; no users were deleted';
  END IF;
  IF (SELECT count(*) FROM app_users) NOT IN (2, (SELECT total FROM prune_expected_count)) THEN
    RAISE EXCEPTION 'User count changed since review; no users were deleted';
  END IF;
END $$;

-- Foreign keys cascade only the removed accounts' related data.
DELETE FROM app_users WHERE id NOT IN (SELECT id FROM users_to_keep);

DO $$
BEGIN
  IF (SELECT count(*) FROM app_users) <> 2 THEN
    RAISE EXCEPTION 'Post-delete verification failed; rolling back';
  END IF;
END $$;

SELECT id AS retained_user FROM app_users ORDER BY id;
COMMIT;
