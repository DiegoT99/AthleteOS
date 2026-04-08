import 'dotenv/config';
import ws from 'ws';
import { neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '@prisma/client';

neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is required to initialize Prisma');
}

const adapter = new PrismaNeon({ connectionString });

export const prisma = new PrismaClient({ adapter });
