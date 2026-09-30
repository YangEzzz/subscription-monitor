import { ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUserId } from '../auth/auth.decorators';
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { MembershipPaymentsService } from './membership-payments.service';
import {
  CreateMembershipOrderDto,
  SimulateMembershipPaymentDto,
} from './dto/membership-order.dto';

@ApiBearerAuth()
@ApiTags('Membership')
@Controller({ path: 'membership', version: '1' })
export class MembershipController {
  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly payments: MembershipPaymentsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get account membership and quota status' })
  @ApiOkResponse({ description: 'Membership status and benefits' })
  async get(@CurrentUserId() userId: string) {
    const membership = await this.subscriptionsService.getMembership(userId);
    const product = this.payments.product();
    return {
      ...membership,
      lifetime: membership.status === 'active',
      product,
      benefits: {
        ...membership.benefits,
        membershipPurchaseAvailable:
          product.available && membership.status !== 'active',
      },
    };
  }

  @Get('orders')
  orders(@CurrentUserId() userId: string) {
    return this.payments.list(userId);
  }

  @Get('orders/:id')
  order(@CurrentUserId() userId: string, @Param('id') id: string) {
    return this.payments.detail(userId, id);
  }

  @Post('orders')
  create(
    @CurrentUserId() userId: string,
    @Body() input: CreateMembershipOrderDto,
  ) {
    return this.payments.create(userId, input);
  }

  @Post('orders/:id/simulate')
  simulate(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
    @Body() input: SimulateMembershipPaymentDto,
  ) {
    return this.payments.simulate(userId, id, input);
  }

  @Post('orders/:id/simulate-refund')
  refund(@CurrentUserId() userId: string, @Param('id') id: string) {
    return this.payments.simulateRefund(userId, id);
  }
}
