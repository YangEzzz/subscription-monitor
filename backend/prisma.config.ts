import 'dotenv/config';
import { defineConfig } from 'prisma/config';

const offlineUrl = 'postgresql://postgres:postgres@localhost:5432/subscription_monitor';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // Schema validation and client generation work before a database exists.
    url: process.env.DATABASE_URL || offlineUrl,
  },
});
