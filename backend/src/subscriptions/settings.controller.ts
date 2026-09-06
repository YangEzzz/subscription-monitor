import { Body, Controller, Get, Headers, Patch } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { SubscriptionsService } from './subscriptions.service';

@ApiTags('Settings')
@Controller({ path: 'settings', version: '1' })
export class SettingsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get()
  @ApiOperation({ summary: 'Get reminder and display settings' })
  @ApiOkResponse({ description: 'User settings' })
  get(@Headers('x-demo-user-id') userId: string | undefined) {
    return this.subscriptionsService.getSettings(userId);
  }

  @Patch()
  @ApiOperation({ summary: 'Update reminder and display settings' })
  @ApiOkResponse({ description: 'Updated user settings' })
  update(
    @Headers('x-demo-user-id') userId: string | undefined,
    @Body() body: UpdateSettingsDto,
  ) {
    return this.subscriptionsService.updateSettings(userId, body);
  }
}
