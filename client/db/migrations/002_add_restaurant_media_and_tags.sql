-- Migration 002: restaurant media (image + website) and a normalized tag
-- vocabulary for community-owned restaurants.

ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS website_url TEXT,
  ADD COLUMN IF NOT EXISTS image_url   TEXT;

CREATE TABLE IF NOT EXISTS tags (
  id         SERIAL PRIMARY KEY,
  slug       TEXT NOT NULL UNIQUE,
  label      TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS restaurant_tags (
  restaurant_id INTEGER NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  tag_id        INTEGER NOT NULL REFERENCES tags(id)        ON DELETE RESTRICT,
  source_url    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (restaurant_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_restaurant_tags_tag_id ON restaurant_tags (tag_id);

INSERT INTO tags (slug, label) VALUES
  ('locally-owned',   'Locally owned'),
  ('black-owned',     'Black-owned'),
  ('women-owned',     'Women-owned'),
  ('lgbtq-owned',     'LGBTQ+-owned'),
  ('immigrant-owned', 'Immigrant-owned'),
  ('sustainable',     'Sustainable')
ON CONFLICT (slug) DO NOTHING;
