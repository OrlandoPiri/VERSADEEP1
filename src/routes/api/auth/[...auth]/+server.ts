// src/routes/api/auth/[...auth]/+server.ts
import { auth } from '$lib/auth'; // Ensure this matches your path
import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ request }) => {
  const promotions = await auth.handler(request);
  return json(promotions);
};

export const POST: RequestHandler = async ({ request }) => {
  const promotions = await auth.handler(request);
  return json(promotions);
};
