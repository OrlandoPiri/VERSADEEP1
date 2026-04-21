import { command } from '$app/server';
import { authClient } from '$lib/auth-client';

export const signupWithEmail = command(
  'unchecked',
  async ({ e, p, n }: { e: string; p: string; n: string }) => {
    return await authClient.signUp.email({
      email: e,
      password: p,
      name: n,
      callbackURL: '/',
    });
  },
);

export const loginWithEmail = command(
  'unchecked',
  async ({ e, p }: { e: string; p: string }) => {
    return await authClient.signIn.email({
      email: e,
      password: p,
      callbackURL: '/',
    });
  },
);

export const signupWithPhone = command(
  'unchecked',
  async ({ ph, p, n }: { ph: string; p: string; n: string }) => {
    const client = authClient as any;
    return await client.signUp.phoneNumber({
      phoneNumber: ph,
      password: p,
      name: n,
    });
  },
);

export const loginWithPhone = command(
  'unchecked',
  async ({ ph, p }: { ph: string; p: string }) => {
    const client = authClient as any;
    return await client.signIn.phoneNumber({
      phoneNumber: ph,
      password: p,
    });
  },
);

export const logout = command(async () => {
  return await authClient.signOut();
});

export const verifyMerchantPassword = command(
  'unchecked',
  async ({ p }: { p: string }) => {
    try {
      const client = authClient as any;
      const result = await client.verifyPassword({
        password: p,
      });
      return { success: !!result, error: null };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },
);
// import { command } from '$app/server';
// import { authClient } from '$lib/auth-client';

// /**
//  * AUTHENTICATION COMMANDS
//  * All exports are wrapped in SvelteKit's 'command' helper.
//  * We use 'unchecked' to allow Better Auth to handle its own validation.
//  */

// export const signupWithEmail = command(
//   'unchecked',
//   async ({ e, p, n }: { e: string; p: string; n: string }) => {
//     return await authClient.signUp.email({
//       email: e,
//       password: p,
//       name: n,
//       callbackURL: '/',
//     });
//   },
// );

// export const loginWithEmail = command(
//   'unchecked',
//   async ({ e, p }: { e: string; p: string }) => {
//     return await authClient.signIn.email({
//       email: e,
//       password: p,
//       callbackURL: '/',
//     });
//   },
// );

// export const signupWithPhone = command(
//   'unchecked',
//   async ({ ph, p, n }: { ph: string; p: string; n: string }) => {
//     const client = authClient as any;
//     return await client.signUp.phoneNumber({
//       phoneNumber: ph,
//       password: p,
//       name: n,
//     });
//   },
// );

// export const loginWithPhone = command(
//   'unchecked',
//   async ({ ph, p }: { ph: string; p: string }) => {
//     const client = authClient as any;
//     return await client.signIn.phoneNumber({
//       phoneNumber: ph,
//       password: p,
//     });
//   },
// );
// // For logout, 'unchecked' is unnecessary because there are no inputs to check.
// export const logout = command(async () => {
//   return await authClient.signOut();
// });

// // For verification, we keep it because it receives the password string.
// export const verifyMerchantPassword = command(
//   'unchecked',
//   async ({ p }: { p: string }) => {
//     try {
//       const client = authClient as any;
//       const result = await client.verifyPassword({
//         password: p,
//       });
//       return { success: !!result, error: null };
//     } catch (e: any) {
//       return { success: false, error: e.message };
//     }
//   },
// );

// import { command } from '$app/server';
// import { authClient } from '$lib/auth-client';

// /**
//  * Beautifully encapsulated Auth actions
//  */
// const AuthActions = {
//   email: {
//     signup: (email: string, pass: string, name: string) =>
//       authClient.signUp.email({
//         email,
//         password: pass,
//         name,
//         callbackURL: '/',
//       }),

//     login: (email: string, pass: string) =>
//       authClient.signIn.email({ email, password: pass }),
//   },

//   phone: {
//     signup: (phone: string, pass: string, name: string) =>
//       (authClient.signUp as any).phoneNumber({
//         phoneNumber: phone,
//         password: pass,
//         name,
//       }),

//     login: (phone: string, pass: string) =>
//       (authClient.signIn as any).phoneNumber({
//         phoneNumber: phone,
//         password: pass,
//       }),
//   },

//   session: {
//     logout: () => authClient.signOut(),

//     verifyMerchant: async (password: string) => {
//       const session = (await authClient.getSession()) as any;

//       if (!session?.data?.user || session.data.user.role !== 'merchant') {
//         throw new Error('Acesso restrito: Apenas para parceiros.');
//       }

//       return await (authClient as any).verifyPassword({ password });
//     },
//   },
// };

// // We add 'unchecked' as the first argument to bypass schema validation
// export const signupWithEmail = command(
//   'unchecked',
//   async (data: { e: string; p: string; n: string }) => {
//     return await AuthActions.email.signup(data.e, data.p, data.n);
//   },
// );

// export const loginWithEmail = command(
//   'unchecked',
//   async (data: { e: string; p: string }) => {
//     return await AuthActions.email.login(data.e, data.p);
//   },
// );

// export const signupWithPhone = command(
//   'unchecked',
//   async (data: { ph: string; p: string; n: string }) => {
//     return await AuthActions.phone.signup(data.ph, data.p, data.n);
//   },
// );

// export const loginWithPhone = command(
//   'unchecked',
//   async (data: { ph: string; p: string }) => {
//     return await AuthActions.phone.login(data.ph, data.p);
//   },
// );

// // logout takes zero arguments, so it doesn't need 'unchecked'!
// export const logout = command(async () => {
//   return await AuthActions.session.logout();
// });

// export const verifyMerchantAction = command(
//   'unchecked',
//   async (data: { p: string }) => {
//     return await AuthActions.session.verifyMerchant(data.p);
//   },
// );

// import { form } from '$app/server';
// import * as v from 'valibot';
// import { error } from '@sveltejs/kit';
// import { db } from '$lib/server/db';
// import { users } from '$lib/server/db/schema';
// import { eq } from 'drizzle-orm';
// import { hash, verify } from '@node-rs/argon2';

// const emailSchema = v.object({
//   email: v.pipe(v.string(), v.email()),
//   password: v.pipe(v.string(), v.minLength(6))
// });

// const phoneSchema = v.object({
//   phone: v.pipe(v.string(), v.minLength(9)),
//   password: v.pipe(v.string(), v.minLength(6))
// });

// export const signupWithEmail = form(emailSchema, async (data, event) => {
//   const existing = await db.select().from(users).where(eq(users.email, data.email)).get();
//   if (existing) error(409, 'Email already registered');

//   const passwordHash = await hash(data.password);
//   const [user] = await db.insert(users).values({
//     id: crypto.randomUUID(),
//     email: data.email,
//     passwordHash,
//     role: 'user'
//   }).returning();

//   return user;
// });

// export const loginWithEmail = form(emailSchema, async (data, event) => {
//   const user = await db.select().from(users).where(eq(users.email, data.email)).get();
//   if (!user) error(401, 'Invalid credentials');

//   const valid = await verify(user.passwordHash, data.password);
//   if (!valid) error(401, 'Invalid credentials');

//   return user;
// });

// export const signupWithPhone = form(phoneSchema, async (data, event) => {
//   const existing = await db.select().from(users).where(eq(users.phoneNumber, data.phone)).get();
//   if (existing) error(409, 'Phone already registered');

//   const passwordHash = await hash(data.password);
//   const [user] = await db.insert(users).values({
//     id: crypto.randomUUID(),
//     phoneNumber: data.phone,
//     passwordHash,
//     role: 'user'
//   }).returning();

//   return user;
// });

// export const loginWithPhone = form(phoneSchema, async (data, event) => {
//   const user = await db.select().from(users).where(eq(users.phoneNumber, data.phone)).get();
//   if (!user) error(401, 'Invalid credentials');

//   const valid = await verify(user.passwordHash, data.password);
//   if (!valid) error(401, 'Invalid credentials');

//   return user;
// });

// export const verifyMerchantPassword = form(
//   v.object({ password: v.string() }),
//   async ({ password }, event) => {
//     const user = event.locals.user;
//     if (!user) error(401);
//     if (user.role !== 'merchant') error(403);

//     const dbUser = await db.select().from(users).where(eq(users.id, user.id)).get();
//     if (!dbUser) error(401);

//     const valid = await verify(dbUser.passwordHash, password);
//     if (!valid) error(401);

//     return { verified: true };
//   }
// );
