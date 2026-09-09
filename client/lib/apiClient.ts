/**
 * The client side of the API: helpers the frontend uses to call the endpoints.
 *
 * Don't confuse this with `app/api/`, which is the other side of the same
 * boundary - the route handlers that *implement* those endpoints. This file
 * only ever talks to them over HTTP.
 *
 * The shapes these helpers return live in `lib/types.ts`, shared with the
 * handlers that produce them.
 */
import type { Restaurant, Tag } from './types';

// Server Components run on the server, where relative URLs don't resolve, so we
// need an absolute origin. It's the same app on the same port, so this is
// normally just localhost:3000. In the browser we fall back to relative URLs.
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

function url(path: string): string {
  if (typeof window !== 'undefined') return path;
  return `${API_URL}${path}`;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function readError(res: Response): Promise<string> {
  try {
    const body = await res.json();
    if (body && typeof body.error === 'string') return body.error;
  } catch {
    /* fall through */
  }
  return `Request failed (${res.status})`;
}

export async function getRestaurants(): Promise<Restaurant[]> {
  const res = await fetch(url('/api/restaurants'), { cache: 'no-store' });
  if (!res.ok) throw new ApiError(await readError(res), res.status);
  return res.json();
}

export async function getRestaurant(id: number | string): Promise<Restaurant> {
  const res = await fetch(url(`/api/restaurants/${id}`), { cache: 'no-store' });
  if (!res.ok) throw new ApiError(await readError(res), res.status);
  return res.json();
}

export async function getTags(): Promise<Tag[]> {
  const res = await fetch(url('/api/tags'), { cache: 'no-store' });
  if (!res.ok) throw new ApiError(await readError(res), res.status);
  return res.json();
}

export interface CreateRestaurantInput {
  name: string;
  cuisine?: string | null;
  address?: string | null;
  rating?: number | null;
  website_url?: string | null;
  image_url?: string | null;
  tags?: string[];
}

export async function createRestaurant(
  input: CreateRestaurantInput
): Promise<Restaurant> {
  const res = await fetch(url('/api/restaurants'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new ApiError(await readError(res), res.status);
  return res.json();
}
