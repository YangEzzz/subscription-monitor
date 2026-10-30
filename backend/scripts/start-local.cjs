// Local API + remote database, directly or through an SSH tunnel. No migrations.
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const dotenv = require('dotenv');
const { Client } = require('pg');

async function main() {
  const cwd = path.resolve(__dirname, '..');
  const read = (name) => {
    const file = path.join(cwd, name);
    return fs.existsSync(file) ? dotenv.parse(fs.readFileSync(file)) : {};
  };
  const env = { ...read('.env'), ...read('.env.local'), ...process.env };
  if (!env.DATABASE_URL)
    throw new Error('DATABASE_URL 未配置，请检查 backend/.env。');
  const url = new URL(env.DATABASE_URL);
  // Docker service names cannot be resolved from this development machine.
  url.hostname = env.LOCAL_DATABASE_HOST || '127.0.0.1';
  url.port = env.LOCAL_DATABASE_PORT || '15432';
  const readOnly = env.LOCAL_DATABASE_READ_ONLY !== 'false';
  if (readOnly) {
    const options = url.searchParams.get('options') || '';
    url.searchParams.set(
      'options',
      `${options} -c default_transaction_read_only=on`.trim(),
    );
  }
  Object.assign(env, {
    DATABASE_URL: url.toString(),
    NODE_ENV: 'development',
    PERSISTENCE_DRIVER: 'prisma',
    APP_PORT: '3001',
    APP_BIND_HOST: '127.0.0.1',
    LOCAL_ADMIN_ENABLED: 'true',
    LOCAL_ADMIN_BIND_HOST: '127.0.0.1',
    NOTIFICATION_SCHEDULER_ENABLED: 'false',
    ANALYTICS_COLLECTION_ENABLED: 'false',
    WECHAT_VIRTUAL_PAY_ENABLED: 'false',
    ADMIN_REFUNDS_ENABLED: 'false',
    ADMIN_RUNTIME_POLICY_ENABLED: readOnly ? 'false' : 'true',
    ADMIN_MEMBERSHIP_GRANTS_ENABLED: readOnly ? 'false' : (env.ADMIN_MEMBERSHIP_GRANTS_ENABLED || 'true'),
    ADMIN_USER_LABELS_ENABLED: env.ADMIN_USER_LABELS_ENABLED === 'false' ? 'false' : 'true',
    MEMBERSHIP_SIMULATION_ENABLED: 'false',
  });
  const client = new Client({
    connectionString: env.DATABASE_URL,
    connectionTimeoutMillis: 5000,
  });
  try {
    await client.connect();
    await client.query('SELECT 1');
  } catch {
    throw new Error(
      `无法连接 ${url.hostname}:${url.port}。请检查数据库端口映射、安全组或 SSH 隧道；连接凭据不会输出。`,
    );
  } finally {
    await client.end().catch(() => {});
  }
  console.log(
    `本地后端连接数据库成功（${readOnly ? '业务只读，管理员可保存账号标记' : '可写'}），管理接口 http://127.0.0.1:3002`,
  );
  const child = spawn(
    process.execPath,
    [require.resolve('@nestjs/cli/bin/nest.js'), 'start', '--watch'],
    {
      cwd,
      env,
      stdio: 'inherit',
    },
  );
  child.on('error', () => {
    console.error('后端启动失败。');
    process.exitCode = 1;
  });
  child.on('exit', (code) => {
    process.exitCode = code ?? 1;
  });
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
