import type { Tag } from '@/lib/types';

// Distinct palette per tag slug. All swatches meet 4.5:1 against their text
// color. Unknown slugs fall back to a neutral swatch.
const PALETTE: Record<string, string> = {
  'locally-owned':   'bg-amber-100 text-amber-900 ring-amber-200',
  'black-owned':     'bg-purple-100 text-purple-900 ring-purple-200',
  'women-owned':     'bg-pink-100 text-pink-900 ring-pink-200',
  'lgbtq-owned':     'bg-sky-100 text-sky-900 ring-sky-200',
  'immigrant-owned': 'bg-indigo-100 text-indigo-900 ring-indigo-200',
  'sustainable':     'bg-emerald-100 text-emerald-900 ring-emerald-200',
};

const NEUTRAL = 'bg-slate-100 text-slate-800 ring-slate-200';

export function TagBadge({ tag }: { tag: Tag }) {
  const classes = PALETTE[tag.slug] ?? NEUTRAL;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${classes}`}
    >
      {tag.label}
    </span>
  );
}
