// src/routes/promotions/[id]/like/+server.ts

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { likes } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

export const POST: RequestHandler = async ({ locals, params }) => {
  if (!locals.user) {
    error(401, 'Unauthorized');
  }

  const promotionId = Number(params.id);
  const userId = locals.user.id;

  // Check if already liked
  const existing = await db.query.likes.findFirst({
    where: and(eq(likes.promotionId, promotionId), eq(likes.userId, userId))
  });

  if (existing) {
    await db
      .delete(likes)
      .where(and(eq(likes.promotionId, promotionId), eq(likes.userId, userId)));
    return json({ liked: false });
  } else {
    await db.insert(likes).values({ promotionId, userId });
    return json({ liked: true });
  }
};
