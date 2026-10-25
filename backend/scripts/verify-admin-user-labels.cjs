// Writes only connection-local TEMP tables and rolls the test transaction back.
// Never chooses or modifies a real user classification.
const fs = require('node:fs'),
  path = require('node:path'),
  assert = require('node:assert/strict'),
  dotenv = require('dotenv'),
  { Client } = require('pg');
const root = path.resolve(__dirname, '..'),
  { PrismaSubscriptionsRepository } = require(
    path.join(
      root,
      'dist/subscriptions/repositories/prisma-subscriptions.repository',
    ),
  );
const env = {
  ...dotenv.parse(fs.readFileSync(path.join(root, '.env'))),
  ...dotenv.parse(fs.readFileSync(path.join(root, '.env.local'))),
  ...process.env,
};
const url = new URL(env.DATABASE_URL);
url.hostname = env.LOCAL_DATABASE_HOST || url.hostname;
url.port = env.LOCAL_DATABASE_PORT || url.port;
url.searchParams.delete('options');
async function main() {
  const client = new Client({
    connectionString: url.toString(),
    connectionTimeoutMillis: 5000,
  });
  try {
    await client.connect();
    await client.query(
      'CREATE TEMP TABLE app_users(id varchar(128) PRIMARY KEY,is_test boolean NOT NULL DEFAULT false,test_note varchar(200),test_updated_by varchar(80),test_updated_at timestamptz(3))',
    );
    await client.query(
      'CREATE TEMP TABLE admin_user_label_events(id uuid PRIMARY KEY,user_id varchar(128) NOT NULL,previous_is_test boolean NOT NULL,is_test boolean NOT NULL,note varchar(200),operator varchar(80),created_at timestamptz DEFAULT now())',
    );
    await client.query(
      "INSERT INTO pg_temp.app_users(id) VALUES('temp-verification-user')",
    );
    await client.query('SET default_transaction_read_only=on');
    const execute = async (strings, ...values) => {
      let sql = '';
      for (let i = 0; i < strings.length; i++)
        sql += strings[i] + (i < values.length ? '$' + (i + 1) : '');
      return client.query(sql, values);
    };
    const tx = {
      $queryRaw: async (strings, ...values) =>
        (await execute(strings, ...values)).rows,
      $executeRaw: async (strings, ...values) =>
        (await execute(strings, ...values)).rowCount,
    };
    let inspected = false;
    const rootProxy = {
      $transaction: async (work) => {
        await client.query('BEGIN');
        try {
          await work(tx);
          const {
            rows: [flag],
          } = await client.query(
            "SELECT * FROM pg_temp.app_users WHERE id='temp-verification-user'",
          );
          assert.equal(flag.is_test, true);
          assert.equal(flag.test_updated_by, 'admin');
          assert.equal(
            (
              await client.query(
                'SELECT * FROM pg_temp.admin_user_label_events',
              )
            ).rows.length,
            1,
          );
          inspected = true;
        } finally {
          await client.query('ROLLBACK');
        }
      },
    };
    const repo = new PrismaSubscriptionsRepository(tx, rootProxy);
    await repo.setUserTestFlag(
      'temp-verification-user',
      true,
      'temporary test',
      'admin',
    );
    assert.ok(inspected);
    assert.equal(
      (await repo.findUserTestFlag('temp-verification-user')).isTest,
      false,
    );
    assert.equal(
      (await client.query('SHOW transaction_read_only')).rows[0]
        .transaction_read_only,
      'on',
    );
    console.log(
      JSON.stringify({
        temporaryMetadataWrite: 'passed and rolled back',
        businessDefaultReadOnly: true,
        realAccountsModified: 0,
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
