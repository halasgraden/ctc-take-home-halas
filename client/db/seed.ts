import { pool } from './pool';

/**
 * Seed the database with sample data: 5 restaurants, 3 visits, and a handful
 * of tag associations.
 *
 * Run with: npm run seed
 *
 * Clears existing rows first so re-seeding gives you a clean, predictable set.
 * Ownership tags below are illustrative sample data - they are curated
 * classifications, not inferred from the restaurant name or cuisine.
 */

const restaurants = [
  {
    name: 'The Rusty Spoon',
    cuisine: 'American',
    address: '12 Main St',
    rating: 4.5,
    website_url: 'https://example.com/rusty-spoon',
    image_url:
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=60',
    tags: ['locally-owned'],
  },
  {
    name: 'Sakura House',
    cuisine: 'Japanese',
    address: '88 Cherry Ln',
    rating: 4.8,
    website_url: 'https://example.com/sakura-house',
    image_url:
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=60',
    tags: ['immigrant-owned', 'sustainable'],
  },
  {
    name: 'Bella Napoli',
    cuisine: 'Italian',
    address: '301 Olive Ave',
    rating: 4.2,
    website_url: 'https://example.com/bella-napoli',
    image_url:
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=60',
    tags: ['locally-owned', 'women-owned'],
  },
  {
    name: 'El Fuego',
    cuisine: 'Mexican',
    address: '47 Sol Blvd',
    rating: 4.6,
    website_url: 'https://example.com/el-fuego',
    image_url:
      'https://images.unsplash.com/photo-1552332386-f8dd00dc2f85?auto=format&fit=crop&w=800&q=60',
    tags: ['lgbtq-owned', 'locally-owned'],
  },
  {
    name: 'Green Bowl',
    cuisine: 'Vegetarian',
    address: '5 Garden Way',
    rating: 3.9,
    website_url: 'https://example.com/green-bowl',
    image_url:
      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=60',
    tags: ['sustainable', 'women-owned'],
  },
];

const visits = [
  { restaurantIndex: 0, date: '2026-01-12', amountSpent: 42.5, notes: 'Burger night with the crew.' },
  { restaurantIndex: 1, date: '2026-02-03', amountSpent: 88.0, notes: 'Omakase. Worth every penny.' },
  { restaurantIndex: 3, date: '2026-03-21', amountSpent: 31.75, notes: 'Tacos to go.' },
];

async function seed(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Wipe and reset identity so ids are stable between seeds. CASCADE also
    // clears restaurant_tags rows that reference these restaurants.
    await client.query('TRUNCATE visits, restaurants RESTART IDENTITY CASCADE');

    const restaurantIds: number[] = [];
    for (const r of restaurants) {
      const { rows } = await client.query(
        `INSERT INTO restaurants (name, cuisine, address, rating, website_url, image_url)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [r.name, r.cuisine, r.address, r.rating, r.website_url, r.image_url]
      );
      const id = rows[0].id as number;
      restaurantIds.push(id);

      if (r.tags.length > 0) {
        await client.query(
          `INSERT INTO restaurant_tags (restaurant_id, tag_id)
             SELECT $1, id FROM tags WHERE slug = ANY($2::text[])`,
          [id, r.tags]
        );
      }
    }

    for (const v of visits) {
      await client.query(
        `INSERT INTO visits ("restaurantId", date, "amountSpent", notes)
         VALUES ($1, $2, $3, $4)`,
        [restaurantIds[v.restaurantIndex], v.date, v.amountSpent, v.notes]
      );
    }

    await client.query('COMMIT');
    console.log(`Seeded ${restaurants.length} restaurants and ${visits.length} visits.`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

seed()
  .then(() => pool.end())
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err);
    pool.end().finally(() => process.exit(1));
  });
