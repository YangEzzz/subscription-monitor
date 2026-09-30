import { ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUserId } from '../auth/auth.decorators';
import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { SubscriptionsService } from './subscriptions.service';

@ApiBearerAuth()
@ApiTags('Settings')
@Controller({ path: 'settings', version: '1' })
export class SettingsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get()
  @ApiOperation({ summary: 'Get reminder and display settings' })
  @ApiOkResponse({ description: 'User settings' })
  get(@CurrentUserId() userId: string) {
    return this.subscriptionsService.getSettings(userId);
  }

  @Patch()
  @ApiOperation({ summary: 'Update reminder and display settings' })
  @ApiOkResponse({ description: 'Updated user settings' })
  update(@CurrentUserId() userId: string, @Body() body: UpdateSettingsDto) {
    return this.subscriptionsService.updateSettings(userId, body);
  }
}
