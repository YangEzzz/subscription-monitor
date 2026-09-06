import { Controller, Get } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Health')
@Controller({ path: 'health', version: '1' })
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Check that the mock subscription API is running' })
  @ApiOkResponse({ description: 'Health status' })
  get() {
    return {
      status: 'ok',
      service: 'subscription-api',
      mode: 'mock',
      database: 'not-connected',
      timestamp: new Date().toISOString(),
    };
  }
}
