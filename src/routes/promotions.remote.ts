import { query, form, prerender, getRequestEvent } from '$app/server';
import * as v from 'valibot';
import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { eq, and, desc, asc, sql, count as drizzleCount } from 'drizzle-orm';
import { promotions, likes, comments, merchants } from '$lib/server/db/schema';
import { v2 as cloudinary } from 'cloudinary';
import {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET
} from '$env/static/private';

// --- CLOUDINARY CONFIG ---
cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET
});

// --- SCHEMAS ---

const cursorSchema = v.object({
  featured: v.boolean(),
  verified: v.boolean(),
  endDate: v.string(),
  createdAt: v.string(),
  id: v.number()
});

const createPromotionSchema = v.object({
  // Merchant branding — used to upsert the merchant row
  merchantName: v.pipe(v.string(), v.nonEmpty('Nome do negócio é obrigatório')),
  merchantLogoUrl: v.optional(v.string()),

  // Core promotion fields
  title: v.pipe(v.string(), v.nonEmpty()),
  description: v.optional(v.string()),
  discountPercentage: v.optional(v.string()),
  startDate: v.string(),
  endDate: v.string(),
  openHours: v.optional(v.string()),
  locationAddress: v.optional(v.string()),
  contactPhone: v.optional(v.string()),
  contactWhatsapp: v.optional(v.string()),
  contactEmail: v.optional(v.string()),
  imageUrls: v.optional(v.string()),
  paymentMethods: v.optional(v.string()),
  terms: v.optional(v.string()),

  // Admin-only: override which merchant this belongs to
  merchantId: v.optional(v.string())
});

// --- UPLOAD SIGNATURE ---
// folder param must match what the client sends — signature is computed against it
export const getUploadSignature = query(
  v.object({ folder: v.optional(v.string(), 'promotions') }),
  async ({ folder }) => {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder },
      CLOUDINARY_API_SECRET
    );
    return {
      signature,
      timestamp,
      apiKey: CLOUDINARY_API_KEY,
      cloudName: CLOUDINARY_CLOUD_NAME,
      folder
    };
  }
);

// --- QUERIES ---

export const getPromoStats = prerender(async () => {
  const [result] = await db
    .select({ value: drizzleCount() })
    .from(promotions)
    .where(eq(promotions.status, 'active'));
  return {
    totalActive: result?.value ?? 0,
    lastUpdated: new Date().toISOString()
  };
});

/**
 * getPromotions — ranked feed
 *
 * Ranking order (descending priority):
 *   1. featured (sponsored/admin-boosted)
 *   2. verified (merchant posts)
 *   3. endDate  (soonest-expiring first — creates urgency)
 *   4. createdAt descending
 *   5. id descending (tiebreaker)
 *
 * Regular-user posts (verified=false) naturally sink below merchant posts
 * without any hard filtering — they're still visible, just ranked lower.
 */
export const getPromotions = query(v.optional(cursorSchema), async (cursor) => {
  let baseQuery = db
    .select({
      id: promotions.id,
      merchantId: promotions.merchantId,
      title: promotions.title,
      description: promotions.description,
      discountPercentage: promotions.discountPercentage,
      startDate: promotions.startDate,
      endDate: promotions.endDate,
      openHours: promotions.openHours,
      location: promotions.location,
      contact: promotions.contact,
      imageUrls: promotions.imageUrls,
      videoUrl: promotions.videoUrl,
      paymentMethods: promotions.paymentMethods,
      terms: promotions.terms,
      status: promotions.status,
      featured: promotions.featured,
      sponsored: promotions.sponsored,
      verified: promotions.verified,
      authorRole: promotions.authorRole,
      createdAt: promotions.createdAt,
      updatedAt: promotions.updatedAt,
      merchantName: merchants.businessName,
      merchantLogo: merchants.logo
    })
    .from(promotions)
    .leftJoin(merchants, eq(merchants.id, promotions.merchantId))
    .where(eq(promotions.status, 'active'))
    .$dynamic();

  if (cursor) {
    const { featured, verified, endDate, createdAt, id } = cursor;
    baseQuery = baseQuery.where(
      sql`(featured, verified, end_date, created_at, id) > (
        ${featured},
        ${verified},
        ${endDate}::timestamp,
        ${createdAt}::timestamp,
        ${id}
      )`
    );
  }

  const items = await baseQuery
    .orderBy(
      desc(promotions.featured),
      desc(promotions.verified), // merchant posts first within each featured bucket
      asc(promotions.endDate),
      desc(promotions.createdAt),
      desc(promotions.id)
    )
    .limit(20);

  return {
    items,
    nextCursor:
      items.length === 20
        ? {
            featured: items[19].featured,
            verified: items[19].verified,
            endDate: items[19].endDate.toISOString(),
            createdAt: items[19].createdAt.toISOString(),
            id: items[19].id
          }
        : null
  };
});

export const getPromotionById = query(v.number(), async (id) => {
  const [row] = await db
    .select({
      id: promotions.id,
      merchantId: promotions.merchantId,
      title: promotions.title,
      description: promotions.description,
      discountPercentage: promotions.discountPercentage,
      startDate: promotions.startDate,
      endDate: promotions.endDate,
      openHours: promotions.openHours,
      location: promotions.location,
      contact: promotions.contact,
      imageUrls: promotions.imageUrls,
      videoUrl: promotions.videoUrl,
      paymentMethods: promotions.paymentMethods,
      terms: promotions.terms,
      status: promotions.status,
      featured: promotions.featured,
      sponsored: promotions.sponsored,
      verified: promotions.verified,
      authorRole: promotions.authorRole,
      createdAt: promotions.createdAt,
      updatedAt: promotions.updatedAt,
      merchantName: merchants.businessName,
      merchantLogo: merchants.logo
    })
    .from(promotions)
    .leftJoin(merchants, eq(merchants.id, promotions.merchantId))
    .where(eq(promotions.id, id))
    .limit(1);

  if (!row) error(404, 'Promotion not found');
  return row;
});

export const getPromotionsByIds = query.batch(v.number(), async (ids) => {
  const items = await db
    .select()
    .from(promotions)
    .where(sql`id = ANY(${ids})`);
  const lookup = new Map(items.map((p) => [p.id, p]));
  return (id: number) => lookup.get(id);
});

// --- ACTIONS ---

/**
 * createPromotion — hybrid posting
 *
 * Flow by role:
 *
 * merchant → look up existing merchant row, upsert branding, verified=true
 * admin    → use supplied merchantId, upsert branding, verified=true
 * user     → upsert a merchant row keyed to their userId (so the FK is satisfied),
 *            verified=false, authorRole='user'
 *
 * The merchant row for regular users acts as a thin identity container.
 * It is NOT a merchant account — verified=false on the promotion signals
 * that this came from a regular user.
 *
 * After submission the client receives the created promotion object.
 * The form uses the authorRole field to decide which toast to show.
 */
