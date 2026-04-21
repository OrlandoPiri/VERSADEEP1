import { db } from '$lib/server/db';
import { json } from '@sveltejs/kit';

export const GET = async () => {
  try {
    // Just a simple query to see if the database is alive
    const result = await db.execute('SELECT 1');
    return json({ status: 'Connected', result });
  } catch (e: any) {
    return json({ status: 'Failed', error: e.message }, { status: 500 });
  }
};