'use client';

import { useState } from 'react';

// Renders the restaurant image with a graceful fallback: if the URL is missing
// or the image fails to load, we show a themed placeholder that still carries
// the restaurant name for screen readers.
export function RestaurantImage({
  src,
  name,
}: {
  src: string | null;
  name: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        role="img"
        aria-label={name}
        className="flex h-40 w-full items-center justify-center bg-gradient-to-br from-emerald-200 to-emerald-500"
      >
        <span aria-hidden="true" className="text-3xl font-semibold text-white">
          {name.slice(0, 1).toUpperCase()}
        </span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={name}
      loading="lazy"
      onError={() => setFailed(true)}
      className="h-40 w-full object-cover"
    />
  );
}