export const createPromotion = form(createPromotionSchema, async (data) => {
  const event = getRequestEvent();
  const user = event?.locals?.user;
  if (!user) error(401, 'Não autenticado');

  const finalPaymentMethods = data.paymentMethods
    ? data.paymentMethods.split(',').filter(Boolean)
    : [];
  const finalImageUrls = data.imageUrls
    ? data.imageUrls.split(',').filter(Boolean)
    : [];
  const finalOpenHours = data.openHours ? JSON.parse(data.openHours) : null;

  const isTrusted = user.role === 'merchant' || user.role === 'admin';

  let mId: number;

  if (user.role === 'admin') {
    // Admin explicitly targets a merchant by ID
    mId = Number(data.merchantId);
    if (isNaN(mId)) error(400, 'merchantId inválido');

    await db
      .update(merchants)
      .set({
        businessName: data.merchantName,
        ...(data.merchantLogoUrl ? { logo: data.merchantLogoUrl } : {}),
        updatedAt: new Date()
      })
      .where(eq(merchants.id, mId));
  } else {
    // merchant OR regular user — both upsert against their own userId
    const [existing] = await db
      .select()
      .from(merchants)
      .where(eq(merchants.userId, user.id))
      .limit(1);

    if (existing) {
      // Update branding — preserve logo if not re-uploaded
      await db
        .update(merchants)
        .set({
          businessName: data.merchantName,
          ...(data.merchantLogoUrl ? { logo: data.merchantLogoUrl } : {}),
          updatedAt: new Date()
        })
        .where(eq(merchants.id, existing.id));
      mId = existing.id;
    } else {
      // First promotion ever — bootstrap a merchant row
      // For regular users this is an identity container, not a merchant account
      const [created] = await db
        .insert(merchants)
        .values({
          userId: user.id,
          businessName: data.merchantName,
          logo: data.merchantLogoUrl || null,
          verified: false // only admin can flip this
        })
        .returning();
      mId = created.id;
    }
  }

  const [promo] = await db
    .insert(promotions)
    .values({
      title: data.title,
      description: data.description,
      discountPercentage: data.discountPercentage
        ? Number(data.discountPercentage)
        : null,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      openHours: finalOpenHours,
      location: { address: data.locationAddress || '', lat: 0, lng: 0 },
      contact: {
        phone: data.contactPhone,
        whatsapp: data.contactWhatsapp,
        email: data.contactEmail
      },
      imageUrls: finalImageUrls,
      paymentMethods: finalPaymentMethods,
      terms: data.terms,
      merchantId: mId,
      status: 'active',
      // Trust signals — drive ranking without blocking anyone
      verified: isTrusted,
      authorRole: user.role === 'admin' ? 'merchant' : user.role
    } as any)
    .returning();

  return promo;
});

export const updatePromotion = form(
  v.object({ id: v.number(), ...createPromotionSchema.entries }),
  async (data) => {
    const event = getRequestEvent();
    const user = event?.locals?.user;

    if (!user) throw error(401);

    const [existing] = await db
      .select()
      .from(promotions)
      .where(eq(promotions.id, data.id))
      .limit(1);

    if (!existing) throw error(404);

    if (user.role !== 'admin') {
      const [merchantRow] = await db
        .select()
        .from(merchants)
        .where(
          and(
            eq(merchants.id, existing.merchantId),
            eq(merchants.userId, user.id)
          )
        )
        .limit(1);

      if (!merchantRow) throw error(403, 'Sem permissão');
    }

    try {
      const [updated] = await db
        .update(promotions)
        .set({
          title: data.title,
          description: data.description,
          discountPercentage: data.discountPercentage
            ? Number(data.discountPercentage)
            : null,
          startDate: new Date(data.startDate),
          endDate: new Date(data.endDate),
          openHours: data.openHours
            ? JSON.parse(data.openHours)
            : existing.openHours,
          location: { address: data.locationAddress || '', lat: 0, lng: 0 },
          contact: {
            phone: data.contactPhone,
            whatsapp: data.contactWhatsapp,
            email: data.contactEmail
          },
          imageUrls: data.imageUrls
            ? data.imageUrls.split(',').filter(Boolean)
            : existing.imageUrls,
          paymentMethods: data.paymentMethods
            ? data.paymentMethods.split(',').filter(Boolean)
            : existing.paymentMethods,
          terms: data.terms,
          updatedAt: new Date()
        } as any)
        .where(eq(promotions.id, data.id))
        .returning();

      return {
        success: true,
        promotion: updated
      };
    } catch (err) {
      console.error(err);
      throw error(500, 'Erro ao actualizar promoção');
    }
  }
);

export const deletePromotion = form(
  v.object({ id: v.number() }),
  async ({ id }) => {
    const event = getRequestEvent();
    const user = event?.locals?.user;
    if (!user) error(401);

    const [existing] = await db
      .select()
      .from(promotions)
      .where(eq(promotions.id, id))
      .limit(1);
    if (!existing) error(404);

    if (user.role !== 'admin') {
      const [merchantRow] = await db
        .select()
        .from(merchants)
        .where(
          and(
            eq(merchants.id, existing.merchantId),
            eq(merchants.userId, user.id)
          )
        )
        .limit(1);
      if (!merchantRow) error(403, 'Sem permissão');
    }

    await db.delete(promotions).where(eq(promotions.id, id));
    return { success: true };
  }
);

export const toggleLike = form(
  v.object({ promotionId: v.number() }),
  async ({ promotionId }) => {
    const user = getRequestEvent()?.locals?.user;
    if (!user) error(401);

    const [existing] = await db
      .select()
      .from(likes)
      .where(and(eq(likes.userId, user.id), eq(likes.promotionId, promotionId)))
      .limit(1);

    if (existing) {
      await db.delete(likes).where(eq(likes.id, existing.id));
      return { liked: false };
    }

    await db.insert(likes).values({ userId: user.id, promotionId });
    return { liked: true };
  }
);

export const addComment = form(
  v.object({
    promotionId: v.number(),
    content: v.pipe(v.string(), v.nonEmpty())
  }),
  async ({ promotionId, content }) => {
    const user = getRequestEvent()?.locals?.user;
    if (!user) error(401);

    const [comment] = await db
      .insert(comments)
      .values({ userId: user.id, promotionId, content })
      .returning();

    return comment;
  }
);

// import { query, form, prerender, getRequestEvent } from '$app/server';
// import * as v from 'valibot';
// import { error } from '@sveltejs/kit';
// import { db } from '$lib/server/db';
// import { eq, and, desc, asc, sql, count as drizzleCount } from 'drizzle-orm';
// import { promotions, likes, comments, merchants } from '$lib/server/db/schema';
// import { v2 as cloudinary } from 'cloudinary';
// import {
//   CLOUDINARY_CLOUD_NAME,
//   CLOUDINARY_API_KEY,
//   CLOUDINARY_API_SECRET
// } from '$env/static/private';

// // --- CONFIG ---
// cloudinary.config({
//   cloud_name: CLOUDINARY_CLOUD_NAME,
//   api_key: CLOUDINARY_API_KEY,
//   api_secret: CLOUDINARY_API_SECRET
// });

// // --- SCHEMAS ---
// const cursorSchema = v.object({
//   featured: v.boolean(),
//   endDate: v.string(),
//   createdAt: v.string(),
//   id: v.number()
// });

// // --- UPDATED SCHEMA ---
// // Add merchantName and merchantLogoUrl to the form payload
// const createPromotionSchema = v.object({
//   // ── NEW: merchant branding ──
//   merchantName:     v.pipe(v.string(), v.nonEmpty('Nome do negócio é obrigatório')),
//   merchantLogoUrl:  v.optional(v.string()),

