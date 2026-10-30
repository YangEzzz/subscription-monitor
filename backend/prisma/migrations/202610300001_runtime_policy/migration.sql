CREATE TABLE runtime_policy (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  membership_enabled BOOLEAN NOT NULL DEFAULT false,
  free_subscription_limit INTEGER NOT NULL DEFAULT 10 CHECK (free_subscription_limit BETWEEN 1 AND 100000),
  updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT now(),
  updated_by VARCHAR(80)
);
