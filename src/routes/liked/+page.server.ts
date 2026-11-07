// src/routes/liked/+page.server.ts
//
// "Guardados": promotions the logged-in user has liked, most recently saved first.
// Expired promotions stay (marked in the UI); banned ones are hidden.
import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { likes, promotions, businesses } from '$lib/server/db/schema';
import { and, count, desc, eq, ne } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

const PAGE_SIZE = 24;

export const load: PageServerLoad = async ({ locals, url }) => {
  if (!locals.user) throw redirect(303, '/login');

  const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
  const where = and(eq(likes.userId, locals.user.id), ne(promotions.status, 'banned'));

  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        // Exactly the fields PromotionCard reads
        id: promotions.id,
        title: promotions.title,
        description: promotions.description,
        discountPercentage: promotions.discountPercentage,
        endDate: promotions.endDate,
        imageUrls: promotions.imageUrls,
        location: promotions.location,
        paymentMethods: promotions.paymentMethods,
        merchantId: promotions.merchantId,
        businessName: businesses.name,
        businessLogo: businesses.logoUrl
      })
      .from(likes)
      .innerJoin(promotions, eq(promotions.id, likes.promotionId))
      .leftJoin(businesses, eq(businesses.id, promotions.businessId))
      .where(where)
      .orderBy(desc(likes.createdAt), desc(likes.id))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),

    db
      .select({ total: count() })
      .from(likes)
      .innerJoin(promotions, eq(promotions.id, likes.promotionId))
      .where(where)
  ]);

  return {
    promotions: rows,
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE))
  };
};
