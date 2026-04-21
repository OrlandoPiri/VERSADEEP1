import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { phoneNumber } from 'better-auth/plugins'; // Only keep phoneNumber
import { db } from './server/db';
import * as schema from './server/db/schema';
import { env } from '$env/dynamic/private';

export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL || 'http://localhost:5173',
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),
  emailAndPassword: { enabled: true, autoSignIn: true },
  plugins: [phoneNumber()], // Remove svelteKit() from here
  user: {
    additionalFields: {
      role: { type: 'string', defaultValue: 'user' },
      phoneNumber: { type: 'string', required: false },
    },
  },
});

// import { betterAuth } from 'better-auth';
// import { drizzleAdapter } from 'better-auth/adapters/drizzle';
// import { phoneNumber } from 'better-auth/plugins';
// import { db } from './server/db';
// import * as schema from './server/db/schema';
// import { env } from '$env/dynamic/private';

// export const auth = betterAuth({
//   secret: env.BETTER_AUTH_SECRET,
//   baseURL: 'http://localhost:5173',
//   database: drizzleAdapter(db, {
//     provider: 'pg',
//     // schema: { ...schema },
//     schema: {
//       user: schema.users, // Ensure these match your schema.ts variable names
//       session: schema.sessions,
//       account: schema.accounts,
//       verification: schema.verifications,
//     },
//   }),
//   emailAndPassword: {
//     enabled: true,
//     autoSignIn: true,
//   },
//   plugins: [phoneNumber()],
//   user: {
//     additionalFields: {
//       role: { type: 'string', defaultValue: 'user' },
//       phoneNumber: { type: 'string', required: false },
//     },
//   },
//   // Fix: Remove crossOrigin and disableCheckOrigin if they aren't in your version's types.
//   // We will handle the "Missing Origin" error in hooks instead.
//   // advanced: {
//   //   // crossOrigin: true,
//   //   // disableCheckOrigin: true,
//   // },
//   // Advanced is empty to avoid Type errors; logic is moved to hooks
//   advanced: {
//     // We'll leave this empty to avoid property-name conflicts
//   },
// });

// src/lib/auth.ts
// import { betterAuth } from 'better-auth';
// import { drizzleAdapter } from 'better-auth/adapters/drizzle';
// import { db } from './server/db';
// import * as schema from './server/db/schema';
// import { env } from '$env/dynamic/private';

// export const auth = betterAuth({
//   secret: env.BETTER_AUTH_SECRET,
//   baseURL: env.BETTER_AUTH_URL,

//   database: drizzleAdapter(db, {
//     provider: 'pg',
//     schema: {
//       user: schema.users,
//       session: schema.sessions,
//       account: schema.accounts,
//       verification: schema.verifications,
//     },
//   }),

//   emailAndPassword: {
//     enabled: true,
//     autoSignIn: true,
//   },

//   // DELETE the old svelteKit() plugin line.
//   // In the latest version, if you are using the svelteKitHandler
//   // in hooks.server.ts, you often don't need a plugin here
//   // UNLESS you are using specific client-side features.
//   plugins: [],

//   user: {
//     additionalFields: {
//       role: { type: 'string', required: false, defaultValue: 'user' },
//       phoneNumber: { type: 'string', required: false },
//     },
//   },
// });

// import { betterAuth } from 'better-auth';
// import { drizzleAdapter } from 'better-auth/adapters/drizzle';
// import { db } from './db';
// import * as schema from './db/schema';
// import { env } from '$env/dynamic/private';

// export const auth = betterAuth({
//   database: drizzleAdapter(db, {
//     provider: 'pg',
//     schema: {
//       user: schema.users,
//     }
//   }),
//   secret: env.AUTH_SECRET,
//   baseURL: env.AUTH_BASE_URL,
//   emailAndPassword: {
//     enabled: true,
//   },
// });
