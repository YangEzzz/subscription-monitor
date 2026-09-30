import { ConfigService } from '@nestjs/config';
import { MessageError, WechatMessagesService } from './wechat-messages.service';

describe('WeChat template sender', () => {
  let messages: WechatMessagesService;
  let fetchMock: jest.SpyInstance;
  const response = (body: object) =>
    ({ ok: true, json: () => Promise.resolve(body) }) as Response;
  beforeEach(() => {
    messages = new WechatMessagesService(
      new ConfigService({
        app: {
          wechatAppId: 'app',
          wechatAppSecret: 'private',
          wechatReminderTemplateId: 'template',
          wechatMessageState: 'formal',
        },
      }),
    );
    fetchMock = jest.spyOn(global, 'fetch');
  });
  afterEach(() => jest.restoreAllMocks());
  it('maps date12 and amount4, links to the record, and caches the token', async () => {
    fetchMock
      .mockResolvedValueOnce(
        response({ access_token: 'server-token', expires_in: 7200 }),
      )
      .mockResolvedValue(response({ errcode: 0 }));
    await messages.send('openid', 'record', '2026-10-03', 25, 'CNY');
    await messages.send('openid', 'record2', '2026-10-04', 3, 'USD');
    expect(fetchMock).toHaveBeenCalledTimes(3);
    const body = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(body.data).toEqual({
      date12: { value: '2026年10月03日' },
      amount4: { value: '25.00元' },
    });
    expect(body.page).toBe(
      'pages/subscription/index?subscriptionId=record&billingDate=2026-10-03',
    );
    expect(body.miniprogram_state).toBe('formal');
  });
  it('refreshes a rejected expired token once', async () => {
    fetchMock
      .mockResolvedValueOnce(
        response({ access_token: 'old', expires_in: 7200 }),
      )
      .mockResolvedValueOnce(response({ errcode: 40001 }))
      .mockResolvedValueOnce(
        response({ access_token: 'new', expires_in: 7200 }),
      )
      .mockResolvedValueOnce(response({ errcode: 0 }));
    await messages.send('openid', 'record', '2026-10-03', 25, 'CNY');
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });
  it('marks send transport errors uncertain without exposing secrets', async () => {
    fetchMock
      .mockResolvedValueOnce(
        response({ access_token: 'token', expires_in: 7200 }),
      )
      .mockRejectedValueOnce(new Error('secret-url'));
    await expect(
      messages.send('openid', 'record', '2026-10-03', 25, 'CNY'),
    ).rejects.toMatchObject({ code: 'DELIVERY_UNKNOWN', uncertain: true });
  });
  it('distinguishes provider refusals from uncertain failures', async () => {
    fetchMock
      .mockResolvedValueOnce(
        response({ access_token: 'token', expires_in: 7200 }),
      )
      .mockResolvedValueOnce(response({ errcode: 43101 }));
    await expect(
      messages.send('openid', 'record', '2026-10-03', 25, 'CNY'),
    ).rejects.toEqual(new MessageError('43101'));
  });
});
