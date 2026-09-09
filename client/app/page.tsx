import Link from 'next/link';
import { RestaurantCard } from '@/components/RestaurantCard';
import { getRestaurants } from '@/lib/apiClient';
import type { Restaurant } from '@/lib/types';

// Server component. Fetches restaurants on each request and renders them as a
// responsive card grid. Handles empty and error states inline.
export default async function HomePage() {
  let restaurants: Restaurant[] = [];
  let loadError: string | null = null;

  try {
    restaurants = await getRestaurants();
  } catch (err) {
    loadError =
      err instanceof Error && err.message
        ? err.message
        : 'Something went wrong loading restaurants.';
  }

  return (
    <section aria-labelledby="restaurants-heading" className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h2 id="restaurants-heading" className="text-2xl font-semibold text-slate-900">
            Restaurants
          </h2>
        </div>
      </div>

      {loadError ? (
        <div
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          <p className="font-medium">We couldn&rsquo;t load restaurants right now.</p>
          <p className="mt-1">{loadError}</p>
        </div>
      ) : restaurants.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
          <h3 className="text-base font-semibold text-slate-900">No restaurants yet</h3>
          <p className="mt-1 text-sm text-slate-600">
            Add the first one to get started.
          </p>
          <Link
            href="/restaurants/new"
            className="mt-4 inline-flex items-center rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
          >
            Add a restaurant
          </Link>
        </div>
      ) : (
        <ul
          role="list"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {restaurants.map((restaurant) => (
            <li key={restaurant.id}>
              <RestaurantCard restaurant={restaurant} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
