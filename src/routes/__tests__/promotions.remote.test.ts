import { describe, it, expect, vi } from 'vitest';
import { getPromotions } from '../promotions.remote';
import { db } from '$lib/server/db';

vi.mock('$lib/server/db', () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
    }),
  },
}));

describe('getPromotions', () => {
  it('returns empty list with no cursor', async () => {
    const result = await getPromotions(null, {} as any);
    expect(result.items).toEqual([]);
    expect(result.nextCursor).toBeNull();
  });
});
