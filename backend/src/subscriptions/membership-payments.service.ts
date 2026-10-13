import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
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
  ) {}

  product() {
    return {
      id: 'lifetime',
      name: '永久会员',
      amount: 2990,
      currency: 'CNY',
      lifetime: true,
      channel: 'simulation',
      available:
        this.config.get<boolean>('app.membershipSimulationEnabled') === true,
      notice: '模拟支付，不会实际扣款；当前开通的权益为测试权益。',
    };
  }

  private assertEnabled() {
    if (!this.product().available)
      throw new ForbiddenException({
        code: 'MEMBERSHIP_PURCHASE_DISABLED',
        message: '模拟支付暂未开放',
      });
  }

  async list(userId: string) {
    const orders = await this.repository.listMembershipOrders(userId);
    return { items: orders.slice(0, 50) };
  }

  async detail(userId: string, id: string) {
    const order = await this.repository.findMembershipOrder(userId, id);
    if (!order) throw new NotFoundException('没有找到此订单');
    return order;
  }

  async create(userId: string, input: CreateMembershipOrderDto) {
    this.assertEnabled();
    return this.repository.transactionForUser(userId, async (repository) => {
      const orders = await repository.listMembershipOrders(userId);
      const repeated = orders.find(
        (order) => order.requestId === input.requestId,
      );
      if (repeated) return repeated;
      if ((await repository.findMembership(userId))?.status === 'active')
        throw new ConflictException({
          code: 'MEMBERSHIP_ALREADY_ACTIVE',
          message: '当前账号已开通会员，无需重复购买',
        });
      const pending = orders.find((order) => order.status === 'pending');
      if (pending) return pending;
      const product = this.product();
      const now = new Date().toISOString();
      const order: MembershipOrder = {
        id: 'mo_' + randomUUID(),
        userId,
        requestId: input.requestId,
        productId: product.id,
        productName: product.name,
        amount: product.amount,
        currency: product.currency,
        channel: 'simulation',
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
    this.assertEnabled();
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
    this.assertEnabled();
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
}