//   // ── existing fields (unchanged) ──
//   title:            v.pipe(v.string(), v.nonEmpty()),
//   description:      v.optional(v.string()),
//   discountPercentage: v.optional(v.string()),
//   startDate:        v.string(),
//   endDate:          v.string(),
//   openHours:        v.optional(v.string()),
//   locationAddress:  v.optional(v.string()),
//   contactPhone:     v.optional(v.string()),
//   contactWhatsapp:  v.optional(v.string()),
//   contactEmail:     v.optional(v.string()),
//   imageUrls:        v.optional(v.string()),
//   paymentMethods:   v.optional(v.string()),
//   terms:            v.optional(v.string()),
//   merchantId:       v.optional(v.string()),
// });

// // --- QUERIES ---

// export const getUploadSignature = query(v.any(), async () => {
//   const timestamp = Math.round(new Date().getTime() / 1000);
//   const signature = cloudinary.utils.api_sign_request(
//     { timestamp, folder: 'promotions' },
//     CLOUDINARY_API_SECRET
//   );
//   return {
//     signature,
//     timestamp,
//     apiKey: CLOUDINARY_API_KEY,
//     cloudName: CLOUDINARY_CLOUD_NAME
//   };
// });

// export const getPromoStats = prerender(async () => {
//   const [result] = await db
//     .select({ value: drizzleCount() })
//     .from(promotions)
//     .where(eq(promotions.status, 'active'));
//   return {
//     totalActive: result?.value ?? 0,
//     lastUpdated: new Date().toISOString()
//   };
// });

// export const getPromotions = query(v.optional(cursorSchema), async (cursor) => {
//   let baseQuery = db
//     .select({
//       // All promotion columns
//       id: promotions.id,
//       merchantId: promotions.merchantId,
//       title: promotions.title,
//       description: promotions.description,
//       discountPercentage: promotions.discountPercentage,
//       startDate: promotions.startDate,
//       endDate: promotions.endDate,
//       openHours: promotions.openHours,
//       location: promotions.location,
//       contact: promotions.contact,
//       imageUrls: promotions.imageUrls,
//       videoUrl: promotions.videoUrl,
//       paymentMethods: promotions.paymentMethods,
//       terms: promotions.terms,
//       status: promotions.status,
//       featured: promotions.featured,
//       sponsored: promotions.sponsored,
//       createdAt: promotions.createdAt,
//       updatedAt: promotions.updatedAt,
//       // ✅ Merchant branding fields joined in
//       merchantName: merchants.businessName,
//       merchantLogo: merchants.logo
//     })
//     .from(promotions)
//     .leftJoin(merchants, eq(merchants.id, promotions.merchantId))
//     .where(eq(promotions.status, 'active'))
//     .$dynamic();

//   if (cursor) {
//     const { featured, endDate, createdAt, id } = cursor;
//     baseQuery = baseQuery.where(
//       sql`(featured, end_date, created_at, id) > (${featured}, ${endDate}::timestamp, ${createdAt}::timestamp, ${id})`
//     );
//   }

//   const items = await baseQuery
//     .orderBy(
//       desc(promotions.featured),
//       asc(promotions.endDate),
//       desc(promotions.createdAt),
//       desc(promotions.id)
//     )
//     .limit(20);

//   return {
//     items,
//     nextCursor:
//       items.length === 20
//         ? {
//             featured: items[19].featured,
//             endDate: items[19].endDate.toISOString(),
//             createdAt: items[19].createdAt.toISOString(),
//             id: items[19].id
//           }
//         : null
//   };
// });

// export const getPromotionById = query(v.number(), async (id) => {
//   // ✅ Single join — gets promotion + merchant branding in one query
//   const [row] = await db
//     .select({
//       id: promotions.id,
//       merchantId: promotions.merchantId,
//       title: promotions.title,
//       description: promotions.description,
//       discountPercentage: promotions.discountPercentage,
//       startDate: promotions.startDate,
//       endDate: promotions.endDate,
//       openHours: promotions.openHours,
//       location: promotions.location,
//       contact: promotions.contact,
//       imageUrls: promotions.imageUrls,
//       videoUrl: promotions.videoUrl,
//       paymentMethods: promotions.paymentMethods,
//       terms: promotions.terms,
//       status: promotions.status,
//       featured: promotions.featured,
//       sponsored: promotions.sponsored,
//       createdAt: promotions.createdAt,
//       updatedAt: promotions.updatedAt,
//       // ✅ Merchant branding
//       merchantName: merchants.businessName,
//       merchantLogo: merchants.logo
//     })
//     .from(promotions)
//     .leftJoin(merchants, eq(merchants.id, promotions.merchantId))
//     .where(eq(promotions.id, id))
//     .limit(1);

//   if (!row) error(404, 'Promotion not found');
//   return row;
// });

// export const getPromotionsByIds = query.batch(v.number(), async (ids) => {
//   const items = await db
//     .select()
//     .from(promotions)
//     .where(sql`id = ANY(${ids})`);
//   const lookup = new Map(items.map((p) => [p.id, p]));
//   return (id: number) => lookup.get(id);
// });

// // --- UPDATED ACTION ---
// export const createPromotion = form(createPromotionSchema, async (data) => {
//   const event = getRequestEvent();
//   const user = event?.locals?.user;
//   if (!user) error(401);

//   const finalPaymentMethods = data.paymentMethods
//     ? data.paymentMethods.split(',').filter(Boolean)
//     : [];
//   const finalImageUrls = data.imageUrls
//     ? data.imageUrls.split(',').filter(Boolean)
//     : [];
//   const finalOpenHours = data.openHours ? JSON.parse(data.openHours) : null;

//   // ── Resolve merchant row ──────────────────────────────────────────────────
//   // For a merchant user: look up their existing row (must exist — they registered).
//   // For admin: use the supplied merchantId.
//   // In both cases, upsert businessName + logo so the card always reflects the
//   // latest values submitted with this form.

//   // Replace the merchant lookup block with this
//   let mId: number;

//   if (user.role === 'merchant') {
//     const [existing] = await db
//       .select()
//       .from(merchants)
//       .where(eq(merchants.userId, user.id))
//       .limit(1);

//     if (existing) {
//       await db
//         .update(merchants)
//         .set({
//           businessName: data.merchantName,
//           ...(data.merchantLogoUrl ? { logo: data.merchantLogoUrl } : {}),
//           updatedAt: new Date()
//         })
//         .where(eq(merchants.id, existing.id));
//       mId = existing.id;
//     } else {
//       // First-time merchant — create the row on the fly
//       const [created] = await db
//         .insert(merchants)
//         .values({
//           userId: user.id,
//           businessName: data.merchantName,
//           logo: data.merchantLogoUrl || null
//         })
//         .returning();
//       mId = created.id;
//     }
//   } else {
//     mId = Number(data.merchantId);
//     if (isNaN(mId)) error(400, 'Invalid merchantId');
//     await db
//       .update(merchants)
//       .set({
//         businessName: data.merchantName,
//         ...(data.merchantLogoUrl ? { logo: data.merchantLogoUrl } : {}),
//         updatedAt: new Date()
//       })
//       .where(eq(merchants.id, mId));
//   }

//   // ── Insert promotion (unchanged) ──────────────────────────────────────────
//   const [promo] = await db
//     .insert(promotions)
//     .values({
//       title: data.title,
//       description: data.description,
//       discountPercentage: data.discountPercentage
//         ? Number(data.discountPercentage)
//         : null,
//       startDate: new Date(data.startDate),
//       endDate: new Date(data.endDate),
//       openHours: finalOpenHours,
//       location: { address: data.locationAddress || '', lat: 0, lng: 0 },
//       contact: {
//         phone: data.contactPhone,
//         whatsapp: data.contactWhatsapp,
//         email: data.contactEmail
//       },
//       imageUrls: finalImageUrls,
//       paymentMethods: finalPaymentMethods,
//       terms: data.terms,
//       merchantId: mId,
//       status: 'active'
//     } as any)
//     .returning();

