// src/routes/admin/promotions/+page.server.ts
//
// Lists ALL promotions on the platform (not just one merchant's), with the
// business and owner of each. Filters live in the URL (?q=&status=&page=),
// same convention as the users page.
import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import {
  promotions,
  merchants,
  businesses,
  users
} from '$lib/server/db/schema';
import { and, count, desc, eq, ilike, or, type SQL } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

const PAGE_SIZE = 20;
const STATUSES = ['active', 'expired', 'banned'] as const;

// Shape of one table row. Imported by PromotionTable.svelte.
export interface AdminPromotion {
  id: number;
  title: string;
  status: 'active' | 'expired' | 'banned';
  discountPercentage: number | null;
  endDate: Date;
  createdAt: Date;
  imageUrls: string[] | null;
  businessName: string | null;
  merchantName: string | null;
  ownerName: string | null;
  ownerEmail: string | null;
}

export const load: PageServerLoad = async ({ locals, url }) => {
  // SvelteKit runs layout and page loads in parallel, so the page checks the
  // role itself rather than relying on admin/+layout.server.ts having finished.
  if (locals.user?.role !== 'admin') {
    throw error(403, 'Acesso restrito a administradores.');
  }

  const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
  const query = url.searchParams.get('q')?.trim() ?? '';
  const status = STATUSES.find((s) => s === url.searchParams.get('status'));

  const conditions: SQL[] = [];
  if (query) {
    const term = `%${query}%`;
    conditions.push(
      or(
        ilike(promotions.title, term),
        ilike(businesses.name, term),
        ilike(merchants.businessName, term),
        ilike(users.name, term),
        ilike(users.email, term)
      )!
    );
  }
  if (status) conditions.push(eq(promotions.status, status));
  const where = conditions.length ? and(...conditions) : undefined;

  const [rows, [{ total }], statusRows] = await Promise.all([
    db
      .select({
        id: promotions.id,
        title: promotions.title,
        status: promotions.status,
        discountPercentage: promotions.discountPercentage,
        endDate: promotions.endDate,
        createdAt: promotions.createdAt,
        imageUrls: promotions.imageUrls,
        businessName: businesses.name,
        merchantName: merchants.businessName,
        ownerName: users.name,
        ownerEmail: users.email
      })
      .from(promotions)
      .leftJoin(merchants, eq(merchants.id, promotions.merchantId))
      .leftJoin(businesses, eq(businesses.id, promotions.businessId))
      .leftJoin(users, eq(users.id, merchants.userId))
      .where(where)
      .orderBy(desc(promotions.createdAt), desc(promotions.id))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),

    db
      .select({ total: count() })
      .from(promotions)
      .leftJoin(merchants, eq(merchants.id, promotions.merchantId))
      .leftJoin(businesses, eq(businesses.id, promotions.businessId))
      .leftJoin(users, eq(users.id, merchants.userId))
      .where(where),

    // Platform-wide counts per status, ignoring the current filters
    db
      .select({ status: promotions.status, n: count() })
      .from(promotions)
      .groupBy(promotions.status)
  ]);

  const counts = { active: 0, expired: 0, banned: 0 };
  for (const r of statusRows) counts[r.status] = r.n;

  return {
    promotions: rows as AdminPromotion[],
    total,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    query,
    statusFilter: status ?? 'all',
    counts,
    totalAll: counts.active + counts.expired + counts.banned
  };
};
