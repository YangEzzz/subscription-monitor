import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
  OnApplicationShutdown,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { ConfigService } from '@nestjs/config';
import { VirtualPayService } from '../subscriptions/virtual-pay.service';
import { MembershipPaymentsService } from '../subscriptions/membership-payments.service';
import {
  SUBSCRIPTIONS_REPOSITORY,
  SubscriptionsRepository,
} from '../subscriptions/repositories/subscriptions.repository';
import { MembershipRefund } from '../subscriptions/domain/membership-refund';

@Injectable()
export class AdminRefundsService
  implements OnModuleInit, OnApplicationShutdown
{
  private timer?: ReturnType<typeof setInterval>;
  private running = false;
  private readonly logger = new Logger(AdminRefundsService.name);
  constructor(
    @Inject(SUBSCRIPTIONS_REPOSITORY)
    private readonly repo: SubscriptionsRepository,
    private readonly gateway: VirtualPayService,
    private readonly payments: MembershipPaymentsService,
    private readonly config: ConfigService,
  ) {}
  get enabled() {
    return (
      process.env.ADMIN_REFUNDS_ENABLED !== 'false' &&
      this.gateway.settings.enabled
    );
  }
  onModuleInit() {
    if (this.enabled) {
      this.timer = setInterval(() => void this.reconcile(), 300000);
      this.timer.unref();
    }
  }
  onApplicationShutdown() {
    if (this.timer) clearInterval(this.timer);
  }
  async inspect(orderId: string) {
    const order = await this.repo.findMembershipOrderById(orderId);
    if (!order) throw new NotFoundException('没有找到此订单');
    const refund = await this.repo.findMembershipRefund(orderId);
    const base = {
      orderId,
      amount: order.amount,
      currency: order.currency,
      refund,
      eligible: false,
      reason: '',
    };
    if (order.channel !== 'virtual')
      return {
        ...base,
        reason:
          order.channel === 'simulation'
            ? '模拟订单没有实际扣款，不办理退款。'
            : '此历史支付渠道请在原支付平台办理。',
      };
    if (!this.enabled)
      return {
        ...base,
        reason: '当前环境未开放退款操作，请在已启用退款的生产后台处理。',
      };
    if (refund)
      return {
        ...base,
        reason:
          refund.status === 'failed'
            ? '平台确认退款失败，请按退款单号在微信平台核查；本后台不会重复发起。'
            : '该订单已有退款记录，请查看处理结果。',
      };
    if (
      order.status !== 'paid' ||
      !order.transactionId ||
      order.currency !== 'CNY'
    )
      return { ...base, reason: '仅支持有平台交易号的已支付人民币订单。' };
    const identity = await this.repo.findWechatIdentity(order.userId);
    if (!identity || identity.appId !== this.config.get('app.wechatAppId'))
      throw new ConflictException('支付账号与当前小程序不匹配');
    const result = await this.gateway.query(order, identity.openId);
    if (
      !result ||
      result.transaction.orderId !== order.id ||
      result.transaction.wxOrderId !== order.transactionId ||
      result.transaction.amount !== order.amount ||
      result.transaction.openId !== identity.openId
    )
      return { ...base, reason: '平台订单尚未核实，请先核对支付记录。' };
    if (result.orderType === 7)
      return {
        ...base,
        reason: 'iOS 订单由用户向 Apple 申请退款，本后台不能主动退款。',
      };
    if (result.orderType !== 0)
      return { ...base, reason: '暂时无法确认支付平台类型，不能发起退款。' };
    if (result.state !== 'paid')
      return { ...base, reason: '平台订单当前不处于可退款的已支付状态。' };
    if (result.leftFee !== order.amount)
      return {
        ...base,
        reason: '平台剩余可退金额与全额不一致，请在微信平台核查已有退款。',
      };
    const paidAt = Date.parse(result.transaction.paidAt);
    if (
      !Number.isFinite(paidAt) ||
      paidAt > Date.now() ||
      Date.now() - paidAt > 365 * 86400000
    )
      return { ...base, reason: '订单不在支付后 365 天的可申请期限内。' };
    return {
      ...base,
      eligible: true,
      reason: '全额退款。平台确认完成后，撤销此订单发放的会员权益。',
    };
  }
  async submit(
    orderId: string,
    input: {
      reason?: unknown;
      reasonCode?: unknown;
      amount?: unknown;
      confirmOrderId?: unknown;
    },
    operator: string,
  ) {
    if (!this.enabled) throw new ForbiddenException('当前环境未开放退款操作');
    if (
      typeof input.reason !== 'string' ||
      input.reason.trim().length < 2 ||
      input.reason.trim().length > 200 ||
      typeof input.reasonCode !== 'string' ||
      !/^[1-5]$/.test(input.reasonCode) ||
      input.confirmOrderId !== orderId ||
      !Number.isSafeInteger(input.amount)
    )
      throw new BadRequestException('请填写退款原因并核对订单与退款金额。');
    const previous = await this.repo.findMembershipRefund(orderId);
    if (previous) return previous;
    const quote = await this.inspect(orderId);
    if (!quote.eligible) throw new ConflictException(quote.reason);
    if (input.amount !== quote.amount)
      throw new ConflictException('退款金额已变化，请重新核对。');
    let claimed = false;
    const refund = await this.repo.transactionForUser(
      (await this.repo.findMembershipOrderById(orderId))!.userId,
      async (repo) => {
        const existing = await repo.findMembershipRefund(orderId);
        if (existing) return existing;
        const order = await repo.findMembershipOrderById(orderId);
        if (!order || order.status !== 'paid' || order.amount !== quote.amount)
          throw new ConflictException('订单状态已变化，请重新核对。');
        const now = new Date().toISOString();
        const record: MembershipRefund = {
          orderId,
          refundId: 'rf' + randomBytes(15).toString('hex'),
          amount: quote.amount,
          status: 'submitting',
          reason: (input.reason as string).trim(),
          reasonCode: input.reasonCode as string,
          operator,
          errorCode: null,
          createdAt: now,
          updatedAt: now,
          completedAt: null,
        };
        await repo.saveMembershipRefund(record);
        claimed = true;
        return record;
      },
    );
    if (!claimed) return refund;
    const order = (await this.repo.findMembershipOrderById(orderId))!;
    try {
      const identity = (await this.repo.findWechatIdentity(order.userId))!;
      await this.gateway.refund(
        order,
        identity.openId,
        refund.refundId,
        refund.amount,
        refund.reasonCode,
      );
      return await this.update(order.userId, orderId, 'processing', null);
    } catch {
      // Even explicit network/API failure may follow acceptance. Never issue a new refund ID.
      return this.update(
        order.userId,
        orderId,
        'unknown',
        'RESULT_UNCONFIRMED',
      );
    }
  }
  private update(
    userId: string,
    orderId: string,
    status: MembershipRefund['status'],
    errorCode: string | null,
  ) {
    return this.repo.transactionForUser(userId, async (repo) => {
      const row = await repo.findMembershipRefund(orderId);
      if (!row) throw new NotFoundException('没有找到退款记录');
      if (row.status === 'succeeded' || row.status === 'failed') return row;
      row.status = status;
      row.errorCode = errorCode;
      row.updatedAt = new Date().toISOString();
      if (status === 'succeeded' || status === 'failed')
        row.completedAt = row.updatedAt;
      await repo.saveMembershipRefund(row);
      return row;
    });
  }
  async check(orderId: string) {
    if (!this.enabled)
      throw new ForbiddenException('当前环境未开放退款查询同步');
    const row = await this.repo.findMembershipRefund(orderId);
    if (!row) throw new NotFoundException('没有找到退款记录');
    if (row.status === 'succeeded' || row.status === 'failed') return row;
    const order = (await this.repo.findMembershipOrderById(orderId))!;
    const identity = await this.repo.findWechatIdentity(order.userId);
    if (!identity || identity.appId !== this.config.get('app.wechatAppId'))
      throw new ConflictException('支付账号不匹配');
    const result = await this.gateway.queryRefund(
      row.refundId,
      identity.openId,
    );
    if (!result || result.amount !== row.amount)
      return this.update(
        order.userId,
        orderId,
        'unknown',
        'RESULT_UNCONFIRMED',
      );
    if (result.status === 8) {
      await this.payments.refundVirtual(
        { orderId, wxOrderId: order.transactionId!, openId: identity.openId },
        row.amount,
        {
          refundId: row.refundId,
          confirmedAt: result.confirmedAt,
          source: 'query',
        },
      );
      return this.update(order.userId, orderId, 'succeeded', null);
    }
    if (result.status === 7)
      return this.update(
        order.userId,
        orderId,
        'failed',
        'PLATFORM_REFUND_FAILED',
      );
    return this.update(order.userId, orderId, 'processing', null);
  }
  async reconcile() {
    if (!this.enabled || this.running) return;
    this.running = true;
    try {
      let cursor = '';
      for (;;) {
        const rows = await this.repo.listPendingRefunds(cursor, 100);
        for (const row of rows) {
          try {
            await this.check(row.orderId);
          } catch {
            this.logger.warn('Refund reconciliation deferred');
          }
        }
        if (rows.length < 100) break;
        cursor = rows[rows.length - 1].orderId;
      }
    } catch {
      this.logger.warn('Refund reconciliation unavailable');
    } finally {
      this.running = false;
    }
  }
}
