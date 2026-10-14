import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes, randomUUID } from 'node:crypto';
import { WechatPayService, WechatTransaction } from './wechat-pay.service';
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
export class MembershipPaymentsService {
  constructor(
    private readonly config: ConfigService,
    @Inject(SUBSCRIPTIONS_REPOSITORY)
    private readonly repository: SubscriptionsRepository,
    private readonly wechatPay?: WechatPayService,
  ) {}

  product() {
    const realPayment =
      this.config.get<boolean>('app.wechatPay.enabled') === true;
    return {
      id: 'lifetime',
      name: '永久会员',
      amount: 2990,
      currency: 'CNY',
      lifetime: true,
      channel: realPayment ? 'wechat' : 'simulation',
      available:
        realPayment ||
        this.config.get<boolean>('app.membershipSimulationEnabled') === true,
      notice: realPayment
        ? '一次支付 ¥29.90，开通永久会员，不会自动续费。'
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
    if (this.wechatPay?.settings.enabled) {
      const pending = (await this.repository.listMembershipOrders(userId)).find(
        (order) => order.channel === 'wechat' && order.status === 'pending',
      );
      if (pending) await this.detail(userId, pending.id);
    }
    const orders = await this.repository.listMembershipOrders(userId);
    return { items: orders.slice(0, 50) };
  }

  async detail(userId: string, id: string) {
    const order = await this.repository.findMembershipOrder(userId, id);
    if (!order) throw new NotFoundException('没有找到此订单');
    if (
      order.channel === 'wechat' &&
      order.status === 'pending' &&
      this.wechatPay?.settings.enabled
    ) {
      const result = await this.wechatPay.query(id);
      if (result?.trade_state === 'SUCCESS')
        return this.confirmWechatPayment(result);
      if (
        result &&
        ['CLOSED', 'REVOKED', 'PAYERROR'].includes(result.trade_state)
      ) {
        return this.repository.transactionForUser(
          userId,
          async (repository) => {
            const current = (await repository.findMembershipOrder(userId, id))!;
            if (current.status === 'pending') {
              current.status =
                result.trade_state === 'PAYERROR' ? 'failed' : 'cancelled';
              current.updatedAt = new Date().toISOString();
              await repository.saveMembershipOrder(current);
            }
            return current;
          },
        );
      }
    }
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
          product.channel === 'wechat'
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
        order.amount !== 2990 ||
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
      this.config.get<boolean>('app.wechatPay.enabled') === true
    )
      throw new ForbiddenException('模拟支付暂未开放');
  }

  async payment(userId: string, id: string) {
    if (!this.wechatPay) throw new ForbiddenException('微信支付暂未开放');
    this.wechatPay.assertEnabled();
    const order = await this.detail(userId, id);
    if (order.channel !== 'wechat')
      throw new ConflictException('该订单不是微信支付订单');
    if (order.status === 'paid') return { order, payment: null };
    if (order.status !== 'pending')
      throw new ConflictException('订单已结束，请重新创建订单');
    return this.repository.transactionForUser(userId, async (repository) => {
      const current = (await repository.findMembershipOrder(userId, id))!;
      if (current.status === 'paid') return { order: current, payment: null };
      if (current.status !== 'pending')
        throw new ConflictException('订单已结束，请刷新订单');
      if ((await repository.findMembership(userId))?.status === 'active')
        throw new ConflictException('当前账号已开通会员，无需重复购买');
      const identity = await repository.findWechatIdentity(userId);
      if (
        !identity ||
        identity.appId !== this.config.get<string>('app.wechatAppId')
      )
        throw new ForbiddenException('请重新微信登录后再支付');
      if (Date.parse(current.createdAt) + 2 * 60 * 60 * 1000 <= Date.now()) {
        // Close at the gateway before allowing a replacement order.
        if (await this.wechatPay!.query(id)) await this.wechatPay!.close(id);
        current.status = 'cancelled';
        current.updatedAt = new Date().toISOString();
        await repository.saveMembershipOrder(current);
        return { order: current, payment: null };
      }
      return {
        order: current,
        payment: await this.wechatPay!.prepay(current, identity.openId),
      };
    });
  }

  async notify(headers: Headers, rawBody: Buffer) {
    if (!this.wechatPay) throw new ForbiddenException('微信支付暂未开放');
    const transaction = this.wechatPay.notification(headers, rawBody);
    await this.confirmWechatPayment(transaction);
  }

  async confirmWechatPayment(transaction: WechatTransaction) {
    const existing = await this.repository.findMembershipOrderById(
      transaction.out_trade_no,
    );
    if (!existing) throw new NotFoundException('没有找到此订单');
    return this.repository.transactionForUser(
      existing.userId,
      async (repository) => {
        const order = (await repository.findMembershipOrder(
          existing.userId,
          existing.id,
        ))!;
        const identity = await repository.findWechatIdentity(existing.userId);
        if (
          order.channel !== 'wechat' ||
          order.productId !== 'lifetime' ||
          transaction.trade_state !== 'SUCCESS' ||
          transaction.appid !== this.config.get<string>('app.wechatAppId') ||
          transaction.mchid !== this.wechatPay?.settings.mchId ||
          !identity ||
          identity.appId !== transaction.appid ||
          transaction.payer?.openid !== identity.openId ||
          transaction.amount?.total !== order.amount ||
          transaction.amount?.currency !== order.currency ||
          order.amount !== 2990 ||
          order.currency !== 'CNY' ||
          !/^\d{1,64}$/.test(transaction.transaction_id || '') ||
          !transaction.success_time ||
          !Number.isFinite(Date.parse(transaction.success_time))
        )
          throw new ConflictException('微信支付订单信息不匹配');
        if (order.status === 'paid') {
          if (order.transactionId !== transaction.transaction_id)
            throw new ConflictException('微信支付交易号不匹配');
          return order;
        }
        if (order.status !== 'pending')
          throw new ConflictException('订单已结束');
        order.status = 'paid';
        order.transactionId = transaction.transaction_id;
        order.paidAt = new Date(transaction.success_time).toISOString();
        order.updatedAt = new Date().toISOString();
        await repository.saveMembershipOrder(order);
        await repository.saveMembership({
          userId: order.userId,
          status: 'active',
          plan: 'member',
          startedAt: order.paidAt,
          source: 'wechat',
          sourceOrderId: order.id,
        });
        return order;
      },
    );
  }
}