//   return promo;
// });

// export const updatePromotion = form(
//   v.object({ id: v.number(), ...createPromotionSchema.entries }),
//   async (data) => {
//     const event = getRequestEvent();
//     const user = event?.locals?.user;
//     if (!user) error(401);

//     const [existing] = await db
//       .select()
//       .from(promotions)
//       .where(eq(promotions.id, data.id))
//       .limit(1);
//     if (!existing) error(404);

//     const [updated] = await db
//       .update(promotions)
//       .set({
//         title: data.title,
//         description: data.description,
//         discountPercentage: data.discountPercentage
//           ? Number(data.discountPercentage)
//           : null,
//         startDate: new Date(data.startDate),
//         endDate: new Date(data.endDate),
//         openHours: data.openHours
//           ? JSON.parse(data.openHours)
//           : existing.openHours,
//         location: { address: data.locationAddress || '', lat: 0, lng: 0 },
//         contact: {
//           phone: data.contactPhone,
//           whatsapp: data.contactWhatsapp,
//           email: data.contactEmail
//         },
//         imageUrls: data.imageUrls
//           ? data.imageUrls.split(',').filter(Boolean)
//           : existing.imageUrls,
//         paymentMethods: data.paymentMethods
//           ? data.paymentMethods.split(',').filter(Boolean)
//           : existing.paymentMethods,
//         terms: data.terms,
//         updatedAt: new Date()
//       } as any)
//       .where(eq(promotions.id, data.id))
//       .returning();
//     return updated;
//   }
// );

// export const deletePromotion = form(
//   v.object({ id: v.number() }),
//   async ({ id }) => {
//     const event = getRequestEvent();
//     const user = event?.locals?.user;
//     if (!user) error(401);
//     await db.delete(promotions).where(eq(promotions.id, id));
//     return { success: true };
//   }
// );

// export const toggleLike = form(
//   v.object({ promotionId: v.number() }),
//   async ({ promotionId }) => {
//     const user = getRequestEvent()?.locals?.user;
//     if (!user) error(401);
//     const [existing] = await db
//       .select()
//       .from(likes)
//       .where(and(eq(likes.userId, user.id), eq(likes.promotionId, promotionId)))
//       .limit(1);
//     if (existing) {
//       await db.delete(likes).where(eq(likes.id, existing.id));
//       return { liked: false };
//     }
//     await db.insert(likes).values({ userId: user.id, promotionId });
//     return { liked: true };
//   }
// );

// export const addComment = form(
//   v.object({
//     promotionId: v.number(),
//     content: v.pipe(v.string(), v.nonEmpty())
//   }),
//   async ({ promotionId, content }) => {
//     const user = getRequestEvent()?.locals?.user;
//     if (!user) error(401);
//     const [comment] = await db
//       .insert(comments)
//       .values({ userId: user.id, promotionId, content })
//       .returning();
//     return comment;
//   }
// );

// import { query, form, prerender, getRequestEvent } from '$app/server';
// import * as v from 'valibot';
// import { error } from '@sveltejs/kit';
// import { db } from '$lib/server/db';
// import { eq, and, desc, asc, sql, count as drizzleCount } from 'drizzle-orm';
// import { promotions, likes, comments, merchants } from '$lib/server/db/schema';
// import { v2 as cloudinary } from 'cloudinary';
// import {
//   CLOUDINARY_CLOUD_NAME,
//   CLOUDINARY_API_KEY,
//   CLOUDINARY_API_SECRET,
// } from '$env/static/private';

// // --- CONFIG ---
// cloudinary.config({
//   cloud_name: CLOUDINARY_CLOUD_NAME,
//   api_key: CLOUDINARY_API_KEY,
//   api_secret: CLOUDINARY_API_SECRET,
// });

// // --- SCHEMAS ---
// const cursorSchema = v.object({
//   featured: v.boolean(),
//   endDate: v.string(),
//   createdAt: v.string(),
//   id: v.number(),
// });

// const createPromotionSchema = v.object({
//   title: v.pipe(v.string(), v.nonEmpty()),
//   description: v.optional(v.string()),
//   discountPercentage: v.optional(v.string()),
//   startDate: v.string(),
//   endDate: v.string(),
//   openHours: v.optional(v.string()),
//   locationAddress: v.optional(v.string()),
//   contactPhone: v.optional(v.string()),
//   contactWhatsapp: v.optional(v.string()),
//   contactEmail: v.optional(v.string()),
//   imageUrls: v.optional(v.string()),
//   paymentMethods: v.optional(v.string()),
//   terms: v.optional(v.string()),
//   merchantId: v.optional(v.string()),
// });

// // --- QUERIES ---

// export const getUploadSignature = query(v.any(), async () => {
//   const timestamp = Math.round(new Date().getTime() / 1000);
//   const signature = cloudinary.utils.api_sign_request(
//     { timestamp, folder: 'promotions' },
//     CLOUDINARY_API_SECRET,
//   );
//   return {
//     signature,
//     timestamp,
//     apiKey: CLOUDINARY_API_KEY,
//     cloudName: CLOUDINARY_CLOUD_NAME,
//   };
// });

// export const getPromoStats = prerender(async () => {
//   const [result] = await db
//     .select({ value: drizzleCount() })
//     .from(promotions)
//     .where(eq(promotions.status, 'active'));
//   return {
//     totalActive: result?.value ?? 0,
//     lastUpdated: new Date().toISOString(),
//   };
// });

// export const getPromotions = query(v.optional(cursorSchema), async (cursor) => {
//   let baseQuery = db
//     .select()
//     .from(promotions)
//     .where(eq(promotions.status, 'active'))
//     .$dynamic();
//   if (cursor) {
//     const { featured, endDate, createdAt, id } = cursor;
//     baseQuery = baseQuery.where(
//       sql`(featured, end_date, created_at, id) > (${featured}, ${endDate}::timestamp, ${createdAt}::timestamp, ${id})`,
//     );
//   }
//   const items = await baseQuery
//     .orderBy(
//       desc(promotions.featured),
//       asc(promotions.endDate),
//       desc(promotions.createdAt),
//       desc(promotions.id),
//     )
//     .limit(20);
//   return {
//     items,
//     nextCursor:
//       items.length === 20
//         ? {
//             featured: items[19].featured,
//             endDate: items[19].endDate.toISOString(),
//             createdAt: items[19].createdAt.toISOString(),
//             id: items[19].id,
//           }
//         : null,
//   };
// });

// export const getPromotionById = query(v.number(), async (id) => {
//   const [promo] = await db
//     .select()
//     .from(promotions)
//     .where(eq(promotions.id, id))
//     .limit(1);
//   if (!promo) error(404, 'Promotion not found');
//   return promo;
// });

// export const getPromotionsByIds = query.batch(v.number(), async (ids) => {
//   const items = await db
//     .select()
//     .from(promotions)
//     .where(sql`id = ANY(${ids})`);
//   const lookup = new Map(items.map((p) => [p.id, p]));
//   return (id: number) => lookup.get(id);
// });

