import { ClientIpResolver, AccessRequest } from './client-ip';

const request = (peer: string, ip?: string | string[]): AccessRequest => ({
  socket: { remoteAddress: peer },
  headers: { 'x-real-ip': ip, 'x-forwarded-for': '192.0.2.99, 198.51.100.99' },
});

describe('client IP trust boundary', () => {
  it('ignores spoofed headers from untrusted peers and normalizes IPv4-mapped peers', () => {
    const resolver = new ClientIpResolver(['172.18.0.1/32']);
    expect(resolver.resolve(request('203.0.113.5', '192.0.2.1'))).toBe(
      '203.0.113.5',
    );
    expect(resolver.resolve(request('::ffff:203.0.113.5', '192.0.2.1'))).toBe(
      '203.0.113.5',
    );
  });
  it('uses only a single valid X-Real-IP from explicitly trusted proxies', () => {
    const resolver = new ClientIpResolver(['172.18.0.1/32', '::1/128']);
    expect(resolver.resolve(request('::ffff:172.18.0.1', '203.0.113.8'))).toBe(
      '203.0.113.8',
    );
    expect(resolver.resolve(request('::1', '2001:db8::1234'))).toBe(
      '2001:db8::1234',
    );
    for (const value of [
      undefined,
      'invalid',
      '203.0.113.1, 192.0.2.1',
      ['203.0.113.1'],
      '203.0.113.1:80',
    ])
      expect(resolver.resolve(request('172.18.0.1', value))).toBeNull();
    expect(resolver.resolve(request('172.18.0.2', '203.0.113.8'))).toBe(
      '172.18.0.2',
    );
  });
  it('fails startup on invalid trusted networks', () => {
    for (const value of [
      'true',
      '10.0.0.1/33',
      '::1/129',
      '10.0.0.1/-1',
      '10.0.0.1/8/24',
    ])
      expect(() => new ClientIpResolver([value])).toThrow(
        'TRUSTED_PROXY_CIDRS',
      );
  });
});
