import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppConfig } from '../config/app-config.type';
import { Public } from '../auth/auth.decorators';

@ApiTags('Health')
@Controller({ path: 'health', version: '1' })
export class HealthController {
  constructor(private readonly config: ConfigService<{ app: AppConfig }>) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Check that the mock subscription API is running' })
  @ApiOkResponse({ description: 'Health status' })
  get() {
    const persistenceDriver = this.config.get('app.persistenceDriver', {
      infer: true,
    });
    return {
      status: 'ok',
      service: 'subscription-api',
      mode: persistenceDriver,
      database: persistenceDriver === 'prisma' ? 'configured' : 'schema-ready',
      timestamp: new Date().toISOString(),
    };
  }
}