// // --- ACTIONS ---

// export const createPromotion = form(createPromotionSchema, async (data) => {
//   const event = getRequestEvent();
//   const user = event?.locals?.user;
//   if (!user) error(401);

//   const finalPaymentMethods = data.paymentMethods
//     ? data.paymentMethods.split(',').filter(Boolean)
//     : [];
//   const finalImageUrls = data.imageUrls
//     ? data.imageUrls.split(',').filter(Boolean)
//     : [];
//   const finalOpenHours = data.openHours ? JSON.parse(data.openHours) : null;

//   let mId: number;
//   if (user.role === 'merchant') {
//     const [m] = await db
//       .select()
//       .from(merchants)
//       .where(eq(merchants.userId, user.id))
//       .limit(1);
//     if (!m) error(400, 'Merchant profile missing');
//     mId = m.id;
//   } else {
//     mId = Number(data.merchantId);
//   }

//   const [promo] = await db
//     .insert(promotions)
//     .values({
//       title: data.title,
//       description: data.description,
//       discountPercentage: data.discountPercentage
//         ? Number(data.discountPercentage)
//         : null,
//       startDate: new Date(data.startDate),
//       endDate: new Date(data.endDate),
//       openHours: finalOpenHours,
//       location: { address: data.locationAddress || '', lat: 0, lng: 0 },
//       contact: {
//         phone: data.contactPhone,
//         whatsapp: data.contactWhatsapp,
//         email: data.contactEmail,
//       },
//       imageUrls: finalImageUrls,
//       paymentMethods: finalPaymentMethods,
//       terms: data.terms,
//       merchantId: mId,
//       status: 'active',
//     } as any)
//     .returning();

//   // await getPromotions().refresh(); // Refresh the promotions list after creating a new one

//   return promo;
// });

// export const updatePromotion = form(
//   v.object({ id: v.number(), ...createPromotionSchema.entries }),
//   async (data) => {
//     const event = getRequestEvent();
//     const user = event?.locals?.user;
//     if (!user) error(401);

//     const [existing] = await db
//       .select()
//       .from(promotions)
//       .where(eq(promotions.id, data.id))
//       .limit(1);
//     if (!existing) error(404);

//     const [updated] = await db
//       .update(promotions)
//       .set({
//         title: data.title,
//         description: data.description,
//         discountPercentage: data.discountPercentage
//           ? Number(data.discountPercentage)
//           : null,
//         startDate: new Date(data.startDate),
//         endDate: new Date(data.endDate),
//         openHours: data.openHours
//           ? JSON.parse(data.openHours)
//           : existing.openHours,
//         location: { address: data.locationAddress || '', lat: 0, lng: 0 },
//         contact: {
//           phone: data.contactPhone,
//           whatsapp: data.contactWhatsapp,
//           email: data.contactEmail,
//         },
//         imageUrls: data.imageUrls
//           ? data.imageUrls.split(',').filter(Boolean)
//           : existing.imageUrls,
//         paymentMethods: data.paymentMethods
//           ? data.paymentMethods.split(',').filter(Boolean)
//           : existing.paymentMethods,
//         terms: data.terms,
//         updatedAt: new Date(),
//       } as any)
//       .where(eq(promotions.id, data.id))
//       .returning();
//     return updated;
//   },
// );

// export const deletePromotion = form(
//   v.object({ id: v.number() }),
//   async ({ id }) => {
//     const event = getRequestEvent();
//     const user = event?.locals?.user;
//     if (!user) error(401);
//     await db.delete(promotions).where(eq(promotions.id, id));
//     return { success: true };
//   },
// );

// export const toggleLike = form(
//   v.object({ promotionId: v.number() }),
//   async ({ promotionId }) => {
//     const user = getRequestEvent()?.locals?.user;
//     if (!user) error(401);
//     const [existing] = await db
//       .select()
//       .from(likes)
//       .where(and(eq(likes.userId, user.id), eq(likes.promotionId, promotionId)))
//       .limit(1);
//     if (existing) {
//       await db.delete(likes).where(eq(likes.id, existing.id));
//       return { liked: false };
//     }
//     await db.insert(likes).values({ userId: user.id, promotionId });
//     return { liked: true };
//   },
// );

// export const addComment = form(
//   v.object({
//     promotionId: v.number(),
//     content: v.pipe(v.string(), v.nonEmpty()),
//   }),
//   async ({ promotionId, content }) => {
//     const user = getRequestEvent()?.locals?.user;
//     if (!user) error(401);
//     const [comment] = await db
//       .insert(comments)
//       .values({ userId: user.id, promotionId, content })
//       .returning();
//     return comment;
//   },
// );

// import { query, form, prerender, getRequestEvent } from '$app/server';
// import * as v from 'valibot';
// import { error } from '@sveltejs/kit';
// import { db } from '$lib/server/db';
// import { eq, and, desc, asc, sql, count as drizzleCount } from 'drizzle-orm';
// import { promotions, likes, comments, merchants } from '$lib/server/db/schema';

// // --- SCHEMAS ---

// const cursorSchema = v.object({
//   featured: v.boolean(),
//   endDate: v.string(),
//   createdAt: v.string(),
//   id: v.number(),
// });

// const createPromotionSchema = v.object({
//   title: v.pipe(v.string(), v.nonEmpty()),
//   description: v.optional(v.string()),
//   discountPercentage: v.optional(v.string()),
//   startDate: v.string(),
//   endDate: v.string(),
//   openHours: v.optional(v.string()),
//   location: v.optional(v.object({
//     lat: v.optional(v.string()),
//     lng: v.optional(v.string()),
//     address: v.optional(v.string())
//   })),
//   contact: v.optional(v.object({
//     phone: v.optional(v.string()),
//     whatsapp: v.optional(v.string()),
//     email: v.optional(v.string())
//   })),
//   imageUrls: v.optional(v.string()),
//   paymentMethods: v.optional(v.string()),
//   terms: v.optional(v.string()),
//   merchantId: v.optional(v.string()),
// });

// // --- QUERIES ---

// export const getPromoStats = prerender(async () => {
//   try {
//     const [result] = await db
//       .select({ value: drizzleCount() })
//       .from(promotions)
//       .where(eq(promotions.status, 'active'));

//     return {
//       totalActive: result?.value ?? 0,
//       lastUpdated: new Date().toISOString(),
//     };
//   } catch (err) {
//     console.error('Error fetching promotion stats:', err);
//   }
// });

// export const getPromotions = query(v.optional(cursorSchema), async (cursor) => {
//   let baseQuery = db
//     .select()
//     .from(promotions)
//     .where(eq(promotions.status, 'active'))
//     .$dynamic();

//   if (cursor) {
//     const { featured, endDate, createdAt, id } = cursor;
//     baseQuery = baseQuery.where(
//       sql`(featured, end_date, created_at, id) > (${featured}, ${endDate}::timestamp, ${createdAt}::timestamp, ${id})`,
//     );
//   }

//   const items = await baseQuery
//     .orderBy(
//       desc(promotions.featured),
//       asc(promotions.endDate),
//       desc(promotions.createdAt),
//       desc(promotions.id),
//     )
//     .limit(20);

//   const nextCursor =
//     items.length === 20
//       ? {
//           featured: items[items.length - 1].featured as boolean,
//           endDate: items[items.length - 1].endDate.toISOString(),
//           createdAt: items[items.length - 1].createdAt.toISOString(),
//           id: items[items.length - 1].id,
//         }
//       : null;

