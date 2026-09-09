import Link from 'next/link';
import { AddRestaurantForm } from '@/components/AddRestaurantForm';
import { getTags } from '@/lib/apiClient';
import type { Tag } from '@/lib/types';

export const metadata = {
  title: 'Add a restaurant · Feeding Brennen',
};

// Fetches the tag vocabulary on the server, then hands it to the client form.
// If tags can't be loaded the form still works - we just render no chips.
export default async function NewRestaurantPage() {
  let tags: Tag[] = [];
  try {
    tags = await getTags();
  } catch {
    tags = [];
  }

  return (
    <section aria-labelledby="new-restaurant-heading" className="mx-auto max-w-xl space-y-6">
      <nav aria-label="Breadcrumb" className="text-sm">
        <Link
          href="/"
          className="rounded text-emerald-700 underline underline-offset-2 hover:text-emerald-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
        >
          ← Back to restaurants
        </Link>
      </nav>

      <header>
        <h2 id="new-restaurant-heading" className="text-2xl font-semibold text-slate-900">
          Add a restaurant
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Only mark ownership tags you know to be self-reported or verified.
        </p>
      </header>

      <AddRestaurantForm tags={tags} />
    </section>
  );
}
