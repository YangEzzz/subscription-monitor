import { registerAs } from '@nestjs/config';
import { AppConfig } from './app-config.type';
import validateConfig from '.././utils/validate-config';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
} from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

enum PersistenceDriver {
  Memory = 'memory',
  Prisma = 'prisma',
}

class EnvironmentVariablesValidator {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment;

  @IsInt()
  @Min(0)
  @Max(65535)
  @IsOptional()
  APP_PORT: number;

  @IsUrl({ require_tld: false })
  @IsOptional()
  FRONTEND_DOMAIN: string;

  @IsUrl({ require_tld: false })
  @IsOptional()
  BACKEND_DOMAIN: string;

  @IsString()
  @IsOptional()
  API_PREFIX: string;

  @IsString()
  @IsOptional()
  APP_FALLBACK_LANGUAGE: string;

  @IsString()
  @IsOptional()
  APP_HEADER_LANGUAGE: string;

  @IsString()
  @IsOptional()
  DATABASE_URL: string;

  @IsEnum(PersistenceDriver)
  @IsOptional()
  PERSISTENCE_DRIVER: PersistenceDriver;
}

export default registerAs<AppConfig>('app', () => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  const persistenceDriver =
    (process.env.PERSISTENCE_DRIVER as PersistenceDriver | undefined) ??
    PersistenceDriver.Memory;
  if (
    process.env.NODE_ENV === 'production' &&
    persistenceDriver !== PersistenceDriver.Prisma
  ) {
    throw new Error('Production requires PERSISTENCE_DRIVER=prisma');
  }
  if (
    persistenceDriver === PersistenceDriver.Prisma &&
    !process.env.DATABASE_URL
  ) {
    throw new Error(
      'DATABASE_URL is required when PERSISTENCE_DRIVER is set to prisma',
    );
  }

  const authTokenTtlSeconds = Number(
    process.env.AUTH_TOKEN_TTL_SECONDS || 604800,
  );
  if (
    !Number.isInteger(authTokenTtlSeconds) ||
    authTokenTtlSeconds < 60 ||
    authTokenTtlSeconds > 2592000
  ) {
    throw new Error('AUTH_TOKEN_TTL_SECONDS must be between 60 and 2592000');
  }
  if (
    process.env.NODE_ENV === 'production' &&
    (!process.env.WECHAT_APP_ID ||
      !process.env.WECHAT_APP_SECRET ||
      Buffer.byteLength(process.env.AUTH_TOKEN_SECRET || '') < 32)
  ) {
    throw new Error(
      'Production requires WECHAT_APP_ID, WECHAT_APP_SECRET and AUTH_TOKEN_SECRET (at least 32 bytes)',
    );
  }

  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    name: process.env.APP_NAME || 'app',
    workingDirectory: process.env.PWD || process.cwd(),
    frontendDomain: process.env.FRONTEND_DOMAIN,
    backendDomain: process.env.BACKEND_DOMAIN ?? 'http://localhost',
    port: process.env.APP_PORT
      ? parseInt(process.env.APP_PORT, 10)
      : process.env.PORT
        ? parseInt(process.env.PORT, 10)
        : 3001,
    apiPrefix: process.env.API_PREFIX || 'api',
    fallbackLanguage: process.env.APP_FALLBACK_LANGUAGE || 'en',
    headerLanguage: process.env.APP_HEADER_LANGUAGE || 'x-custom-lang',
    databaseUrl: process.env.DATABASE_URL,
    persistenceDriver,
    wechatAppId: process.env.WECHAT_APP_ID,
    wechatAppSecret: process.env.WECHAT_APP_SECRET,
    authTokenSecret: process.env.AUTH_TOKEN_SECRET,
    authTokenTtlSeconds,
    wechatReminderTemplateId: process.env.WECHAT_REMINDER_TEMPLATE_ID,
    wechatSubscriptionType:
      process.env.WECHAT_SUBSCRIPTION_TYPE === 'long_term'
        ? 'long_term'
        : 'once',
    wechatMessageState: ['formal', 'developer', 'trial'].includes(
      process.env.WECHAT_MESSAGE_STATE || 'formal',
    )
      ? ((process.env.WECHAT_MESSAGE_STATE || 'formal') as
          | 'formal'
          | 'developer'
          | 'trial')
      : 'formal',
    notificationSchedulerEnabled:
      process.env.NOTIFICATION_SCHEDULER_ENABLED !== 'false',
    membershipSimulationEnabled:
      process.env.MEMBERSHIP_SIMULATION_ENABLED === 'true',
  };
});
