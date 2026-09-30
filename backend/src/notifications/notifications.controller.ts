import { Body, Controller, Get, Post } from '@nestjs/common';
import { IsIn, IsString, IsUUID, MaxLength } from 'class-validator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUserId } from '../auth/auth.decorators';
import { NotificationsService } from './notifications.service';
import { AuthorizationResult } from './notification.repository';

class AuthorizationDto {
  @IsUUID('4') requestId: string;
  @IsString() @MaxLength(128) templateId: string;
  @IsIn(['accept', 'reject', 'ban']) result: AuthorizationResult;
}
@ApiBearerAuth()
@ApiTags('Notifications')
@Controller({ path: 'notifications', version: '1' })
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}
  @Get() status(@CurrentUserId() userId: string) {
    return this.notifications.status(userId);
  }
  @Post('authorization') authorize(
    @CurrentUserId() userId: string,
    @Body() body: AuthorizationDto,
  ) {
    return this.notifications.authorize(
      userId,
      body.requestId,
      body.templateId,
      body.result,
    );
  }
}
