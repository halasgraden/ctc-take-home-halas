import { BadRequestError, NotFoundError } from '@/lib/errors';

// Shape safe to pass
export type RestaurantInput = {
  name: string;
  cuisine: string | null;
  address: string | null;
  rating: number | null;
};

export function parseRestaurantId(id: string): number {
  const n = Number(id);
  if (!Number.isInteger(n) || n <= 0) {
    throw new NotFoundError('Restaurant not found');
  }
  return n;
}

export function validateRestaurantBody(body: unknown): RestaurantInput {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    throw new BadRequestError('Invalid request body');
  }

  const b = body as Record<string, unknown>;

  // Optional: reject client trying to set server fields
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

  let cuisine: string | null = null;
  if ('cuisine' in b && b.cuisine != null) {
    if (typeof b.cuisine !== 'string') {
      throw new BadRequestError('cuisine must be a string');
    }
    cuisine = b.cuisine;
  }

  let address: string | null = null;
  if ('address' in b && b.address != null) {
    if (typeof b.address !== 'string') {
      throw new BadRequestError('address must be a string');
    }
    address = b.address;
  }

  let rating: number | null = null;
  if ('rating' in b && b.rating != null) {
    if (typeof b.rating !== 'number' || Number.isNaN(b.rating)) {
      throw new BadRequestError('rating must be a number');
    }
    if (b.rating < 0 || b.rating > 5) {
      throw new BadRequestError('rating must be between 0 and 5');
    }
    rating = b.rating;
  }

  return { name, cuisine, address, rating };
}