'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { createRestaurant, ApiError } from '@/lib/apiClient';
import type { Tag } from '@/lib/types';

type Status = 'idle' | 'submitting' | 'error';

// Trimmed empty strings should become nulls so the API validator treats them
// as absent (rather than "" that would fail URL/length checks).
function optional(value: string): string | null {
  const t = value.trim();
  return t === '' ? null : t;
}

export function AddRestaurantForm({ tags }: { tags: Tag[] }) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    const name = String(data.get('name') ?? '').trim();
    if (name === '') {
      setStatus('error');
      setError('Name is required.');
      form.querySelector<HTMLInputElement>('#name')?.focus();
      return;
    }

    const ratingRaw = String(data.get('rating') ?? '').trim();
    let rating: number | null = null;
    if (ratingRaw !== '') {
      const parsed = Number(ratingRaw);
      if (!Number.isFinite(parsed) || parsed < 0 || parsed > 5) {
        setStatus('error');
        setError('Rating must be a number between 0 and 5.');
        form.querySelector<HTMLInputElement>('#rating')?.focus();
        return;
      }
      rating = parsed;
    }

    const selectedTags = data.getAll('tags').map((v) => String(v));

    setStatus('submitting');
    setError(null);
    try {
      await createRestaurant({
        name,
        cuisine: optional(String(data.get('cuisine') ?? '')),
        address: optional(String(data.get('address') ?? '')),
        rating,
        website_url: optional(String(data.get('website_url') ?? '')),
        image_url: optional(String(data.get('image_url') ?? '')),
        tags: selectedTags,
      });
      router.push('/');
      router.refresh();
    } catch (err) {
      setStatus('error');
      setError(
        err instanceof ApiError
          ? err.message
          : 'Something went wrong. Please try again.'
      );
    }
  }

  const disabled = status === 'submitting';

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {error && (
        <div
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800"
        >
          {error}
        </div>
      )}

      <Field id="name" label="Name" required>
        <input
          id="name"
          name="name"
          type="text"
          required
          maxLength={120}
          autoComplete="off"
          className={inputClass}
        />
      </Field>

      <Field id="cuisine" label="Cuisine">
        <input
          id="cuisine"
          name="cuisine"
          type="text"
          maxLength={80}
          autoComplete="off"
          className={inputClass}
        />
      </Field>

      <Field id="address" label="Address">
        <input
          id="address"
          name="address"
          type="text"
          maxLength={200}
          autoComplete="off"
          className={inputClass}
        />
      </Field>

      <Field id="rating" label="Rating (0-5)" hint="Optional. One decimal is fine, e.g. 4.5.">
        <input
          id="rating"
          name="rating"
          type="number"
          min={0}
          max={5}
          step="0.1"
          inputMode="decimal"
          className={inputClass}
        />
      </Field>

      <Field
        id="website_url"
        label="Website URL"
        hint="Must start with http:// or https://."
      >
        <input
          id="website_url"
          name="website_url"
          type="url"
          maxLength={2048}
          placeholder="https://example.com"
          autoComplete="off"
          className={inputClass}
        />
      </Field>

      <Field id="image_url" label="Image URL" hint="Publicly reachable image URL.">
        <input
          id="image_url"
          name="image_url"
          type="url"
          maxLength={2048}
          placeholder="https://example.com/photo.jpg"
          autoComplete="off"
          className={inputClass}
        />
      </Field>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-slate-900">
          Community-owned tags
        </legend>
        <p className="text-xs text-slate-600">
          Pick any that apply. Only mark what you know to be self-reported or verified.
        </p>
        <ul role="list" className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <li key={tag.id}>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1 text-sm text-slate-800 hover:bg-slate-50 has-[:checked]:border-emerald-600 has-[:checked]:bg-emerald-50 has-[:checked]:text-emerald-900 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-emerald-600 has-[:focus-visible]:ring-offset-2">
                <input
                  type="checkbox"
                  name="tags"
                  value={tag.slug}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600"
                />
                <span>{tag.label}</span>
              </label>
            </li>
          ))}
        </ul>
      </fieldset>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={disabled}
          className="inline-flex items-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {disabled ? 'Adding...' : 'Add restaurant'}
        </button>
        <a
          href="/"
          className="rounded text-sm font-medium text-slate-700 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}

const inputClass =
  'block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600';

function Field({
  id,
  label,
  hint,
  required,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-slate-900">
        {label}
        {required && (
          <>
            {' '}
            <span aria-hidden="true" className="text-red-600">*</span>
            <span className="sr-only"> (required)</span>
          </>
        )}
      </label>
      {children}
      {hint && (
        <p className="text-xs text-slate-500">{hint}</p>
      )}
    </div>
  );
}
