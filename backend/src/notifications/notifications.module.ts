import { Module } from '@nestjs/common';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { WechatMessagesService } from './wechat-messages.service';
@Module({
  imports: [SubscriptionsModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, WechatMessagesService],
})
export class NotificationsModule {}
