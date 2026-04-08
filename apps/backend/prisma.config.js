import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { defineConfig } from 'prisma/config';

const require = createRequire(import.meta.url);
require('dotenv').config({ path: path.join(fileURLToPath(import.meta.url), '..', '.env') });

export default defineConfig({
  schema: path.join(fileURLToPath(import.meta.url), '..', 'prisma/schema.prisma'),
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
