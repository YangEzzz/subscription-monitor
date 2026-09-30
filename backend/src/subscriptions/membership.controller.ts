import { ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUserId } from '../auth/auth.decorators';
import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';

@ApiBearerAuth()
@ApiTags('Membership')
@Controller({ path: 'membership', version: '1' })
export class MembershipController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get()
  @ApiOperation({ summary: 'Get account membership and quota status' })
  @ApiOkResponse({ description: 'Membership status and benefits' })
  get(@CurrentUserId() userId: string) {
    return this.subscriptionsService.getMembership(userId);
  }
}
