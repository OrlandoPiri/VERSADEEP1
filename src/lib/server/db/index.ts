// import { Pool, neonConfig } from '@neondatabase/serverless';
// import { drizzle } from 'drizzle-orm/neon-serverless';
// import ws from 'ws';

// // This tells Neon to use the 'ws' package for WebSockets in Node.js
// neonConfig.webSocketConstructor = ws;

// const pool = new Pool({ connectionString: process.env.DATABASE_URL });
// export const db = drizzle(pool);

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { env } from '$env/dynamic/private';
import * as schema from './schema';

if (!env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

const sql = neon(env.DATABASE_URL);

// We pass the schema here so we can use "Relational Queries" (db.query.users.findFirst)
export const db = drizzle(sql, { schema });
