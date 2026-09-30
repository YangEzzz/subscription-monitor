import { ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUserId } from '../auth/auth.decorators';
import { Controller, Get, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';

@ApiBearerAuth()
@ApiTags('Membership')
@Controller({ path: 'membership', version: '1' })
export class MembershipController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get()
  @ApiOperation({ summary: 'Get local demo membership and quota status' })
  @ApiOkResponse({ description: 'Membership status and benefits' })
  get(@CurrentUserId() userId: string) {
    return this.subscriptionsService.getMembership(userId);
  }

  @Post('activate')
  @ApiOperation({ summary: 'Activate local demo membership without payment' })
  @ApiOkResponse({ description: 'Activated membership' })
  activate(@CurrentUserId() userId: string) {
    return this.subscriptionsService.activateMembership(userId);
  }

  @Post('restore')
  @ApiOperation({ summary: 'Restore the free local demo plan' })
  @ApiOkResponse({ description: 'Free membership restored' })
  restore(@CurrentUserId() userId: string) {
    return this.subscriptionsService.restoreMembership(userId);
  }
}
