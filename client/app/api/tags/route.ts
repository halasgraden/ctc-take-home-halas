import { NextResponse } from 'next/server';
import { pool } from '@/db/pool';
import { handleError } from '@/lib/errors';
import { toTag } from '@/lib/types';

// The tag vocabulary lives in the database, so this must be read per request -
// otherwise Next prerenders it at build time and serves a stale snapshot.
export const dynamic = 'force-dynamic';

/**
 * GET /api/tags
 * Returns the canonical tag vocabulary. Populated by migration 002.
 */
export async function GET() {
  try {
    const { rows } = await pool.query(
      'SELECT id, slug, label FROM tags ORDER BY label ASC'
    );
    return NextResponse.json(rows.map(toTag), { status: 200 });
  } catch (err) {
    return handleError(err);
  }
}
