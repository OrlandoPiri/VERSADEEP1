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
    headers: event.request.headers
  });

  // A banned user is treated as signed out. This runs on every request, so a
  // ban takes effect immediately, even for sessions created before the ban.
  // (Requires `banned` to be declared in additionalFields in $lib/auth.)
  const isBanned = !!(session?.user as { banned?: boolean } | undefined)
    ?.banned;

  if (session && !isBanned) {
    // We cast the user to our App.Locals['user'] type to satisfy the role check
    event.locals.user = session.user as App.Locals['user'];
    event.locals.session = session.session;
  } else {
    event.locals.user = null;
    event.locals.session = null;
  }

  // 3. Run the Better Auth Handler
  return svelteKitHandler({
    event,
    resolve, // Use the standard resolve here
    auth,
    building
  });
};

// import { auth } from '$lib/auth';
// import type { Handle } from '@sveltejs/kit';
// import { svelteKitHandler } from 'better-auth/svelte-kit';
// import { building } from '$app/environment';

// export const handle: Handle = async ({ event, resolve }) => {
//   // 1. Bridge Origin Fix
//   if (event.url.pathname.startsWith('/_app/remote')) {
//     event.request.headers.set('origin', event.url.origin);
//   }

//   // 2. PRE-POPULATE LOCALS
//   // We do this BEFORE the handler to ensure layout.server.ts always sees it
//   const session = await auth.api.getSession({
//     headers: event.request.headers,
//   });

// // We cast the user to our App.Locals['user'] type to satisfy the role check
//   event.locals.user = (session?.user as App.Locals['user']) ?? null;
//   event.locals.session = session?.session ?? null;

//   // 3. Run the Better Auth Handler
//   return svelteKitHandler({
//     event,
//     resolve, // Use the standard resolve here
//     auth,
//     building,
//   });
// };
