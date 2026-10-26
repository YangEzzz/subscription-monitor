import { ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUserId } from '../auth/auth.decorators';
import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { StatsQueryDto } from './dto/stats-query.dto';
import { HistoryQueryDto } from './dto/history-query.dto';
import { SubscriptionsService } from './subscriptions.service';

@ApiBearerAuth()
@ApiTags('Dashboard')
@Controller({ path: 'dashboard', version: '1' })
export class DashboardController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('history')
  @ApiOperation({
    summary: 'Get confirmed spending by billing month and original currency',
  })
  @ApiOkResponse({
    description:
      'Monthly recorded spending, categories, six-month trend and paginated entries',
  })
  history(@CurrentUserId() userId: string, @Query() query: HistoryQueryDto) {
    return this.subscriptionsService.history(userId, query);
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Get spending totals, category mix, and six-month trend',
  })
  @ApiOkResponse({ description: 'Dashboard statistics' })
  stats(@CurrentUserId() userId: string, @Query() query: StatsQueryDto) {
    return this.subscriptionsService.stats(userId, query);
  }
}
