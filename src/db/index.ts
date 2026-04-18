import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

let _db: PostgresJsDatabase<typeof schema> | undefined;

/** Use from Server Actions, Route Handlers, or `auth` callbacks — not in client components. */
export function getDb() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }
  if (!_db) {
    // Supabase pooler (transaction mode): prefer port 6543 URL + `prepare: false`
    const client = postgres(connectionString, { prepare: false, max: 1 });
    _db = drizzle(client, { schema });
  }
  return _db;
}

export * from './schema';
