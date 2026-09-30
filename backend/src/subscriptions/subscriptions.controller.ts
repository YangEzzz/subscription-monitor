import { ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUserId } from '../auth/auth.decorators';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { QuerySubscriptionDto } from './dto/query-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { RenewSubscriptionDto } from './dto/renew-subscription.dto';
import { SubscriptionsService } from './subscriptions.service';

@ApiBearerAuth()
@ApiTags('Subscriptions')
@Controller({ path: 'subscriptions', version: '1' })
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get()
  @ApiOperation({ summary: 'List subscriptions with filtering and pagination' })
  @ApiOkResponse({ description: 'Paged subscription list' })
  list(@CurrentUserId() userId: string, @Query() query: QuerySubscriptionDto) {
    return this.subscriptionsService.list(userId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one subscription' })
  @ApiOkResponse({ description: 'Subscription detail' })
  findOne(@CurrentUserId() userId: string, @Param('id') id: string) {
    return this.subscriptionsService.findOne(userId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a subscription' })
  @ApiCreatedResponse({ description: 'Created subscription' })
  create(@CurrentUserId() userId: string, @Body() body: CreateSubscriptionDto) {
    return this.subscriptionsService.create(userId, body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a subscription' })
  @ApiOkResponse({ description: 'Updated subscription' })
  update(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
    @Body() body: UpdateSubscriptionDto,
  ) {
    return this.subscriptionsService.update(userId, id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft-delete a subscription' })
  @ApiOkResponse({
    description: 'Deleted subscription, recoverable with restore',
  })
  remove(@CurrentUserId() userId: string, @Param('id') id: string) {
    return this.subscriptionsService.remove(userId, id);
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore a soft-deleted subscription' })
  @ApiOkResponse({ description: 'Restored subscription' })
  restore(@CurrentUserId() userId: string, @Param('id') id: string) {
    return this.subscriptionsService.restore(userId, id);
  }

  @Post(':id/renew')
  @ApiOperation({ summary: 'Advance the next billing date by one cycle' })
  @ApiOkResponse({ description: 'Renewal event and updated subscription' })
  renew(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
    @Body() body: RenewSubscriptionDto,
  ) {
    return this.subscriptionsService.renew(userId, id, body?.billingDate);
  }

  @Post(':id/undo-renewal')
  @ApiOperation({ summary: 'Undo the most recent renewal within ten minutes' })
  @ApiOkResponse({
    description: 'Subscription restored to its pre-renewal date',
  })
  undoRenewal(@CurrentUserId() userId: string, @Param('id') id: string) {
    return this.subscriptionsService.undoRenewal(userId, id);
  }
}
