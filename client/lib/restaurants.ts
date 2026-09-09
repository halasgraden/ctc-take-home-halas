import type { PoolClient } from 'pg';
import { BadRequestError } from '@/lib/errors';

/**
 * Shared SELECT that also folds each restaurant's tags into a JSON array.
 * node-postgres parses JSON columns back into native JS values, so callers
 * see `row.tags` as `Array<{ id, slug, label }>` (or `[]`).
 */
export const SELECT_RESTAURANTS = `
  SELECT r.*,
    COALESCE(
      (
        SELECT json_agg(
                 json_build_object('id', t.id, 'slug', t.slug, 'label', t.label)
                 ORDER BY t.label
               )
        FROM restaurant_tags rt
        JOIN tags t ON t.id = rt.tag_id
        WHERE rt.restaurant_id = r.id
      ),
      '[]'::json
    ) AS tags
  FROM restaurants r
`;

/** The same SELECT, narrowed to one restaurant by id. */
export const SELECT_RESTAURANT_BY_ID = `${SELECT_RESTAURANTS} WHERE r.id = $1`;

/**
 * Persist a restaurant's tags. Resolves slugs to ids in one query and inserts
 * them all; a slug the DB doesn't know is a 400 (never a partial write).
 * Caller is responsible for the surrounding transaction.
 */
export async function writeRestaurantTags(
  client: PoolClient,
  restaurantId: number,
  slugs: string[]
): Promise<void> {
  if (slugs.length === 0) return;

  const { rows } = await client.query<{ id: number; slug: string }>(
    'SELECT id, slug FROM tags WHERE slug = ANY($1::text[])',
    [slugs]
  );

  if (rows.length !== slugs.length) {
    const found = new Set(rows.map((r) => r.slug));
    const missing = slugs.find((s) => !found.has(s));
    throw new BadRequestError(`Unknown tag: '${missing}'`);
  }

  await client.query(
    `INSERT INTO restaurant_tags (restaurant_id, tag_id)
       SELECT $1, id FROM tags WHERE slug = ANY($2::text[])`,
    [restaurantId, slugs]
  );
}
