import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  Logger,
  OnModuleInit,
  OnApplicationShutdown,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes, randomUUID } from 'node:crypto';
import { VirtualPayService, VirtualTransaction } from './virtual-pay.service';
import {
  SUBSCRIPTIONS_REPOSITORY,
  SubscriptionsRepository,
} from './repositories/subscriptions.repository';
import {
  CreateMembershipOrderDto,
  SimulateMembershipPaymentDto,
} from './dto/membership-order.dto';
import { MembershipOrder } from './domain/membership-order';

@Injectable()
export class MembershipPaymentsService
  implements OnModuleInit, OnApplicationShutdown
{
  private timer?: ReturnType<typeof setInterval>;
  private reconciling = false;
  private readonly logger = new Logger(MembershipPaymentsService.name);
  onModuleInit() {
    if (this.virtualPay?.settings.enabled) {
      this.timer = setInterval(
        () => {
          void this.reconcilePending().catch(() =>
            this.logger.warn('Virtual payment reconciliation unavailable'),
          );
        },
        5 * 60 * 1000,
      );
      this.timer.unref();
    }
  }
  onApplicationShutdown() {
    if (this.timer) clearInterval(this.timer);
  }
  async reconcilePending() {
    if (this.reconciling || !this.virtualPay?.settings.enabled) return;
    this.reconciling = true;
    try {
      let cursor = '';
      while (true) {
        const orders = await this.repository.listVirtualOrdersToReconcile(
          cursor,
          100,
        );
        for (const order of orders) {
          try {
            await this.detail(order.userId, order.id);
          } catch {
            this.logger.warn(
              `Virtual payment reconciliation deferred: ${order.id}`,
            );
          }
        }
        if (orders.length < 100) break;
        cursor = orders[orders.length - 1].id;
      }
    } finally {
      this.reconciling = false;
    }
  }
  constructor(
    private readonly config: ConfigService,
    @Inject(SUBSCRIPTIONS_REPOSITORY)
    private readonly repository: SubscriptionsRepository,
    private readonly virtualPay?: VirtualPayService,
  ) {}

  product() {
    const realPayment =
      this.config.get<boolean>('app.virtualPay.enabled') === true;
    return {
      id: 'lifetime',
      name: '永久会员',
      amount: 990,
      currency: 'CNY',
      lifetime: true,
      channel: realPayment ? 'virtual' : 'simulation',
      iosEnabled: realPayment && this.virtualPay?.settings.iosEnabled === true,
      available:
        realPayment ||
        this.config.get<boolean>('app.membershipSimulationEnabled') === true,
      notice: realPayment
        ? '一次支付 ¥9.90，开通永久会员，不会自动续费。'
        : '模拟支付，不会实际扣款；当前开通的权益为测试权益。',
    };
  }

  private assertEnabled() {
    if (!this.product().available)
      throw new ForbiddenException({
        code: 'MEMBERSHIP_PURCHASE_DISABLED',
        message: '会员购买暂未开放',
      });
  }

  async list(userId: string) {
    if (this.virtualPay?.settings.enabled) {
      const orders = await this.repository.listMembershipOrders(userId);
      for (const order of orders.filter(
        (o) =>
          o.channel === 'virtual' &&
          o.paymentRequestedAt &&
          (o.status === 'pending' ||
            (o.status === 'paid' && !o.deliveryConfirmedAt)),
      ))
        await this.detail(userId, order.id);
    }
    return {
      items: (await this.repository.listMembershipOrders(userId)).slice(0, 50),
    };
  }
  async detail(userId: string, id: string) {
    const order = await this.repository.findMembershipOrder(userId, id);
    if (!order) throw new NotFoundException('没有找到此订单');
    if (
      order.channel !== 'virtual' ||
      !this.virtualPay?.settings.enabled ||
      !order.paymentRequestedAt ||
      !['pending', 'paid'].includes(order.status)
    )
      return order;
    const identity = await this.repository.findWechatIdentity(userId);
    if (!identity) throw new ForbiddenException('请重新微信登录');
    const result = await this.virtualPay.query(order, identity.openId);
    if (!result) return order;
    if (result.state === 'refunded')
      return this.refundVirtual(result.transaction, result.refundFee);
    if (result.state === 'paid') {
      const paid = await this.confirmVirtualPayment(result.transaction);
      if (paid.status === 'refunded') return paid;
      if (!result.delivered) await this.virtualPay.confirmDelivery(id);
      return this.markDelivered(userId, id);
    }
    if (result.state === 'closed')
      return this.repository.transactionForUser(userId, async (repo) => {
        const current = (await repo.findMembershipOrder(userId, id))!;
        if (current.status === 'pending') {
          current.status = 'cancelled';
          current.updatedAt = new Date().toISOString();
          await repo.saveMembershipOrder(current);
        }
        return current;
      });
    return order;
  }
  async create(userId: string, input: CreateMembershipOrderDto) {
    this.assertEnabled();
    return this.repository.transactionForUser(userId, async (repository) => {
      const orders = await repository.listMembershipOrders(userId);
      const repeated = orders.find(
        (order) => order.requestId === input.requestId,
      );
      const product = this.product();
      if (repeated) {
        if (repeated.channel !== product.channel)
          throw new ConflictException('支付方式已变更，请刷新后重新创建订单');
        return repeated;
      }
      if ((await repository.findMembership(userId))?.status === 'active')
        throw new ConflictException({
          code: 'MEMBERSHIP_ALREADY_ACTIVE',
          message: '当前账号已开通会员，无需重复购买',
        });
      const pending = orders.find(
        (order) =>
          order.status === 'pending' && order.channel === product.channel,
      );
      if (pending) return pending;
      const now = new Date().toISOString();
      const order: MembershipOrder = {
        id:
          product.channel === 'virtual'
            ? 'mo' + randomBytes(15).toString('hex')
            : 'mo_' + randomUUID(),
        userId,
        requestId: input.requestId,
        productId: product.id,
        productName: product.name,
        amount: product.amount,
        currency: product.currency,
        channel: product.channel as MembershipOrder['channel'],
        status: 'pending',
        createdAt: now,
        updatedAt: now,
        paidAt: null,
      };
      await repository.saveMembershipOrder(order);
      return order;
    });
  }

  async simulate(
    userId: string,
    id: string,
    input: SimulateMembershipPaymentDto,
  ) {
    this.assertSimulationEnabled();
    return this.repository.transactionForUser(userId, async (repository) => {
      const order = await repository.findMembershipOrder(userId, id);
      if (!order) throw new NotFoundException('没有找到此订单');
      const status = {
        success: 'paid',
        cancel: 'cancelled',
        failure: 'failed',
      }[input.outcome] as MembershipOrder['status'];
      if (order.status === status) return order;
      if (order.status !== 'pending')
        throw new ConflictException({
          code: 'MEMBERSHIP_ORDER_FINISHED',
          message: '订单已结束，请重新查询订单状态',
        });
      if (
        order.channel !== 'simulation' ||
        order.productId !== 'lifetime' ||
        ![990, 2990].includes(order.amount) ||
        order.currency !== 'CNY'
      )
        throw new ConflictException('订单信息不正确');
      const now = new Date().toISOString();
      if (status === 'paid') {
        if ((await repository.findMembership(userId))?.status === 'active')
          throw new ConflictException({
            code: 'MEMBERSHIP_ALREADY_ACTIVE',
            message: '当前账号已开通会员，无需重复购买',
          });
        await repository.saveMembership({
          userId,
          status: 'active',
          plan: 'member',
          startedAt: now,
          source: 'simulation',
          sourceOrderId: order.id,
        });
        order.paidAt = now;
      }
      order.status = status;
      order.updatedAt = now;
      await repository.saveMembershipOrder(order);
      return order;
    });
  }

  async simulateRefund(userId: string, id: string) {
    this.assertSimulationEnabled();
    return this.repository.transactionForUser(userId, async (repository) => {
      const order = await repository.findMembershipOrder(userId, id);
      if (!order) throw new NotFoundException('没有找到此订单');
      if (order.status === 'refunded') return order;
      if (order.channel !== 'simulation' || order.status !== 'paid')
        throw new ConflictException('只有已完成的模拟订单可以撤销');
      const membership = await repository.findMembership(userId);
      if (
        membership?.source === 'simulation' &&
        membership.sourceOrderId === order.id
      )
        await repository.saveMembership({
          userId,
          status: 'free',
          plan: 'free',
          startedAt: null,
          source: 'simulation',
          sourceOrderId: null,
        });
      order.status = 'refunded';
      order.updatedAt = new Date().toISOString();
      await repository.saveMembershipOrder(order);
      return order;
    });
  }

  private assertSimulationEnabled() {
    if (
      this.config.get<boolean>('app.membershipSimulationEnabled') !== true ||
      this.config.get<boolean>('app.virtualPay.enabled') === true
    )
      throw new ForbiddenException('模拟支付暂未开放');
  }

  async payment(userId: string, id: string) {
    if (!this.virtualPay) throw new ForbiddenException('虚拟支付暂未开放');
    this.virtualPay.assertEnabled();
    const order = await this.detail(userId, id);
    if (order.channel !== 'virtual')
      throw new ConflictException('该订单不是虚拟支付订单');
    if (order.status === 'paid' || order.status === 'refunded')
      return { order, payment: null };
    if (order.status !== 'pending')
      throw new ConflictException('订单已结束，请重新创建订单');
    return this.repository.transactionForUser(userId, async (repo) => {
      const current = (await repo.findMembershipOrder(userId, id))!;
      // Never reuse outTradeNo for a second SDK request, including an uncertain response.
      if (current.status !== 'pending' || current.paymentRequestedAt)
        return { order: current, payment: null };
      if ((await repo.findMembership(userId))?.status === 'active')
        throw new ConflictException('当前账号已开通会员，无需重复购买');
      const identity = await repo.findWechatIdentity(userId);
      if (
        !identity ||
        identity.appId !== this.config.get<string>('app.wechatAppId')
      )
        throw new ForbiddenException('请重新微信登录后再支付');
      const payment = this.virtualPay!.payment(current, identity);
      current.paymentRequestedAt = current.updatedAt = new Date().toISOString();
      await repo.saveMembershipOrder(current);
      return { order: current, payment };
    });
  }
  async confirmVirtualPayment(tx: VirtualTransaction) {
    const existing = await this.repository.findMembershipOrderById(tx.orderId);
    if (!existing) throw new NotFoundException('没有找到此订单');
    return this.repository.transactionForUser(existing.userId, async (repo) => {
      const order = (await repo.findMembershipOrder(
        existing.userId,
        tx.orderId,
      ))!;
      const identity = await repo.findWechatIdentity(existing.userId);
      if (
        order.channel !== 'virtual' ||
        order.productId !== 'lifetime' ||
        !identity ||
        identity.appId !== this.config.get<string>('app.wechatAppId') ||
        identity.openId !== tx.openId ||
        tx.env !== 0 ||
        tx.amount !== order.amount ||
        order.amount !== 990 ||
        order.currency !== 'CNY' ||
        !/^[A-Za-z0-9_-]{1,64}$/.test(tx.wxOrderId || '') ||
        !Number.isFinite(Date.parse(tx.paidAt)) ||
        (tx.productId !== undefined &&
          tx.productId !== this.virtualPay?.settings.productId) ||
        (tx.quantity !== undefined && tx.quantity !== 1)
      )
        throw new ConflictException('虚拟支付订单信息不匹配');
      if (order.transactionId && order.transactionId !== tx.wxOrderId)
        throw new ConflictException('平台交易号不匹配');
      if (order.status === 'refunded' || order.status === 'paid') return order;
      if (order.status !== 'pending') throw new ConflictException('订单已结束');
      order.transactionId = tx.wxOrderId;
      order.status = 'paid';
      order.paidAt = tx.paidAt;
      order.updatedAt = new Date().toISOString();
      await repo.saveMembershipOrder(order);
      const membership = await repo.findMembership(order.userId);
      if (membership?.status !== 'active')
        await repo.saveMembership({
          userId: order.userId,
          status: 'active',
          plan: 'member',
          startedAt: tx.paidAt,
          source: 'virtual',
          sourceOrderId: order.id,
        });
      return order;
    });
  }
  private async markDelivered(userId: string, id: string) {
    return this.repository.transactionForUser(userId, async (repo) => {
      const order = (await repo.findMembershipOrder(userId, id))!;
      if (order.status === 'paid' && !order.deliveryConfirmedAt) {
        order.deliveryConfirmedAt = order.updatedAt = new Date().toISOString();
        await repo.saveMembershipOrder(order);
      }
      return order;
    });
  }
  async refundVirtual(
    tx: Pick<VirtualTransaction, 'orderId' | 'wxOrderId' | 'openId'>,
    amount: number,
  ) {
    const existing = await this.repository.findMembershipOrderById(tx.orderId);
    if (!existing) throw new NotFoundException('没有找到此订单');
    return this.repository.transactionForUser(existing.userId, async (repo) => {
      const order = (await repo.findMembershipOrder(
        existing.userId,
        tx.orderId,
      ))!;
      const identity = await repo.findWechatIdentity(existing.userId);
      if (
        order.channel !== 'virtual' ||
        identity?.openId !== tx.openId ||
        !/^[A-Za-z0-9_-]{1,64}$/.test(tx.wxOrderId || '') ||
        (order.transactionId && order.transactionId !== tx.wxOrderId) ||
        !Number.isInteger(amount) ||
        amount <= 0 ||
        amount > order.amount
      )
        throw new ConflictException('退款订单信息不匹配');
      // A partial refund keeps permanent entitlement; full refund revokes only this order's grant.
      if (amount < order.amount) return order;
      order.status = 'refunded';
      order.transactionId = tx.wxOrderId;
      order.updatedAt = new Date().toISOString();
      await repo.saveMembershipOrder(order);
      const membership = await repo.findMembership(order.userId);
      if (
        membership?.source === 'virtual' &&
        membership.sourceOrderId === order.id
      )
        await repo.saveMembership({
          userId: order.userId,
          status: 'free',
          plan: 'free',
          startedAt: null,
          source: 'virtual',
          sourceOrderId: null,
        });
      return order;
    });
  }
  async notify(query: Record<string, string>, raw: string) {
    if (!this.virtualPay) throw new ForbiddenException('虚拟支付暂未开放');
    const { event, format } = this.virtualPay.notification(query, raw);
    if (event.MsgType !== 'event')
      throw new ConflictException('推送类型不匹配');
    if (event.Event === 'xpay_goods_deliver_notify') {
      const goods = event.GoodsInfo;
      const existing = await this.repository.findMembershipOrderById(
        String(event.OutTradeNo),
      );
      if (
        !existing ||
        !goods ||
        Number(event.Env) !== 0 ||
        goods.ProductId !== this.virtualPay.settings.productId ||
        Number(goods.Quantity) !== 1 ||
        Number(goods.OrigPrice) !== existing.amount
      )
        throw new ConflictException('发货商品信息不匹配');
      let tx: VirtualTransaction;
      if (event.WeChatPayInfo?.MchOrderNo) {
        const paidTime = Number(event.WeChatPayInfo.PaidTime);
        if (!Number.isFinite(paidTime) || paidTime <= 0)
          throw new ConflictException('支付时间不匹配');
        tx = {
          orderId: existing.id,
          wxOrderId: event.WeChatPayInfo.MchOrderNo,
          openId: event.OpenId,
          amount: Number(goods.OrigPrice),
          paidAt: new Date(paidTime * 1000).toISOString(),
          env: Number(event.Env),
          productId: goods.ProductId,
          quantity: Number(goods.Quantity),
        };
      } else {
        const identity = await this.repository.findWechatIdentity(
          existing.userId,
        );
        if (!identity || identity.openId !== event.OpenId)
          throw new ConflictException('支付账号不匹配');
        const result = await this.virtualPay.query(existing, identity.openId);
        if (!result || !['paid', 'refunded'].includes(result.state))
          throw new ConflictException('支付尚未确认');
        if (result.state === 'refunded')
          await this.refundVirtual(result.transaction, result.refundFee);
        tx = result.transaction;
      }
      await this.confirmVirtualPayment(tx);
      await this.markDelivered(existing.userId, existing.id);
    } else if (event.Event === 'xpay_refund_notify') {
      if (Number(event.RetCode) === 0)
        await this.refundVirtual(
          {
            orderId: event.MchOrderId,
            wxOrderId: event.WxOrderId,
            openId: event.OpenId,
          },
          Number(event.RefundFee),
        );
    } else throw new ConflictException('暂不支持此支付推送事件');
    return this.virtualPay.reply(
      { ErrCode: 0, ErrMsg: 'success' },
      query.nonce,
      format,
    );
  }
}
