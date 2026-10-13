import { MembershipPaymentsService } from './membership-payments.service';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { AppConfig } from '../config/app-config.type';
import { PrismaClient } from '../generated/prisma/client';
import { CatalogController } from './catalog.controller';
import { DashboardController } from './dashboard.controller';
import { MembershipController } from './membership.controller';
import { RemindersController } from './reminders.controller';
import { SettingsController } from './settings.controller';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { MemorySubscriptionsRepository } from './repositories/memory-subscriptions.repository';
import { PrismaSubscriptionsRepository } from './repositories/prisma-subscriptions.repository';
import {
  SUBSCRIPTIONS_REPOSITORY,
  SubscriptionsRepository,
} from './repositories/subscriptions.repository';

export function createSubscriptionsRepository(
  config: AppConfig,
): SubscriptionsRepository {
  if (config.persistenceDriver === 'memory') {
    if (config.nodeEnv === 'production')
      throw new Error('Production requires PostgreSQL persistence');
    return new MemorySubscriptionsRepository();
  }
  if (!config.databaseUrl) {
    throw new Error(
      'DATABASE_URL is required when PERSISTENCE_DRIVER is set to prisma',
    );
  }

  const adapter = new PrismaPg({ connectionString: config.databaseUrl });
  const client = new PrismaClient({ adapter });
  return PrismaSubscriptionsRepository.create(client);
}

@Module({
  controllers: [
    SubscriptionsController,
    DashboardController,
    RemindersController,
    MembershipController,
    SettingsController,
    CatalogController,
  ],
  providers: [
    {
      provide: SUBSCRIPTIONS_REPOSITORY,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        createSubscriptionsRepository(
          configService.getOrThrow<AppConfig>('app'),
        ),
    },
    SubscriptionsService,
    MembershipPaymentsService,
  ],
  exports: [SubscriptionsService, SUBSCRIPTIONS_REPOSITORY],
})
export class SubscriptionsModule {}
