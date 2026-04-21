import { auth } from '$lib/auth';
import type { Handle } from '@sveltejs/kit';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { building } from '$app/environment';

export const handle: Handle = async ({ event, resolve }) => {
  // 1. Bridge Origin Fix
  if (event.url.pathname.startsWith('/_app/remote')) {
    event.request.headers.set('origin', event.url.origin);
  }

  // 2. PRE-POPULATE LOCALS
  // We do this BEFORE the handler to ensure layout.server.ts always sees it
  const session = await auth.api.getSession({
    headers: event.request.headers,
  });

// We cast the user to our App.Locals['user'] type to satisfy the role check
  event.locals.user = (session?.user as App.Locals['user']) ?? null;
  event.locals.session = session?.session ?? null;

  // 3. Run the Better Auth Handler
  return svelteKitHandler({
    event,
    resolve, // Use the standard resolve here
    auth,
    building,
  });
};

// import { auth } from '$lib/auth';
// import type { Handle } from '@sveltejs/kit';
// import { svelteKitHandler } from 'better-auth/svelte-kit';
// import { building } from '$app/environment';

// export const handle: Handle = async ({ event, resolve }) => {
//   // If we are calling the bridge, satisfy the Origin check manually
//   if (event.url.pathname.startsWith('/_app/remote')) {
//     event.request.headers.set('origin', event.url.origin);
//   }

//   return svelteKitHandler({
//     event,
//     resolve: async (event) => {
//       // Populate locals so +layout.server.ts has data
//       const session = await auth.api.getSession({
//         headers: event.request.headers,
//       });

//       event.locals.user = session?.user ?? null;
//       event.locals.session = session?.session ?? null;

//       return resolve(event);
//     },
//     auth,
//     building,
//   });
// };

// import { auth } from '$lib/auth';
// import type { Handle } from '@sveltejs/kit';
// import { svelteKitHandler } from 'better-auth/svelte-kit';
// import { building } from '$app/environment';

// export const handle: Handle = async ({ event, resolve }) => {
//   // 1. MANUALLY INJECT ORIGIN
//   // This satisfies both SvelteKit and Better Auth for the Remote Bridge
//   if (event.url.pathname.startsWith('/_app/remote')) {
//     event.request.headers.set('origin', event.url.origin);
//     event.request.headers.set('x-forwarded-host', event.url.host);
//   }

//   return svelteKitHandler({
//     event,
//     resolve: async (event) => {
//       const session = await auth.api.getSession({
//         headers: event.request.headers,
//       });
//       event.locals.user = session?.user ?? null;
//       event.locals.session = session?.session ?? null;
//       return resolve(event);
//     },
//     auth,
//     building,
//   });
// };

// import { auth } from '$lib/auth';
// import type { Handle } from '@sveltejs/kit';

// export const handle: Handle = async ({ event, resolve }) => {
//   const session = await auth.api.getSession({
//     headers: event.request.headers,
//   });

//   // '?? null' converts 'undefined' to 'null' to match app.d.ts
//   event.locals.user = session?.user ?? null;
//   event.locals.session = session?.session ?? null;

//   return resolve(event);
// };

// src/hooks.server.ts
// import { auth } from '$lib/auth';
// import type { Handle } from '@sveltejs/kit';

// export const handle: Handle = async ({ event, resolve }) => {
//   // Instead of the svelteKitHandler wrapper, use the direct API:
//   const isAuthRoute = event.url.pathname.startsWith('/api/auth');

//   if (isAuthRoute) {
//     return auth.handler(event.request);
//   }

//   const session = await auth.api.getSession({
//     headers: event.request.headers,
//   });

//   event.locals.user = session?.user ?? null;
//   event.locals.session = session?.session ?? null;

//   return resolve(event);
// };

// import { auth } from '$lib/server/auth';
// import type { Handle } from '@sveltejs/kit';

// export const handle: Handle = async ({ event, resolve }) => {
//   const session = await auth.api.getSession({ headers: event.request.headers });
//   event.locals.user = session?.user;
//   event.locals.session = session?.session;
//   return resolve(event);
// };
