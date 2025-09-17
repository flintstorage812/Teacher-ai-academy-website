import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

const dbPath = process.env.DB_PATH || './data/blog.sqlite3';
const dataDir = path.dirname(dbPath);

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Set DATABASE_URL for Prisma
process.env.DATABASE_URL = `file:${path.resolve(dbPath)}`;

try {
  console.log('🔄 Running Prisma migrations...');
  
  // Generate Prisma client
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  // Run migrations
  execSync('npx prisma db push', { stdio: 'inherit' });
  
  console.log('✅ Database migrations completed successfully');
} catch (error) {
  console.error('❌ Migration failed:', error);
  process.exit(1);
}
