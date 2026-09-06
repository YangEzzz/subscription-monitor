import { Controller, Get, Headers, Post } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';

@ApiTags('Membership')
@Controller({ path: 'membership', version: '1' })
export class MembershipController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get()
  @ApiOperation({ summary: 'Get local demo membership and quota status' })
  @ApiOkResponse({ description: 'Membership status and benefits' })
  get(@Headers('x-demo-user-id') userId: string | undefined) {
    return this.subscriptionsService.getMembership(userId);
  }

  @Post('activate')
  @ApiOperation({ summary: 'Activate local demo membership without payment' })
  @ApiOkResponse({ description: 'Activated membership' })
  activate(@Headers('x-demo-user-id') userId: string | undefined) {
    return this.subscriptionsService.activateMembership(userId);
  }

  @Post('restore')
  @ApiOperation({ summary: 'Restore the free local demo plan' })
  @ApiOkResponse({ description: 'Free membership restored' })
  restore(@Headers('x-demo-user-id') userId: string | undefined) {
    return this.subscriptionsService.restoreMembership(userId);
  }
}
