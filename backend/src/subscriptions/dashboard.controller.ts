import { Controller, Get, Headers, Query } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { StatsQueryDto } from './dto/stats-query.dto';
import { SubscriptionsService } from './subscriptions.service';

@ApiTags('Dashboard')
@Controller({ path: 'dashboard', version: '1' })
export class DashboardController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get spending totals, category mix, and six-month trend' })
  @ApiOkResponse({ description: 'Dashboard statistics' })
  stats(
    @Headers('x-demo-user-id') userId: string | undefined,
    @Query() query: StatsQueryDto,
  ) {
    return this.subscriptionsService.stats(userId, query);
  }
}
