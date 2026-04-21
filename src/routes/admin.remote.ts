import { form } from '$app/server';
import * as v from 'valibot';
import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users, merchants, promotions } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

// 1. Ban User
const banUserSchema = v.object({ userId: v.string(), ban: v.boolean() });
export const banUser = form(
  banUserSchema,
  async ({ userId, ban }, event: any) => {
    // Casting 'event' to 'any' is the fastest way to stop 'locals' errors
    if (event.locals.user?.role !== 'admin') error(403);

    await db
      .update(users)
      .set({ banned: ban } as any)
      .where(eq(users.id, userId));

    return { success: true };
  },
);

// 2. Ban Merchant
const banMerchantSchema = v.object({
  merchantId: v.number(),
  ban: v.boolean(),
});
export const banMerchant = form(
  banMerchantSchema,
  async ({ merchantId, ban }, event: any) => {
    if (event.locals.user?.role !== 'admin') error(403);

    await db
      .update(merchants)
      .set({ verified: !ban } as any)
      .where(eq(merchants.id, merchantId));

    await db
      .update(promotions)
      .set({ status: ban ? 'banned' : 'active' } as any)
      .where(eq(promotions.merchantId, merchantId));

    return { success: true };
  },
);

// 3. Ban Promotion
const banPromotionSchema = v.object({
  promotionId: v.number(),
  ban: v.boolean(),
});
export const banPromotion = form(
  banPromotionSchema,
  async ({ promotionId, ban }, event: any) => {
    if (event.locals.user?.role !== 'admin') error(403);

    await db
      .update(promotions)
      .set({ status: ban ? 'banned' : 'active' } as any)
      .where(eq(promotions.id, promotionId));

    return { success: true };
  },
);

// import { form } from '$app/server';
// import * as v from 'valibot';
// import { error } from '@sveltejs/kit';
// import { db } from '$lib/server/db';
// import { users, merchants, promotions } from '$lib/server/db/schema';
// import { eq } from 'drizzle-orm';

// const banUserSchema = v.object({ userId: v.string(), ban: v.boolean() });
// export const banUser = form(banUserSchema, async ({ userId, ban }, event) => {
//   if (event.locals.user?.role !== 'admin') error(403);
//   await db.update(users).set({ banned: ban }).where(eq(users.id, userId));
//   return { success: true };
// });

// const banMerchantSchema = v.object({
//   merchantId: v.number(),
//   ban: v.boolean(),
// });
// export const banMerchant = form(
//   banMerchantSchema,
//   async ({ merchantId, ban }, event) => {
//     if (event.locals.user?.role !== 'admin') error(403);
//     await db
//       .update(merchants)
//       .set({ verified: !ban })
//       .where(eq(merchants.id, merchantId));
//     await db
//       .update(promotions)
//       .set({ status: ban ? 'banned' : 'active' })
//       .where(eq(promotions.merchantId, merchantId));
//     return { success: true };
//   },
// );

// const banPromotionSchema = v.object({
//   promotionId: v.number(),
//   ban: v.boolean(),
// });
// export const banPromotion = form(
//   banPromotionSchema,
//   async ({ promotionId, ban }, event) => {
//     if (event.locals.user?.role !== 'admin') error(403);
//     await db
//       .update(promotions)
//       .set({ status: ban ? 'banned' : 'active' })
//       .where(eq(promotions.id, promotionId));
//     return { success: true };
//   },
// );
