import { Controller, Get } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';

@ApiTags('Catalog')
@Controller({ path: 'catalog', version: '1' })
export class CatalogController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get()
  @ApiOperation({ summary: 'Get supported categories, cycles, payment methods, and templates' })
  @ApiOkResponse({ description: 'Subscription form metadata' })
  get() {
    return this.subscriptionsService.catalog();
  }
}
