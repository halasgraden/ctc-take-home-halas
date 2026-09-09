import { NextResponse } from 'next/server';
import { pool } from '@/db/pool';
import { handleError, NotFoundError } from '@/lib/errors';
import { SELECT_RESTAURANT_BY_ID, writeRestaurantTags } from '@/lib/restaurants';
import { toRestaurant } from '@/lib/types';
import { parseRestaurantId, validateRestaurantBody } from '@/lib/validation';

type Params = { params: { id: string } };

/**
 * GET /api/restaurants/:id
 * Returns a single restaurant with its tags, or 404 if it doesn't exist.
 */
export async function GET(_req: Request, { params }: Params) {
  try {
    const id = parseRestaurantId(params.id);
    const { rows } = await pool.query(SELECT_RESTAURANT_BY_ID, [id]);

    if (rows.length === 0) {
      throw new NotFoundError('Restaurant not found');
    }

    return NextResponse.json(toRestaurant(rows[0]), { status: 200 });
  } catch (err) {
    return handleError(err);
  }
}

/**
 * PUT /api/restaurants/:id
 * Replace the restaurant's fields (and its tag set) atomically.
 */
export async function PUT(req: Request, { params }: Params) {
  const client = await pool.connect();
  try {
    const id = parseRestaurantId(params.id);
    const data = validateRestaurantBody(await req.json());

    await client.query('BEGIN');

    const update = await client.query(
      `UPDATE restaurants
          SET name        = $1,
              cuisine     = $2,
              address     = $3,
              rating      = $4,
              website_url = $5,
              image_url   = $6
        WHERE id = $7
        RETURNING id`,
      [data.name, data.cuisine, data.address, data.rating, data.website_url, data.image_url, id]
    );

    if (update.rows.length === 0) {
      throw new NotFoundError('Restaurant not found');
    }

    await client.query('DELETE FROM restaurant_tags WHERE restaurant_id = $1', [id]);
    await writeRestaurantTags(client, id, data.tagSlugs);

    const { rows } = await client.query(SELECT_RESTAURANT_BY_ID, [id]);
    await client.query('COMMIT');
    return NextResponse.json(toRestaurant(rows[0]), { status: 200 });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    return handleError(err);
  } finally {
    client.release();
  }
}

/**
 * DELETE /api/restaurants/:id
 * Delete a restaurant (visits + tag rows cascade). 204 on success, 404 if missing.
 */
export async function DELETE(_req: Request, { params }: Params) {
  try {
    const id = parseRestaurantId(params.id);
    const { rows } = await pool.query(
      'DELETE FROM restaurants WHERE id = $1 RETURNING id',
      [id]
    );

    if (rows.length === 0) {
      throw new NotFoundError('Restaurant not found');
    }

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return handleError(err);
  }
}
