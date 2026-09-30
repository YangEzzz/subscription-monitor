import { ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUserId } from '../auth/auth.decorators';
import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';

@ApiBearerAuth()
@ApiTags('Reminders')
@Controller({ path: 'reminders', version: '1' })
export class RemindersController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get()
  @ApiOperation({ summary: 'List overdue and upcoming billing reminders' })
  @ApiQuery({ name: 'days', required: false, example: 30, type: Number })
  @ApiOkResponse({ description: 'Reminder list' })
  list(@CurrentUserId() userId: string, @Query('days') days?: string) {
    return this.subscriptionsService.reminders(
      userId,
      days ? Number(days) : undefined,
    );
  }
}
