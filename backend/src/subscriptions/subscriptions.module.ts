import { Module } from '@nestjs/common';
import { CatalogController } from './catalog.controller';
import { DashboardController } from './dashboard.controller';
import { MembershipController } from './membership.controller';
import { RemindersController } from './reminders.controller';
import { SettingsController } from './settings.controller';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';

@Module({
  controllers: [
    SubscriptionsController,
    DashboardController,
    RemindersController,
    MembershipController,
    SettingsController,
    CatalogController,
  ],
  providers: [SubscriptionsService],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
