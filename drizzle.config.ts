import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

// 1. Manually load .env because drizzle-kit runs outside of SvelteKit
dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is missing from your .env file');
}

export default defineConfig({
  // 2. The newer 'postgresql' dialect (replacing older 'pg' shorthand)
  dialect: 'postgresql',

  // 3. Explicit schema and output paths
  schema: './src/lib/server/db/schema.ts',
  out: './drizzle',

  dbCredentials: {
    url: process.env.DATABASE_URL,
  },

  // 4. Optimization for Neon
  // Tells Drizzle Kit to ignore roles/permissions managed by the Neon platform
  entities: {
    roles: {
      provider: 'neon',
    },
  },

  verbose: true,
  strict: true,
});

// import { defineConfig } from 'drizzle-kit';
// import * as dotenv from 'dotenv';

// // Load environment variables from the .env file
// dotenv.config();

// if (!process.env.DATABASE_URL) {
//   throw new Error('DATABASE_URL is not set in the .env file');
// }

// export default defineConfig({
//   schema: './src/lib/server/db/schema.ts', // Path to your schema
//   out: './drizzle', // Where migrations will be generated
//   dialect: 'postgresql',
//   dbCredentials: {
//     url: process.env.DATABASE_URL,
//   },
//   verbose: true,
//   strict: true,
// });

// import 'dotenv/config'; // eslint-disable-line
// import type { Config } from 'drizzle-kit';
// import * as dotenv from 'dotenv';

// dotenv.config();

// export default {
//   schema: './src/lib/server/db/schema.ts',
//   out: './migrations',
//   driver: 'pg',
//   dbCredentials: {
//     connectionString: process.env.DATABASE_URL!,
//   },
// } satisfies Config;
