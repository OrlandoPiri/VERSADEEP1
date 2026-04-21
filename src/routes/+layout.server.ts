import type { LayoutServerLoad } from './$types';
// This is a server-side function that runs before rendering the layout component.

export const load: LayoutServerLoad = async ({ locals }) => {
  return {
    user: locals.user, // If this is missing, page.data.user will be undefined
    session: locals.session,
  };
};
