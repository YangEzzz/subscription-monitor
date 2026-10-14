import {
  createCipheriv,
  createDecipheriv,
  hkdfSync,
  randomBytes,
} from 'node:crypto';

function key(secret: string) {
  if (Buffer.byteLength(secret) < 32)
    throw new Error('Session encryption is not configured');
  return Buffer.from(
    hkdfSync('sha256', secret, '', 'wechat-payment-session-v1', 32),
  );
}

/** Session keys stay encrypted in the server repository, bound to app and account. */
export function encryptWechatSession(
  sessionKey: string,
  secret: string,
  identity: string,
) {
  const nonce = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key(secret), nonce);
  cipher.setAAD(Buffer.from(identity));
  const encrypted = Buffer.concat([
    cipher.update(sessionKey, 'utf8'),
    cipher.final(),
  ]);
  return [
    'v1',
    nonce.toString('base64url'),
    cipher.getAuthTag().toString('base64url'),
    encrypted.toString('base64url'),
  ].join('.');
}

export function decryptWechatSession(
  encrypted: string,
  secret: string,
  identity: string,
) {
  const [version, nonce, tag, body, extra] = encrypted.split('.');
  if (version !== 'v1' || !nonce || !tag || !body || extra)
    throw new Error('Invalid session');
  const decipher = createDecipheriv(
    'aes-256-gcm',
    key(secret),
    Buffer.from(nonce, 'base64url'),
  );
  decipher.setAAD(Buffer.from(identity));
  decipher.setAuthTag(Buffer.from(tag, 'base64url'));
  return Buffer.concat([
    decipher.update(Buffer.from(body, 'base64url')),
    decipher.final(),
  ]).toString('utf8');
}
