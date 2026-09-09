import { NextResponse } from 'next/server';
import { pool } from '@/db/pool';
import { handleError } from '@/lib/errors';
import { SELECT_RESTAURANTS, writeRestaurantTags } from '@/lib/restaurants';
import { toRestaurant } from '@/lib/types';
import { validateRestaurantBody } from '@/lib/validation';

/**
 * GET /api/restaurants
 * Returns all restaurants (newest first), each with its tag list.
 */
export async function GET() {
  try {
    const { rows } = await pool.query(
      `${SELECT_RESTAURANTS} ORDER BY r.created_at DESC`
    );
    return NextResponse.json(rows.map(toRestaurant), { status: 200 });
  } catch (err) {
    return handleError(err);
  }
}

/**
 * POST /api/restaurants
 * Create a new restaurant. Tag associations are inserted in the same
 * transaction as the restaurant row - an invalid tag slug rolls the whole
 * thing back with a 400.
 */
export async function POST(req: Request) {
  const client = await pool.connect();
  try {
    const data = validateRestaurantBody(await req.json());

    await client.query('BEGIN');

    const insert = await client.query(
      `INSERT INTO restaurants (name, cuisine, address, rating, website_url, image_url)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [data.name, data.cuisine, data.address, data.rating, data.website_url, data.image_url]
    );
    const id = insert.rows[0].id as number;

    await writeRestaurantTags(client, id, data.tagSlugs);

    const { rows } = await client.query(
      `${SELECT_RESTAURANTS} WHERE r.id = $1`,
      [id]
    );

    await client.query('COMMIT');
    return NextResponse.json(toRestaurant(rows[0]), { status: 201 });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    return handleError(err);
  } finally {
    client.release();
  }
}
