import { afterEach, describe, expect, it, vi } from 'vitest';
import { format, defaultAddress, detailColumns } from '../src/lib/data';

afterEach(() => vi.unstubAllGlobals());
describe('后台数据口径', () => {
  it('金额未知不显示成零，保留币种，不再次换算服务端已转换的订单金额', () => {
    expect(format('amount', null, { currency: 'CNY' })).toBe('—');
    expect(format('amount', 9.9, { currency: 'CNY' })).toContain('9.90');
    expect(format('amount', 12.99, { currency: 'USD' })).toContain('12.99');
  });
  it('模拟成功和真实支付状态分别展示，未知标识原样保留', () => {
    expect(format('status', 'paid', { channel: 'simulation' })).toBe(
      '模拟成功',
    );
    expect(format('status', 'paid', { channel: 'wechat' })).toBe('已支付');
    expect(format('id', 'active')).toBe('active');
    expect(format('status', 'future-status')).toBe('future-status');
  });
  it('时间使用北京时间，日期字符串保持原始账期', () => {
    expect(format('createdAt', '2026-10-01T00:00:00Z')).toContain('08:00');
    expect(format('billingDate', '2026-10-01')).toBe('2026-10-01');
  });
  it('同源 API 地址支持域名根目录和部署子目录', () => {
    vi.stubGlobal('location', { href: 'https://example.com/?view=users' });
    expect(defaultAddress()).toBe('https://example.com/api/');
    vi.stubGlobal('location', {
      href: 'https://example.com/admin/?view=users',
    });
    expect(defaultAddress()).toBe('https://example.com/admin/api/');
  });
  it('详情保留订单号和完成时间，字段不重复', () => {
    const columns = detailColumns('membershipOrders');
    expect(columns.some((column) => column.key === 'id')).toBe(true);
    expect(columns.some((column) => column.key === 'paidAt')).toBe(true);
    expect(new Set(columns.map((column) => column.key)).size).toBe(
      columns.length,
    );
  });
});
