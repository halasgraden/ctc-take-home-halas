import { BadRequestError, NotFoundError } from '@/lib/errors';

// Shape safe to pass to the SQL layer.
export type RestaurantInput = {
  name: string;
  cuisine: string | null;
  address: string | null;
  rating: number | null;
  website_url: string | null;
  image_url: string | null;
  tagSlugs: string[];
};

const NAME_MAX = 120;
const CUISINE_MAX = 80;
const ADDRESS_MAX = 200;
const URL_MAX = 2048;
const SLUG_MAX = 64;
const SLUG_RE = /^[a-z0-9-]+$/;

/**
 * Accept only strict decimal-integer ids ("1", "42"). `Number.isInteger`
 * alone lets things like "1e10" through; that's technically valid JS but
 * not what a REST caller means by "positive integer id".
 */
export function parseRestaurantId(id: string): number {
  if (!/^\d+$/.test(id)) {
    throw new NotFoundError('Restaurant not found');
  }
  const n = Number(id);
  if (!Number.isSafeInteger(n) || n <= 0) {
    throw new NotFoundError('Restaurant not found');
  }
  return n;
}

function requireHttpUrl(value: unknown, field: string): string {
  if (typeof value !== 'string') {
    throw new BadRequestError(`${field} must be a string`);
  }
  const trimmed = value.trim();
  if (trimmed.length > URL_MAX) {
    throw new BadRequestError(`${field} is too long`);
  }
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new BadRequestError(`${field} must be a valid URL`);
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new BadRequestError(`${field} must use http or https`);
  }
  return trimmed;
}

export function validateRestaurantBody(body: unknown): RestaurantInput {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    throw new BadRequestError('Invalid request body');
  }

  const b = body as Record<string, unknown>;

  // Reject client trying to set server-managed fields.
  if ('id' in b || 'created_at' in b) {
    throw new BadRequestError('id and created_at cannot be set');
  }

  // --- name (required) ---
  if (!('name' in b)) {
    throw new BadRequestError('name is required');
  }
  if (typeof b.name !== 'string') {
    throw new BadRequestError('name must be a string');
  }
  const name = b.name.trim();
  if (name === '') {
    throw new BadRequestError('name is required');
  }
  if (name.length > NAME_MAX) {
    throw new BadRequestError(`name must be at most ${NAME_MAX} characters`);
  }

  let cuisine: string | null = null;
  if ('cuisine' in b && b.cuisine != null) {
    if (typeof b.cuisine !== 'string') {
      throw new BadRequestError('cuisine must be a string');
    }
    const c = b.cuisine.trim();
    if (c.length > CUISINE_MAX) {
      throw new BadRequestError(`cuisine must be at most ${CUISINE_MAX} characters`);
    }
    cuisine = c === '' ? null : c;
  }

  let address: string | null = null;
  if ('address' in b && b.address != null) {
    if (typeof b.address !== 'string') {
      throw new BadRequestError('address must be a string');
    }
    const a = b.address.trim();
    if (a.length > ADDRESS_MAX) {
      throw new BadRequestError(`address must be at most ${ADDRESS_MAX} characters`);
    }
    address = a === '' ? null : a;
  }

  let rating: number | null = null;
  if ('rating' in b && b.rating != null) {
    if (typeof b.rating !== 'number' || !Number.isFinite(b.rating)) {
      throw new BadRequestError('rating must be a number');
    }
    if (b.rating < 0 || b.rating > 5) {
      throw new BadRequestError('rating must be between 0 and 5');
    }
    rating = b.rating;
  }

  let website_url: string | null = null;
  if ('website_url' in b && b.website_url != null && b.website_url !== '') {
    website_url = requireHttpUrl(b.website_url, 'website_url');
  }

  let image_url: string | null = null;
  if ('image_url' in b && b.image_url != null && b.image_url !== '') {
    image_url = requireHttpUrl(b.image_url, 'image_url');
  }

  let tagSlugs: string[] = [];
  if ('tags' in b && b.tags != null) {
    if (!Array.isArray(b.tags)) {
      throw new BadRequestError('tags must be an array of slugs');
    }
    const seen = new Set<string>();
    for (const raw of b.tags) {
      if (typeof raw !== 'string') {
        throw new BadRequestError('tags must be an array of slugs');
      }
      const slug = raw.trim();
      if (slug.length === 0 || slug.length > SLUG_MAX || !SLUG_RE.test(slug)) {
        throw new BadRequestError(`invalid tag: '${raw}'`);
      }
      seen.add(slug);
    }
    tagSlugs = Array.from(seen);
  }

  return { name, cuisine, address, rating, website_url, image_url, tagSlugs };
}
