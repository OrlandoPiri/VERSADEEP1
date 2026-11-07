// src/routes/admin/+layout.server.ts
//
// Guards every route under /admin. This covers page access only: remote
// functions and commands (deletePromotion, updatePromotion, ...) are separate
// endpoints and enforce their own permissions in their handlers.
import { error, redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
  if (!locals.user) throw redirect(302, '/login');
  if (locals.user.role !== 'admin') {
    throw error(403, 'Acesso restrito a administradores.');
  }
  return {};
};
