// import { user } from '$lib/server/db/schema';
// src/routes/admin/+page.server.ts

import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { users as user } from '$lib/server/db/schema';
import { eq, ilike, or, sql, count } from 'drizzle-orm';

const PAGE_SIZE = 20;

// ✅ Type inferred directly from Drizzle schema — no manual maintenance
export type AdminUser = Pick<
  typeof user.$inferSelect,
  'id' | 'email' | 'phoneNumber' | 'name' | 'role' | 'banned' | 'bannedReason' | 'createdAt'
>;

export const load: PageServerLoad = async ({ locals, url }) => {
  // ✅ Server-side auth guard — never trust the client
  if (!locals.user || locals.user.role !== 'admin') {
    redirect(303, '/');
  }

  const page = Math.max(1, Number(url.searchParams.get('page') ?? '1'));
  const query = url.searchParams.get('q')?.trim() ?? '';
  const roleFilter = url.searchParams.get('role') ?? 'all';

  const conditions = [];

  if (query) {
    conditions.push(
      or(
        ilike(user.email, `%${query}%`),
        ilike(user.phoneNumber, `%${query}%`),
        ilike(user.name, `%${query}%`)
      )
    );
  }

  if (roleFilter === 'admin')  conditions.push(eq(user.role, 'admin'));
  if (roleFilter === 'user')   conditions.push(eq(user.role, 'user'));
  if (roleFilter === 'banned') conditions.push(eq(user.banned, true));

  const where = conditions.length > 0
    ? conditions.reduce((acc, c) => sql`${acc} AND ${c}`)
    : undefined;

  const [users, [{ total }]] = await Promise.all([
    db
      .select({
        id:           user.id,
        email:        user.email,
        phoneNumber:  user.phoneNumber,
        name:         user.name,
        role:         user.role,
        banned:       user.banned,
        bannedReason: user.bannedReason,
        createdAt:    user.createdAt,
      })
      .from(user)
      .where(where)
      .orderBy(user.createdAt)
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),

    db.select({ total: count() }).from(user).where(where),
  ]);

  return {
    users,
    total: Number(total),
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.ceil(Number(total) / PAGE_SIZE),
    query,
    roleFilter,
  };
};

export const actions: Actions = {
  toggleBan: async ({ locals, request }) => {
    // ✅ Re-validate on every action — never skip
    if (!locals.user || locals.user.role !== 'admin') {
      return fail(403, { error: 'Forbidden' });
    }

    const data = await request.formData();
    const userId = data.get('userId')?.toString();
    const ban = data.get('ban') === 'true';

    if (!userId) {
      return fail(400, { error: 'Missing userId' });
    }

    // ✅ Prevent self-ban
    if (userId === locals.user.id) {
      return fail(400, { error: 'You cannot ban yourself.' });
    }

    await db
      .update(user)
      .set({
        banned:       ban,
        bannedReason: ban ? 'Banned by admin' : null,
      })
      .where(eq(user.id, userId));

    return { success: true, banned: ban, userId };
  },
};