//   return { items, nextCursor };
// });

// export const getPromotionById = query(v.number(), async (id) => {
//   const results = await db
//     .select()
//     .from(promotions)
//     .where(eq(promotions.id, id))
//     .limit(1);
//   const promo = results[0];
//   if (!promo) error(404, 'Promotion not found');
//   return promo;
// });

// export const getPromotionsByIds = query.batch(v.number(), async (ids) => {
//   const items = await db
//     .select()
//     .from(promotions)
//     .where(sql`id = ANY(${ids})`);
//   const lookup = new Map(items.map((p) => [p.id, p]));
//   return (id: number) => lookup.get(id);
// });

// // --- ACTIONS ---

// export const createPromotion = form(createPromotionSchema, async (data) => {
//   const event = getRequestEvent();
//   const user = event?.locals?.user;
//   if (!user) error(401, 'Unauthorized');

//   if (user.role !== 'merchant' && user.role !== 'admin') {
//     error(403, 'Apenas mercantes podem criar promoções.');
//   }

//   const finalPaymentMethods = data.paymentMethods ? data.paymentMethods.split(',').filter(Boolean) : [];
//   const finalImageUrls = data.imageUrls ? data.imageUrls.split(',').filter(Boolean) : [];
//   const finalOpenHours = data.openHours ? JSON.parse(data.openHours) : null;

//   let merchantId: number;
//   if (user.role === 'merchant') {
//     const results = await db.select().from(merchants).where(eq(merchants.userId, user.id)).limit(1);
//     if (results.length === 0) error(400, 'Perfil de mercante não encontrado.');
//     merchantId = results[0].id;
//   } else {
//     if (!data.merchantId) error(400, 'merchantId é obrigatório para administradores');
//     merchantId = Number(data.merchantId);
//   }

//   const [promo] = await db.insert(promotions).values({
//     title: data.title,
//     description: data.description,
//     discountPercentage: data.discountPercentage ? Number(data.discountPercentage) : null,
//     startDate: new Date(data.startDate),
//     endDate: new Date(data.endDate),
//     openHours: finalOpenHours,
//     location: data.location ? {
//       address: data.location.address || '',
//       lat: data.location.lat ? Number(data.location.lat) : 0,
//       lng: data.location.lng ? Number(data.location.lng) : 0
//     } : null,
//     contact: data.contact,
//     imageUrls: finalImageUrls,
//     paymentMethods: finalPaymentMethods,
//     terms: data.terms,
//     merchantId,
//     status: 'active',
//   } as any).returning();

//   return promo;
// });

// export const updatePromotion = form(
//   v.object({ id: v.number(), ...createPromotionSchema.entries }),
//   async (data) => {
//     const event = getRequestEvent();
//     const user = event?.locals?.user;
//     if (!user) error(401);

//     const results = await db.select().from(promotions).where(eq(promotions.id, data.id)).limit(1);
//     const existing = results[0];
//     if (!existing) error(404);

//     if (user.role === 'merchant') {
//       const mResults = await db.select().from(merchants).where(eq(merchants.userId, user.id)).limit(1);
//       if (mResults.length === 0 || existing.merchantId !== mResults[0].id) error(403);
//     } else if (user.role !== 'admin') {
//       error(403);
//     }

//     const finalPaymentMethods = data.paymentMethods ? data.paymentMethods.split(',').filter(Boolean) : [];
//     const finalImageUrls = data.imageUrls ? data.imageUrls.split(',').filter(Boolean) : [];
//     const finalOpenHours = data.openHours ? JSON.parse(data.openHours) : existing.openHours;

//     const [updated] = await db.update(promotions).set({
//       title: data.title,
//       description: data.description,
//       discountPercentage: data.discountPercentage ? Number(data.discountPercentage) : null,
//       startDate: new Date(data.startDate),
//       endDate: new Date(data.endDate),
//       openHours: finalOpenHours,
//       location: data.location ? {
//         address: data.location.address || '',
//         lat: data.location.lat ? Number(data.location.lat) : 0,
//         lng: data.location.lng ? Number(data.location.lng) : 0
//       } : (existing.location as any),
//       contact: data.contact,
//       imageUrls: finalImageUrls,
//       paymentMethods: finalPaymentMethods,
//       terms: data.terms,
//       updatedAt: new Date(),
//     } as any).where(eq(promotions.id, data.id)).returning();

//     return updated;
//   }
// );

// export const deletePromotion = form(v.object({ id: v.number() }), async ({ id }) => {
//   const event = getRequestEvent();
//   const user = event?.locals?.user;
//   if (!user) error(401);

//   const results = await db.select().from(promotions).where(eq(promotions.id, id)).limit(1);
//   const existing = results[0];
//   if (!existing) error(404);

//   if (user.role === 'merchant') {
//     const mResults = await db.select().from(merchants).where(eq(merchants.userId, user.id)).limit(1);
//     if (mResults.length === 0 || existing.merchantId !== mResults[0].id) error(403);
//   } else if (user.role !== 'admin') {
//     error(403);
//   }

//   await db.delete(promotions).where(eq(promotions.id, id));
//   return { success: true };
// });

// export const toggleLike = form(v.object({ promotionId: v.number() }), async ({ promotionId }) => {
//   const event = getRequestEvent();
//   const user = event?.locals?.user;
//   if (!user) error(401);

//   const results = await db.select().from(likes)
//     .where(and(eq(likes.userId, user.id), eq(likes.promotionId, promotionId)))
//     .limit(1);

//   if (results[0]) {
//     await db.delete(likes).where(eq(likes.id, results[0].id));
//     return { liked: false };
//   } else {
//     await db.insert(likes).values({ userId: user.id, promotionId });
//     return { liked: true };
//   }
// });

// export const addComment = form(
//   v.object({ promotionId: v.number(), content: v.pipe(v.string(), v.nonEmpty()) }),
//   async ({ promotionId, content }) => {
//     const event = getRequestEvent();
//     const user = event?.locals?.user;
//     if (!user) error(401);

//     const [comment] = await db.insert(comments)
//       .values({ userId: user.id, promotionId, content })
//       .returning();
//     return comment;
//   }
// );

// import { query, form, prerender } from '$app/server';
// import * as v from 'valibot';
// import { error } from '@sveltejs/kit';
// import { db } from '$lib/server/db';
// import { eq, and, desc, asc, sql, count as drizzleCount } from 'drizzle-orm';
// import { promotions, likes, comments, merchants } from '$lib/server/db/schema';

// // --- SCHEMAS ---

// const cursorSchema = v.object({
//   featured: v.boolean(),
//   endDate: v.string(),
//   createdAt: v.string(),
//   id: v.number(),
// });

// /**
//  * Updated Schema: We use v.string() for arrays and numbers
//  * to match the raw data sent by the HTML form/hidden inputs.
//  */
// const createPromotionSchema = v.object({
//   title: v.pipe(v.string(), v.nonEmpty()),
//   description: v.optional(v.string()),
//   discountPercentage: v.optional(v.string()), // Received as string from input
//   startDate: v.string(),
//   endDate: v.string(),
//   location: v.optional(v.object({
//     lat: v.optional(v.string()), // Received as string
//     lng: v.optional(v.string()), // Received as string
//     address: v.optional(v.string())
//   })),
//   contact: v.optional(v.object({
//     phone: v.optional(v.string()),
//     whatsapp: v.optional(v.string()),
//     email: v.optional(v.string())
//   })),
//   // These are received as comma-separated strings from the single hidden inputs
//   imageUrls: v.optional(v.string()),
//   paymentMethods: v.optional(v.string()),
//   terms: v.optional(v.string()),
//   merchantId: v.optional(v.string()),
// });

