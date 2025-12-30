import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";
import { config } from "dotenv";

// Load environment variables
config();

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Check if using local database (no SSL needed) or cloud (SSL required)
const isLocalDb = process.env.DATABASE_URL.includes('localhost') || 
                  process.env.DATABASE_URL.includes('127.0.0.1') ||
                  process.env.DATABASE_URL.includes('@postgres:') ||
                  process.env.DOCKER_ENV === 'true';

console.log('🔵 Database configuration:', {
  url: process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@'),
  isLocalDb,
  ssl: isLocalDb ? false : 'enabled'
});

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: isLocalDb ? false : { rejectUnauthorized: false }
});

// Test connection on startup
pool.query('SELECT NOW()')
  .then(() => console.log('✅ Database connection successful'))
  .catch((err) => console.error('❌ Database connection failed:', err.message));

export const db = drizzle(pool, { schema });
