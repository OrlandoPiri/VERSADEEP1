// src/routes/merchant/promotions/[id]/edit/+page.server.ts
import { getPromotionById } from '../../../../promotions.remote';
import { error, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import { merchants } from '$lib/server/db/schema';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
  const user = locals.user;
  if (!user) throw redirect(302, '/auth/login');

  const id = Number(params.id);
  if (isNaN(id)) throw error(400, 'Identificador inválido.');

  const promotion = await getPromotionById(id);
  if (!promotion) throw error(404, 'Promoção não encontrada.');

  if (user.role === 'admin') return { promotion };

  const [merchantRow] = await db
    .select({ id: merchants.id })
    .from(merchants)
    .where(eq(merchants.userId, user.id))
    .limit(1);

  if (!merchantRow || merchantRow.id !== promotion.merchantId) {
    throw error(403, 'Não tem permissão para editar esta promoção.');
  }

  return { promotion };
};
