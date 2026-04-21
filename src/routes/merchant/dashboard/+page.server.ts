import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { promotions, merchants, likes, comments } from '$lib/server/db/schema';
import { eq, sql } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
  const user = event.locals.user as any; // Bypass user type check
  if (!user ) {
    throw error(401, 'Não autorizado');
  }

  const [merchant] = await db
    .select()
    .from(merchants)
    .where(eq(merchants.userId, user.id))
    .limit(1);

  if (!merchant) throw error(404, 'Perfil não encontrado');

  const rawPromos = await db
    .select({
      id: promotions.id,
      title: promotions.title,
      status: promotions.status,
      endDate: promotions.endDate,
      paymentMethods: promotions.paymentMethods,
      imageUrls: promotions.imageUrls,
      likeCount: sql<number>`count(distinct ${likes.id})`.mapWith(Number),
      commentCount: sql<number>`count(distinct ${comments.id})`.mapWith(Number),
    })
    .from(promotions)
    .leftJoin(likes, eq(likes.promotionId, promotions.id))
    .leftJoin(comments, eq(comments.promotionId, promotions.id))
    .where(eq(promotions.merchantId, merchant.id))
    .groupBy(promotions.id)
    .orderBy(sql`${promotions.createdAt} desc`);

  return {
    merchant: merchant as any,
    promotions: rawPromos as any[] // Force array type to stop UI redlines
  };
};