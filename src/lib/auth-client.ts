import { createAuthClient } from 'better-auth/svelte';
import { phoneNumberClient } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
  baseURL: 'http://localhost:5173', // Hardcoding stops env-variable lookup issues
  plugins: [phoneNumberClient()],
});

// import { createAuthClient } from 'better-auth/svelte';
// import { phoneNumberClient } from 'better-auth/client/plugins';
// import * as v from 'valibot';

// export const authClient = createAuthClient({
//   baseURL: 'http://localhost:5173',
//   plugins: [phoneNumberClient()],
// });

// export const emailSchema = v.object({
//   email: v.pipe(v.string(), v.email()),
//   password: v.pipe(v.string(), v.minLength(6)),
// });

// export const phoneSchema = v.object({
//   phone: v.pipe(v.string(), v.minLength(9)),
//   password: v.pipe(v.string(), v.minLength(6)),
// });
