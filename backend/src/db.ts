import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';

const dbPath = process.env.DB_PATH || './data/blog.sqlite3';

// Ensure data directory exists
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Create Prisma client with SQLite database
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: `file:${path.resolve(dbPath)}`,
    },
  },
});

// Test database connection
export async function connectDatabase() {
  try {
    await prisma.$connect();
    console.log(`✅ Database connected: ${path.resolve(dbPath)}`);
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

// Graceful shutdown
export async function disconnectDatabase() {
  await prisma.$disconnect();
}

export { prisma };
export default prisma;
