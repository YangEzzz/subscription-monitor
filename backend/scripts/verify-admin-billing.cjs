// SELECT-only integration check. Synthetic CTEs shadow real tables; nothing is written.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const dotenv = require('dotenv');
const { Client } = require('pg');
const cwd = path.resolve(__dirname, '..');
const read = (file) =>
  fs.existsSync(path.join(cwd, file))
    ? dotenv.parse(fs.readFileSync(path.join(cwd, file)))
    : {};
const env = { ...read('.env'), ...read('.env.local'), ...process.env };
const url = new URL(env.DATABASE_URL);
url.hostname = env.LOCAL_DATABASE_HOST || url.hostname;
url.port = env.LOCAL_DATABASE_PORT || url.port;
url.searchParams.set('options', '-c default_transaction_read_only=on');
const source = fs.readFileSync(
  path.join(cwd, 'src/subscriptions/repositories/billing-audit.ts'),
  'utf8',
);
const sql = source.match(/export const BILLING_AUDIT_SQL = `([\s\S]*?)`;/)?.[1];
if (!sql) throw Error('Cannot locate billing query');
const at = new Date().toISOString();
const row = (id, extra = {}) => ({
  id,
  user_id: id,
  product_name: '会员',
  amount: 990,
  currency: 'CNY',
  channel: 'virtual',
  status: 'paid',
  paid_at: at,
  payment_requested_at: at,
  delivery_confirmed_at: at,
  transaction_id: 'tx-' + id,
  created_at: at,
  ...extra,
});
const orders = [
  row('normal'),
  row('rights'),
  row('metadata', { transaction_id: null }),
  row('delivery', { delivery_confirmed_at: null }),
  row('stale', {
    status: 'pending',
    payment_requested_at: new Date(Date.now() - 20 * 60000).toISOString(),
  }),
  row('new', { status: 'pending' }),
  row('never', { status: 'pending', payment_requested_at: null }),
  row('simulation', { channel: 'simulation' }),
  row('refund', { status: 'refunded' }),
];
const members = ['normal', 'metadata', 'delivery', 'orphan'].map((user_id) => ({
  user_id,
  source: 'virtual',
  source_order_id: user_id,
  status: 'active',
  plan: 'member',
  started_at: at,
}));
members.push({
  user_id: 'legacy',
  source: 'legacy',
  source_order_id: null,
  status: 'active',
  plan: 'member',
  started_at: at,
});
const prefix = `WITH membership_orders AS (
 SELECT * FROM jsonb_to_recordset($1::jsonb) AS o(id text,user_id text,product_name text,amount int,currency text,channel text,status text,paid_at timestamptz,payment_requested_at timestamptz,delivery_confirmed_at timestamptz,transaction_id text,created_at timestamptz)
), memberships AS (
 SELECT * FROM jsonb_to_recordset($2::jsonb) AS m(user_id text,source text,source_order_id text,status text,plan text,started_at timestamptz)
) SELECT * FROM (${sql}) audit`;
(async () => {
  const client = new Client({
    connectionString: url.toString(),
    connectionTimeoutMillis: 5000,
  });
  try {
    await client.connect();
    const result = await client.query(prefix, [
      JSON.stringify(orders),
      JSON.stringify(members),
    ]);
    assert.deepEqual(
      result.rows.map((x) => x.issue).sort(),
      [
        'rights_missing',
        'payment_metadata_missing',
        'delivery_unconfirmed',
        'payment_unconfirmed',
        'membership_without_payment',
      ].sort(),
    );
    assert.equal(result.rows.find((x) => x.id === 'rights').amount, 9.9);
    console.log(
      'PASS: PostgreSQL SELECT-only scenarios (rights, payment evidence, delivery, stale payment, orphan membership, simulation exclusion)',
    );
  } finally {
    await client.end();
  }
})().catch((error) => {
  console.error(
    'Billing SELECT verification failed: ' +
      (error.code || error.constructor.name),
  );
  process.exitCode = 1;
});
