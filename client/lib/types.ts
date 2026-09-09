/**
 * The data shapes the API speaks, in one place.
 *
 * Both sides of the boundary import from here: the route handlers in
 * `app/api/` that produce these objects, and `lib/apiClient.ts` that consumes
 * them. Neither side owns the definition.
 *
 * Alongside each interface is a `toX()` mapper that converts a raw database row
 * into that shape. You need them because `pg` does not hand back the types you
 * might expect:
 *
 *   - `NUMERIC` columns (`rating`, `amountSpent`) arrive as **strings**
 *     ("4.5", not 4.5). node-postgres does this on purpose - NUMERIC has more
 *     precision than a JS number, so parsing it automatically could lose data.
 *   - `DATE` and `TIMESTAMPTZ` columns arrive as **Date objects**, which
 *     `JSON.stringify` turns into full ISO timestamps. For a calendar date like
 *     `visits.date` that's wrong twice over: it invents a time, and it shifts
 *     the day depending on the server's timezone.
 *
 * Returning `rows` straight from a query therefore does *not* match the
 * contract in CHALLENGE.md. Run rows through these mappers instead.
 *
 * NOTE: these are TypeScript types. They are erased at build time and validate
 * nothing at runtime - a body that claims to be a Restaurant is still just
 * `unknown` until you check it. That check is your job (task A3).
 */

export interface Tag {
  id: number;
  slug: string;
  label: string;
}

export interface Restaurant {
  id: number;
  name: string;
  cuisine: string | null;
  address: string | null;
  /** 0-5. A real number in JSON, not a string. */
  rating: number | null;
  website_url: string | null;
  image_url: string | null;
  tags: Tag[];
  /** ISO 8601 timestamp, e.g. "2026-01-01T00:00:00.000Z" */
  created_at: string;
}

export interface Visit {
  id: number;
  restaurantId: number;
  /** Calendar date, "YYYY-MM-DD". No time, no timezone. */
  date: string;
  amountSpent: number | null;
  notes: string | null;
  /** ISO 8601 timestamp. */
  created_at: string;
}

// --- row mappers -------------------------------------------------------------

/** NUMERIC -> number, preserving null. */
function num(value: unknown): number | null {
  return value === null || value === undefined ? null : Number(value);
}

/** TIMESTAMPTZ -> ISO 8601 string. */
function isoTimestamp(value: unknown): string {
  return value instanceof Date ? value.toISOString() : String(value);
}

/**
 * DATE -> "YYYY-MM-DD".
 *
 * Uses the date's *local* parts, not `toISOString()`. `pg` builds the Date at
 * local midnight, so converting to UTC can roll it to the neighbouring day.
 */
function dateOnly(value: unknown): string {
  if (!(value instanceof Date)) return String(value);
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${value.getFullYear()}-${month}-${day}`;
}

function toTagArray(value: unknown): Tag[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((t) => t && typeof t === 'object' && (t as Record<string, unknown>).id != null)
    .map((t) => {
      const row = t as Record<string, unknown>;
      return {
        id: Number(row.id),
        slug: String(row.slug),
        label: String(row.label),
      };
    });
}

export function toTag(row: Record<string, unknown>): Tag {
  return {
    id: Number(row.id),
    slug: String(row.slug),
    label: String(row.label),
  };
}

/** Convert a `restaurants` row into the shape the API returns. */
export function toRestaurant(row: Record<string, unknown>): Restaurant {
  return {
    id: Number(row.id),
    name: String(row.name),
    cuisine: (row.cuisine as string | null) ?? null,
    address: (row.address as string | null) ?? null,
    rating: num(row.rating),
    website_url: (row.website_url as string | null) ?? null,
    image_url: (row.image_url as string | null) ?? null,
    tags: toTagArray(row.tags),
    created_at: isoTimestamp(row.created_at),
  };
}

/** Convert a `visits` row into the shape the API returns. */
export function toVisit(row: Record<string, unknown>): Visit {
  return {
    id: Number(row.id),
    restaurantId: Number(row.restaurantId),
    date: dateOnly(row.date),
    amountSpent: num(row.amountSpent),
    notes: (row.notes as string | null) ?? null,
    created_at: isoTimestamp(row.created_at),
  };
}
