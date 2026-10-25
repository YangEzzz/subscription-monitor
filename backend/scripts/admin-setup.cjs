const fs = require('node:fs');
const path = require('node:path');
const { randomBytes, scryptSync } = require('node:crypto');
const dotenv = require('dotenv');
const cwd = path.resolve(__dirname, '..');
const envIndex = process.argv.indexOf('--env-file');
const file =
  envIndex >= 0
    ? path.resolve(process.cwd(), process.argv[envIndex + 1] || '')
    : path.join(cwd, '.env.local');
if (envIndex >= 0 && !process.argv[envIndex + 1])
  throw Error('--env-file 需要路径。');
const existing = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
const config = dotenv.parse(existing);
if (config.ADMIN_PASSWORD_HASH && !process.argv.includes('--reset')) {
  console.log(
    '管理员已初始化。重置密码请添加 --reset；将使重启后的旧会话失效。',
  );
  process.exit(0);
}
const usernameIndex = process.argv.indexOf('--username');
const username = usernameIndex >= 0 ? process.argv[usernameIndex + 1] : 'admin';
if (!/^[a-zA-Z0-9_.-]{1,32}$/.test(username || ''))
  throw Error('管理员账号名无效。');
const password = process.argv.includes('--password-stdin')
  ? fs.readFileSync(0, 'utf8').trimEnd()
  : randomBytes(18).toString('base64url');
if (password.length < 12 || password.length > 1024)
  throw Error('密码至少12位，最多1024位。');
const salt = randomBytes(16).toString('hex');
const hash = `scrypt$${salt}$${scryptSync(password, salt, 64).toString('hex')}`;
const lines = existing
  .split(/\r?\n/)
  .filter((x) => x && !/^ADMIN_(USERNAME|PASSWORD_HASH)=/.test(x));
fs.writeFileSync(
  file,
  lines.join('\n') +
    `\nADMIN_USERNAME=${username}\nADMIN_PASSWORD_HASH='${hash}'\n`,
  { mode: 0o600 },
);
const output = path.join(path.dirname(file), '.env.admin-initial');
if (!process.argv.includes('--password-stdin'))
  fs.writeFileSync(
    output,
    `管理员账号：${username}\n初始密码：${password}\n\n仅供本机使用，不要提交或转发。使用后可删除此文件。\n`,
    { mode: 0o600 },
  );
console.log('管理员账号已初始化，密码哈希已写入指定环境文件。');
if (!process.argv.includes('--password-stdin'))
  console.log(
    '初始登录信息保存在环境文件同目录的 .env.admin-initial（不会输出密码到日志）。',
  );
