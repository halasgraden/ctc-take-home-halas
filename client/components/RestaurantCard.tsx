import type { Restaurant } from '@/lib/types';
import { ExternalLink } from './ExternalLink';
import { RestaurantImage } from './RestaurantImage';
import { TagBadge } from './TagBadge';

function hostFromUrl(url: string): string {
  try {
    return new URL(url).host.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  const { name, cuisine, address, rating, website_url, image_url, tags } = restaurant;

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md focus-within:shadow-md">
      <RestaurantImage src={image_url} name={name} />

      <div className="flex flex-1 flex-col gap-3 p-4">
        <header className="flex items-baseline justify-between gap-3">
          <h3 className="text-base font-semibold text-slate-900">{name}</h3>
          {rating != null && (
            <span className="whitespace-nowrap text-sm font-medium text-slate-600">
              <span aria-hidden="true">★ </span>
              <span>
                {rating.toFixed(1)}
                <span className="sr-only"> out of 5</span>
              </span>
            </span>
          )}
        </header>

        {(cuisine || address) && (
          <p className="text-sm text-slate-600">
            {cuisine && <span>{cuisine}</span>}
            {cuisine && address && <span aria-hidden="true"> · </span>}
            {address && <span>{address}</span>}
          </p>
        )}

        {tags.length > 0 && (
          <ul aria-label="Community-owned tags" className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <li key={tag.id}>
                <TagBadge tag={tag} />
              </li>
            ))}
          </ul>
        )}

        {website_url && (
          <div className="mt-auto pt-2">
            <ExternalLink
              href={website_url}
              className="inline-flex items-center gap-1 rounded text-sm font-medium text-emerald-700 underline underline-offset-2 hover:text-emerald-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
            >
              <span>Visit {hostFromUrl(website_url)}</span>
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-3.5 w-3.5"
              >
                <path d="M11 3a1 1 0 100 2h2.586L7.293 11.293a1 1 0 001.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
              </svg>
            </ExternalLink>
          </div>
        )}
      </div>
    </article>
  );
}