// // --- QUERIES ---

// export const getPromoStats = prerender(async () => {
//   try {
//     const [result] = await db
//       .select({ value: drizzleCount() })
//       .from(promotions)
//       .where(eq(promotions.status, 'active'));

//     return {
//       totalActive: result?.value ?? 0,
//       lastUpdated: new Date().toISOString(),
//     };
//   } catch (err) {
//     console.error('Error fetching promotion stats:', err);
//   }
// });

// export const getPromotions = query(v.optional(cursorSchema), async (cursor) => {
//   let baseQuery = db
//     .select()
//     .from(promotions)
//     .where(eq(promotions.status, 'active'))
//     .$dynamic();

//   if (cursor) {
//     const { featured, endDate, createdAt, id } = cursor;
//     baseQuery = baseQuery.where(
//       sql`(featured, end_date, created_at, id) > (${featured}, ${endDate}::timestamp, ${createdAt}::timestamp, ${id})`,
//     );
//   }

//   const items = await baseQuery
//     .orderBy(
//       desc(promotions.featured),
//       asc(promotions.endDate),
//       desc(promotions.createdAt),
//       desc(promotions.id),
//     )
//     .limit(20);

//   const nextCursor =
//     items.length === 20
//       ? {
//           featured: items[items.length - 1].featured as boolean,
//           endDate: items[items.length - 1].endDate.toISOString(),
//           createdAt: items[items.length - 1].createdAt.toISOString(),
//           id: items[items.length - 1].id,
//         }
//       : null;

//   return { items, nextCursor };
// });

// export const getPromotionById = query(v.number(), async (id) => {
//   const results = await db
//     .select()
//     .from(promotions)
//     .where(eq(promotions.id, id))
//     .limit(1);
//   const promo = results[0];
//   if (!promo) error(404, 'Promotion not found');
//   return promo;
// });

// export const getPromotionsByIds = query.batch(v.number(), async (ids) => {
//   const items = await db
//     .select()
//     .from(promotions)
//     .where(sql`id = ANY(${ids})`);
//   const lookup = new Map(items.map((p) => [p.id, p]));
//   return (id: number) => lookup.get(id);
// });

// // --- ACTIONS ---

// export const createPromotion = form(
//   createPromotionSchema,
//   async (data, event: any) => {
//     const user = event.locals.user;
//     if (!user) error(401, 'Unauthorized');

//     if (user.role !== 'merchant' && user.role !== 'admin') {
//       error(403, 'Apenas mercantes podem criar promoções.');
//     }

//     // 1. Convert comma-separated strings back to Arrays
//     const finalPaymentMethods = data.paymentMethods
//       ? data.paymentMethods.split(',').filter(Boolean)
//       : [];

//     const finalImageUrls = data.imageUrls
//       ? data.imageUrls.split(',').filter(Boolean)
//       : [];

//     // 2. Merchant ID Resolution
//     let merchantId: number;
//     if (user.role === 'merchant') {
//       const results = await db
//         .select()
//         .from(merchants)
//         .where(eq(merchants.userId, user.id))
//         .limit(1);

//       if (results.length === 0) {
//         error(400, 'Perfil de mercante não encontrado.');
//       }
//       merchantId = results[0].id;
//     } else {
//       if (!data.merchantId) error(400, 'merchantId é obrigatório para administradores');
//       merchantId = Number(data.merchantId);
//     }

//     // 3. Database Insert with proper type coercion
//     const [promo] = await db
//       .insert(promotions)
//       .values({
//         title: data.title,
//         description: data.description,
//         discountPercentage: data.discountPercentage ? Number(data.discountPercentage) : null,
//         startDate: new Date(data.startDate),
//         endDate: new Date(data.endDate),
//         location: data.location ? {
//           address: data.location.address,
//           lat: data.location.lat ? Number(data.location.lat) : null,
//           lng: data.location.lng ? Number(data.location.lng) : null
//         } : null,
//         contact: data.contact,
//         imageUrls: finalImageUrls,
//         paymentMethods: finalPaymentMethods,
//         terms: data.terms,
//         merchantId,
//         status: 'active',
//         sponsored: false,
//         featured: false,
//       } as any)
//       .returning();

//     return promo;
//   },
// );

// export const updatePromotion = form(
//   v.object({ id: v.number(), ...createPromotionSchema.entries }),
//   async (data, event: any) => {
//     const user = event.locals.user;
//     if (!user) error(401);

//     const results = await db
//       .select()
//       .from(promotions)
//       .where(eq(promotions.id, data.id))
//       .limit(1);
//     const existing = results[0];
//     if (!existing) error(404);

//     if (user.role === 'merchant') {
//       const mResults = await db.select().from(merchants).where(eq(merchants.userId, user.id)).limit(1);
//       if (mResults.length === 0 || existing.merchantId !== mResults[0].id) error(403);
//     } else if (user.role !== 'admin') {
//       error(403);
//     }

//     const finalPaymentMethods = data.paymentMethods ? data.paymentMethods.split(',').filter(Boolean) : [];
//     const finalImageUrls = data.imageUrls ? data.imageUrls.split(',').filter(Boolean) : [];

//     const [updated] = await db
//       .update(promotions)
//       .set({
//         title: data.title,
//         description: data.description,
//         discountPercentage: data.discountPercentage ? Number(data.discountPercentage) : null,
//         startDate: new Date(data.startDate),
//         endDate: new Date(data.endDate),
//         location: data.location ? {
//           address: data.location.address,
//           lat: data.location.lat ? Number(data.location.lat) : null,
//           lng: data.location.lng ? Number(data.location.lng) : null
//         } : null,
//         contact: data.contact,
//         imageUrls: finalImageUrls,
//         paymentMethods: finalPaymentMethods,
//         terms: data.terms,
//         updatedAt: new Date(),
//       } as any)
//       .where(eq(promotions.id, data.id))
//       .returning();

//     return updated;
//   },
// );

// export const deletePromotion = form(
//   v.object({ id: v.number() }),
//   async ({ id }, event: any) => {
//     const user = event.locals.user;
//     if (!user) error(401);

//     const results = await db.select().from(promotions).where(eq(promotions.id, id)).limit(1);
//     const existing = results[0];
//     if (!existing) error(404);

//     if (user.role === 'merchant') {
//       const mResults = await db.select().from(merchants).where(eq(merchants.userId, user.id)).limit(1);
//       if (mResults.length === 0 || existing.merchantId !== mResults[0].id) error(403);
//     } else if (user.role !== 'admin') {
//       error(403);
//     }

//     await db.delete(promotions).where(eq(promotions.id, id));
//     return { success: true };
//   },
// );

// export const toggleLike = form(
//   v.object({ promotionId: v.number() }),
//   async ({ promotionId }, event: any) => {
//     const user = event.locals.user;
//     if (!user) error(401);

//     const results = await db
//       .select()
//       .from(likes)
//       .where(and(eq(likes.userId, user.id), eq(likes.promotionId, promotionId)))
//       .limit(1);

