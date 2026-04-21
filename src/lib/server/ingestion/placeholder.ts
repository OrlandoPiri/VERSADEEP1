import { db } from '$lib/server/db';
import { sources, promotions } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export async function runIngestion() {
  const activeSources = await db.select().from(sources).where(eq(sources.active, true));
  for (const source of activeSources) {
    console.log(`Running ingestion for ${source.name}`);
  }
}
