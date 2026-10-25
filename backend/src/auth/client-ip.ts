import { BlockList, isIP } from 'node:net';
import { IncomingHttpHeaders } from 'node:http';

export type AccessRequest = {
  requestId?: string;
  socket: { remoteAddress?: string };
  headers: IncomingHttpHeaders;
};

function normalize(value: unknown): string | null {
  if (typeof value !== 'string' || value.includes('%') || !isIP(value))
    return null;
  if (value.toLowerCase().startsWith('::ffff:') && isIP(value.slice(7)) === 4)
    return value.slice(7);
  return isIP(value) === 6
    ? new URL(`http://[${value}]/`).hostname.slice(1, -1)
    : value;
}

// Nginx must overwrite X-Real-IP. Forwarded headers from any other peer
// are ignored, including client-supplied X-Forwarded-For chains.
export class ClientIpResolver {
  private readonly proxies = new BlockList();

  constructor(cidrs: string[] = []) {
    for (const cidr of cidrs) {
      const [address, prefix, extra] = cidr.split('/');
      const family = isIP(address);
      const bits = family === 4 ? 32 : 128;
      if (
        !family ||
        extra !== undefined ||
        (prefix !== undefined &&
          (!/^\d+$/.test(prefix) || Number(prefix) > bits))
      )
        throw new Error(
          'TRUSTED_PROXY_CIDRS must contain valid IP addresses or CIDRs',
        );
      this.proxies.addSubnet(
        address,
        prefix === undefined ? bits : Number(prefix),
        family === 4 ? 'ipv4' : 'ipv6',
      );
    }
  }

  resolve(request: AccessRequest): string | null {
    const peer = normalize(request.socket.remoteAddress);
    if (!peer) return null;
    if (this.proxies.check(peer, isIP(peer) === 4 ? 'ipv4' : 'ipv6'))
      return normalize(request.headers['x-real-ip']);
    return peer;
  }
}
