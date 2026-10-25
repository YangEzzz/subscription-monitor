// Read-only checks against PostgreSQL. Fixture CTEs shadow tables without inserts.
const fs = require('node:fs'),
  path = require('node:path'),
  assert = require('node:assert/strict');
const dotenv = require('dotenv'),
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
const refundSql = fs
  .readFileSync(
    path.join(root, 'src/subscriptions/repositories/finance-sql.ts'),
    'utf8',
  )
  .match(/export const REFUND_RECEIPTS_SQL = `([\s\S]*?)`;/)[1];
const sql = fs
  .readFileSync(
    path.join(root, 'src/subscriptions/repositories/admin-stats.ts'),
    'utf8',
  )
  .match(/export const ADMIN_STATS_SQL = `([\s\S]*?)`;/)[1]
  .replace('${REFUND_RECEIPTS_SQL}', refundSql);
async function main() {
  const client = new Client({
    connectionString: url.toString(),
    connectionTimeoutMillis: 5000,
  });
  try {
    await client.connect();
    const activitySource = fs.readFileSync(
      path.join(
        root,
        'src/subscriptions/repositories/prisma-subscriptions.repository.ts',
      ),
      'utf8',
    );
    const upsert = activitySource.match(
      /async recordUserActivity[\s\S]*?\$queryRaw`([\s\S]*?)`/,
    )?.[1];
    assert.ok(upsert);
    await client.query(
      'EXPLAIN ' +
        upsert.replace(/\$\{at\}/g, '$1').replace(/\$\{userId\}/g, '$2'),
      [new Date(), 'nonexistent-statistics-verification-user'],
    );
    const prefix = `WITH
      clock AS(SELECT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Shanghai')::date today),
      app_users AS(SELECT 'old'::text id,((today-8)::timestamp AT TIME ZONE 'Asia/Shanghai') created_at,false is_test FROM clock UNION ALL SELECT 'new',(today::timestamp AT TIME ZONE 'Asia/Shanghai'),false FROM clock UNION ALL SELECT 'test',(today::timestamp AT TIME ZONE 'Asia/Shanghai'),true FROM clock),
      activity_base AS(SELECT 'old'::text user_id,today-10 activity_date,((today-10)::timestamp AT TIME ZONE 'Asia/Shanghai') first_seen_at FROM clock UNION ALL SELECT 'old',today-7,((today-7)::timestamp AT TIME ZONE 'Asia/Shanghai') FROM clock UNION ALL SELECT 'old',today,now() FROM clock UNION ALL SELECT 'new',today,now() FROM clock UNION ALL SELECT 'test',today,now() FROM clock),
      user_daily_activity AS(SELECT *,first_seen_at last_seen_at FROM activity_base),
      subscriptions AS(SELECT 's1'::text id,'new'::text user_id,'真实订阅'::text name,(today::timestamp AT TIME ZONE 'Asia/Shanghai') created_at,NULL::timestamptz deleted_at,false is_demo FROM clock UNION ALL SELECT 's2','new','示例',now(),NULL,true UNION ALL SELECT 's3','test','测试',now(),NULL,false),
      membership_orders AS(SELECT 'one'::text id,'new'::text user_id,now() paid_at,990 amount,'paid'::text status,'virtual'::text channel,'CNY'::text currency UNION ALL SELECT 'two','new',now(),990,'paid','virtual','CNY' UNION ALL SELECT 'sim','old',now(),990,'paid','simulation','CNY' UNION ALL SELECT 'ref','old',now()-interval '1 day',990,'refunded','wechat','CNY' UNION ALL SELECT 'test-order','test',now(),990,'refunded','wechat','CNY' UNION ALL SELECT 'undated','old',now()-interval '100 days',990,'refunded','wechat','CNY' UNION ALL SELECT 'lost','old',now()-interval '100 days',990,'refunded','wechat','CNY'),
      payment_refund_receipts AS(SELECT 'receipt-real'::text id,'ref'::text order_id,990 amount,now() confirmed_at UNION ALL SELECT 'receipt-test','test-order',990,now() UNION ALL SELECT 'legacy:undated','undated',990,NULL::timestamptz)
    `;
    const ts = require('typescript'),
      detailModule = { exports: {} };
    new Function(
      'exports',
      'module',
      'require',
      ts.transpileModule(
        fs.readFileSync(
          path.join(
            root,
            'src/subscriptions/repositories/statistics-details.ts',
          ),
          'utf8',
        ),
        {
          compilerOptions: {
            module: ts.ModuleKind.CommonJS,
            target: ts.ScriptTarget.ES2021,
          },
        },
      ).outputText,
    )(detailModule.exports, detailModule, () => ({
      REFUND_RECEIPTS_SQL: refundSql,
    }));
    for (const range of [7, 30, 90])
      for (const excludeTest of [true, false]) {
        const {
          rows: [r],
        } = await client.query(prefix + `SELECT stats.* FROM (${sql}) stats`, [
          range,
          excludeTest,
        ]);
        assert.equal(r.days.length, range);
        assert.equal(r.summary.paidAmountCny, excludeTest ? 29.7 : 39.6);
        assert.equal(r.summary.refundAmountCny, excludeTest ? 9.9 : 19.8);
        assert.equal(r.summary.netAmountCny, 19.8);
        assert.equal(r.undatedRefunds.count, 2);
        assert.equal(r.activity.dau, excludeTest ? 2 : 3);
        const from = r.days[0].date,
          to = r.days.at(-1).date;
        for (const metric of detailModule.exports.STATS_METRICS) {
          const spec = detailModule.exports.detailSql(metric);
          const detail =
            prefix +
            `, detail_rows AS (${spec.sql}),filtered AS(SELECT * FROM detail_rows r WHERE strpos(lower(row_to_json(r)::text),lower($4))>0 AND ($6::boolean OR NOT $6::boolean)) SELECT (SELECT COUNT(*)::int FROM filtered) total,` +
            (spec.hasAmount
              ? '(SELECT COALESCE(SUM(amount),0)::double precision FROM filtered)'
              : 'NULL::double precision') +
            ` amount,(SELECT COUNT(*)::int FROM (SELECT * FROM filtered ORDER BY id LIMIT 20 OFFSET $5) p) page_count`;
          const {
            rows: [d],
          } = await client.query(detail, [from, to, excludeTest, '', 0, false]);
          const countKey =
            { paidAmountCny: 'paidOrders', refundAmountCny: 'refundOrders' }[
              metric
            ] || metric;
          if (metric !== 'netAmountCny')
            assert.equal(d.total, r.summary[countKey], metric + ' count');
          if (spec.hasAmount)
            assert.ok(
              Math.abs(
                d.amount -
                  r.summary[
                    metric === 'paidUsers' || metric === 'paidOrders'
                      ? 'paidAmountCny'
                      : metric === 'refundOrders'
                        ? 'refundAmountCny'
                        : metric
                  ],
              ) < 0.000001,
              metric + ' sum',
            );
        }
        if (range === 30) {
          const old = r.cohorts.find((c) => c.date !== to);
          assert.equal(old.d1, 1);
          assert.equal(old.d7, 0);
          assert.equal(old.d30, null);
          assert.equal(r.days[0].activeUsers, null);
        }
      }
    const {
      rows: [real],
    } = await client.query(sql, [30, true]);
    console.log(
      JSON.stringify({
        syntheticCases: 'passed',
        live: {
          days: real.days.length,
          summary: real.summary,
          activity: real.activity,
          trackingSince: real.trackingSince,
        },
      }),
    );
  } finally {
    await client.end();
  }
}
main().catch((e) => {
  console.error(e.message, 'position', e.position);
  process.exitCode = 1;
});
