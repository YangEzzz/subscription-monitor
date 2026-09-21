import { AppConfig } from '../config/app-config.type';
import { MemorySubscriptionsRepository } from './repositories/memory-subscriptions.repository';
import { PrismaSubscriptionsRepository } from './repositories/prisma-subscriptions.repository';
import { createSubscriptionsRepository } from './subscriptions.module';

function config(overrides: Partial<AppConfig> = {}): AppConfig {
  return {
    nodeEnv: 'test',
    name: 'test',
    workingDirectory: process.cwd(),
    backendDomain: 'http://localhost',
    port: 3001,
    apiPrefix: 'api',
    fallbackLanguage: 'zh',
    headerLanguage: 'x-demo-user-id',
    persistenceDriver: 'memory',
    ...overrides,
  };
}

describe('SubscriptionsModule repository selection', () => {
  it('uses the seeded memory repository by default', async () => {
    const repository = createSubscriptionsRepository(config());

    expect(repository).toBeInstanceOf(MemorySubscriptionsRepository);
    expect(await repository.listSubscriptions('demo-user')).toHaveLength(9);
  });

  it('requires a database URL for the Prisma driver', () => {
    expect(() =>
      createSubscriptionsRepository(config({ persistenceDriver: 'prisma' })),
    ).toThrow(
      'DATABASE_URL is required when PERSISTENCE_DRIVER is set to prisma',
    );
  });

  it('constructs the Prisma repository without opening a connection', async () => {
    const repository = createSubscriptionsRepository(
      config({
        persistenceDriver: 'prisma',
        databaseUrl: 'postgresql://user:password@localhost:5432/test',
      }),
    );

    expect(repository).toBeInstanceOf(PrismaSubscriptionsRepository);
    await (repository as PrismaSubscriptionsRepository).onApplicationShutdown();
  });
});