//     const existing = results[0];
//     if (existing) {
//       await db.delete(likes).where(eq(likes.id, existing.id));
//       return { liked: false };
//     } else {
//       await db.insert(likes).values({ userId: user.id, promotionId });
//       return { liked: true };
//     }
//   },
// );

// export const addComment = form(
//   v.object({
//     promotionId: v.number(),
//     content: v.pipe(v.string(), v.nonEmpty()),
//   }),
//   async ({ promotionId, content }, event: any) => {
//     const user = event.locals.user;
//     if (!user) error(401);

//     const [comment] = await db
//       .insert(comments)
//       .values({ userId: user.id, promotionId, content })
//       .returning();
//     return comment;
//   },
// );

// import { query, form } from '$app/server';
// import * as v from 'valibot';
// import { error } from '@sveltejs/kit';
// import { db } from '$lib/server/db';
// import { promotions, likes, comments, merchants } from '$lib/server/db/schema';
// import { eq, and, desc, asc, sql } from 'drizzle-orm';

// const cursorSchema = v.object({
//   featured: v.boolean(),
//   endDate: v.string(),
//   createdAt: v.string(),
//   id: v.number(),
// });

// export const getPromotions = query(
//   v.optional(cursorSchema),
//   async (cursor, event) => {
//     let query = db
//       .select()
//       .from(promotions)
//       .where(eq(promotions.status, 'active'));

//     if (cursor) {
//       const { featured, endDate, createdAt, id } = cursor;
//       query = query.where(
//         sql`(featured, end_date, created_at, id) > (${featured}, ${endDate}::timestamp, ${createdAt}::timestamp, ${id})`,
//       );
//     }

//     const items = await query
//       .orderBy(
//         desc(promotions.featured),
//         asc(promotions.endDate),
//         desc(promotions.createdAt),
//         desc(promotions.id),
//       )
//       .limit(20);

//     const nextCursor =
//       items.length === 20
//         ? {
//             featured: items[items.length - 1].featured,
//             endDate: items[items.length - 1].endDate.toISOString(),
//             createdAt: items[items.length - 1].createdAt.toISOString(),
//             id: items[items.length - 1].id,
//           }
//         : null;

//     return { items, nextCursor };
//   },
// );

// export const getPromotionById = query(v.number(), async (id, event) => {
//   const promo = await db
//     .select()
//     .from(promotions)
//     .where(eq(promotions.id, id))
//     .get();
//   if (!promo) error(404, 'Promotion not found');
//   return promo;
// });

// export const getPromotionsByIds = query.batch(
//   v.number(),
//   async (ids, event) => {
//     const items = await db
//       .select()
//       .from(promotions)
//       .where(sql`id = ANY(${ids})`);
//     const lookup = new Map(items.map((p) => [p.id, p]));
//     return (id) => lookup.get(id);
//   },
// );

// // Updated schema with paymentMethods
// const createPromotionSchema = v.object({
//   title: v.pipe(v.string(), v.nonEmpty()),
//   description: v.optional(v.string()),
//   discountPercentage: v.optional(v.number()),
//   startDate: v.string(),
//   endDate: v.string(),
//   location: v.optional(
//     v.object({
//       lat: v.number(),
//       lng: v.number(),
//       address: v.string(),
//     }),
//   ),
//   imageUrls: v.optional(v.array(v.string())),
//   videoUrl: v.optional(v.string()),
//   contact: v.optional(
//     v.object({
//       phone: v.optional(v.string()),
//       whatsapp: v.optional(v.string()),
//       email: v.optional(v.string()),
//     }),
//   ),
//   paymentMethods: v.optional(v.array(v.string())), // NEW
//   terms: v.optional(v.string()),
// });

// export const createPromotion = form(
//   createPromotionSchema,
//   async (data, event) => {
//     const user = event.locals.user;
//     if (!user) error(401, 'Unauthorized');
//     if (user.role !== 'merchant' && user.role !== 'admin')
//       error(403, 'Forbidden');

//     let merchantId: number;
//     if (user.role === 'merchant') {
//       const merchant = await db
//         .select()
//         .from(merchants)
//         .where(eq(merchants.userId, user.id))
//         .get();
//       if (!merchant) error(400, 'Merchant profile not found');
//       merchantId = merchant.id;
//     } else {
//       if (!data.merchantId) error(400, 'merchantId required for admin');
//       merchantId = data.merchantId;
//     }

//     if (
//       data.imageUrls &&
//       !data.imageUrls.every((url) =>
//         url.startsWith('https://res.cloudinary.com/'),
//       )
//     ) {
//       error(400, 'Invalid image URL');
//     }

//     const [promo] = await db
//       .insert(promotions)
//       .values({
//         ...data,
//         merchantId,
//         status: 'active',
//         sponsored: false,
//         featured: false,
//       })
//       .returning();

//     return promo;
//   },
// );

// export const updatePromotion = form(
//   v.object({
//     id: v.number(),
//     ...createPromotionSchema.entries,
//   }),
//   async (data, event) => {
//     const user = event.locals.user;
//     if (!user) error(401);

//     const existing = await db
//       .select()
//       .from(promotions)
//       .where(eq(promotions.id, data.id))
//       .get();
//     if (!existing) error(404);

//     if (user.role === 'merchant') {
//       const merchant = await db
//         .select()
//         .from(merchants)
//         .where(eq(merchants.userId, user.id))
//         .get();
//       if (!merchant || existing.merchantId !== merchant.id) error(403);
//     } else if (user.role !== 'admin') {
//       error(403);
//     }

//     const [updated] = await db
//       .update(promotions)
//       .set({ ...data, updatedAt: new Date() })
//       .where(eq(promotions.id, data.id))
//       .returning();

//     return updated;
//   },
// );

// export const deletePromotion = form(
//   v.object({ id: v.number() }),
//   async ({ id }, event) => {
//     const user = event.locals.user;
//     if (!user) error(401);

//     const existing = await db
//       .select()
//       .from(promotions)
//       .where(eq(promotions.id, id))
//       .get();
//     if (!existing) error(404);

//     if (user.role === 'merchant') {
//       const merchant = await db
//         .select()
//         .from(merchants)
//         .where(eq(merchants.userId, user.id))
//         .get();
//       if (!merchant || existing.merchantId !== merchant.id) error(403);
//     } else if (user.role !== 'admin') {
//       error(403);
//     }

//     await db.delete(promotions).where(eq(promotions.id, id));
//     return { success: true };
//   },
// );

// export const toggleLike = form(
//   v.object({ promotionId: v.number() }),
//   async ({ promotionId }, event) => {
//     const user = event.locals.user;
//     if (!user) error(401);

//     const existing = await db
//       .select()
//       .from(likes)
//       .where(and(eq(likes.userId, user.id), eq(likes.promotionId, promotionId)))
//       .get();

//     if (existing) {
//       await db.delete(likes).where(eq(likes.id, existing.id));
//       return { liked: false };
//     } else {
//       await db.insert(likes).values({ userId: user.id, promotionId });
//       return { liked: true };
//     }
//   },
// );

// export const addComment = form(
//   v.object({
//     promotionId: v.number(),
//     content: v.pipe(v.string(), v.nonEmpty()),
//   }),
//   async ({ promotionId, content }, event) => {
//     const user = event.locals.user;
//     if (!user) error(401);

//     const [comment] = await db
//       .insert(comments)
//       .values({
//         userId: user.id,
//         promotionId,
//         content,
//       })
//       .returning();

//     return comment;
//   },
// );
