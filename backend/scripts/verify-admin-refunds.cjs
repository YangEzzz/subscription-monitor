// Read-only SQL verification: EXPLAIN validates inserts without executing them.
const fs = require('node:fs'),
  path = require('node:path'),
  assert = require('node:assert/strict'),
  dotenv = require('dotenv'),
  { Client } = require('pg');
const root = path.resolve(__dirname, '..');
const env = {
  ...dotenv.parse(fs.readFileSync(path.join(root, '.env'))),
  ...dotenv.parse(fs.readFileSync(path.join(root, '.env.local'))),
  ...process.env,
};
const url = new URL(env.DATABASE_URL);
url.hostname = env.LOCAL_DATABASE_HOST || url.hostname;
url.port = env.LOCAL_DATABASE_PORT || url.port;
url.searchParams.set('options', '-c default_transaction_read_only=on');
const source = fs.readFileSync(
  path.join(
    root,
    'src/subscriptions/repositories/prisma-subscriptions.repository.ts',
  ),
  'utf8',
);
const values = {
  orderId: 'nonexistent-refund-verification',
  afterId: '',
  limit: 100,
  'r.orderId': 'nonexistent-refund-verification',
  'r.refundId': 'rf-verification',
  'r.amount': 990,
  'r.status': 'submitting',
  'r.reason': 'verification',
  'r.reasonCode': '3',
  'r.operator': 'test',
  'r.errorCode': null,
  'r.createdAt': new Date(),
  'r.updatedAt': new Date(),
  'r.completedAt': null,
};
async function main() {
  const client = new Client({
    connectionString: url.toString(),
    connectionTimeoutMillis: 5000,
  });
  try {
    await client.connect();
    for (const name of [
      'findMembershipRefund',
      'saveMembershipRefund',
      'listPendingRefunds',
    ]) {
      const start = source.indexOf('async ' + name + '('),
        end = source.indexOf('\n  async ', start + 1),
        method = source.slice(start, end === -1 ? undefined : end);
      const sql = method.match(/\$queryRaw(?:<[^`]*>)?`([\s\S]*?)`/)?.[1];
      assert.ok(sql, name);
      const params = [];
      const bound = sql.replace(/\$\{([^}]+)\}/g, (_, key) => {
        assert.ok(Object.hasOwn(values, key), key);
        params.push(values[key]);
        return '$' + params.length;
      });
      const result = await client.query(
        (name === 'saveMembershipRefund' ? 'EXPLAIN ' : '') + bound,
        params,
      );
      if (name === 'findMembershipRefund') assert.equal(result.rows.length, 0);
    }
    const {
      rows: [row],
    } = await client.query(
      'SELECT COUNT(*)::int count FROM membership_refunds',
    );
    console.log(
      JSON.stringify({
        sqlChecks: 'passed',
        persistedRefundRecords: row.count,
        mode: 'read-only; no refund API called',
      }),
    );
  } finally {
    await client.end();
  }
}
main().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
