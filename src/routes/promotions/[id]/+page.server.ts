// src/routes/promotions/[id]/+page.server.ts
import { getPromotionById } from '../../promotions.remote';
import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import { merchants } from '$lib/server/db/schema';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
  const id = Number(params.id);
  if (isNaN(id)) throw error(400, 'Identificador de promoção inválido.');

  const promotion = await getPromotionById(id);
  if (!promotion) throw error(404, 'Esta promoção já não está disponível.');

  const user = locals.user;
  let canEdit = false;

  if (user) {
    if (user.role === 'admin') {
      canEdit = true;
    } else {
      // Look up this user's merchant row and compare against the promotion's merchantId
      const [merchantRow] = await db
        .select({ id: merchants.id })
        .from(merchants)
        .where(eq(merchants.userId, user.id))
        .limit(1);

      canEdit = !!merchantRow && merchantRow.id === promotion.merchantId;
    }
  }

  return { promotion, canEdit };
};

// 19ABRIL2026 import { getPromotionById } from '../../promotions.remote';
// import { error } from '@sveltejs/kit';
// import type { PageServerLoad } from './$types';

// export const load: PageServerLoad = async ({ params }) => {
//   const id = Number(params.id);

//   // Guard against non-numeric IDs in the URL
//   if (isNaN(id)) {
//     throw error(400, 'Identificador de promoção inválido.');
//   }

//   try {
//     // We call the query function we kept in promotions.remote.ts
//     const promotion = await getPromotionById(id);

//     if (!promotion) {
//       throw error(404, 'Esta promoção já não está disponível.');
//     }

//     return {
//       promotion
//     };
//   } catch (err) {
//     console.error('Error loading promotion detail:', err);
//     throw error(500, 'Erro ao carregar detalhes da promoção.');
//   }
// };
