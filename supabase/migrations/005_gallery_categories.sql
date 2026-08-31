-- ==========================================================
-- Migration 005: Gallery Photo Categories & Tagging
-- ==========================================================

-- 1. Create gallery_categories table
CREATE TABLE IF NOT EXISTS gallery_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Add updated_at trigger
CREATE TRIGGER set_gallery_categories_updated_at
BEFORE UPDATE ON gallery_categories
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 3. Add category column to gallery_photos if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'gallery_photos' AND column_name = 'category'
    ) THEN
        ALTER TABLE gallery_photos ADD COLUMN category TEXT DEFAULT 'Mountains & Landscapes';
    END IF;
END $$;

-- 4. Create indexes for rapid filtering
CREATE INDEX IF NOT EXISTS idx_gallery_categories_slug ON gallery_categories (slug);
CREATE INDEX IF NOT EXISTS idx_gallery_categories_active_order ON gallery_categories (is_active, display_order ASC);
CREATE INDEX IF NOT EXISTS idx_gallery_photos_category ON gallery_photos (category);

-- 5. Seed default gallery categories
INSERT INTO gallery_categories (name, slug, description, display_order)
VALUES
    ('Mountains & Landscapes', 'mountains-landscapes', 'Himalayan peaks, high passes, glacial valleys, and dramatic alpine scenery.', 1),
    ('Culture & Heritage', 'culture-heritage', 'Ancient Durbar squares, sacred temples, Newari architecture, and historical monuments.', 2),
    ('Food & Culinary', 'food-culinary', 'Authentic Nepali dishes, street food, dal bhat, momos, local teas, and Himalayan spices.', 3),
    ('People & Daily Life', 'people-life', 'Portraits of mountain communities, monks, artisans, and everyday life across Nepal.', 4),
    ('Monasteries & Sacred Sites', 'monasteries-sacred-sites', 'Buddhism, prayer flags, high-altitude gompas, and spiritual sanctuaries.', 5),
    ('Festivals & Celebrations', 'festivals-celebrations', 'Dashain, Tihar, Holi, Indra Jatra, Mani Rimdu, and vibrant cultural rituals.', 6),
    ('Wildlife & Nature', 'wildlife-nature', 'National parks, snow leopards, one-horned rhinos, rhododendron forests, and birdlife.', 7),
    ('Trekking & Adventure', 'trekking-adventure', 'Trail action, suspension bridges, base camps, rafting, and expedition moments.', 8)
ON CONFLICT (slug) DO NOTHING;

-- 6. Row Level Security (RLS)
ALTER TABLE gallery_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on gallery categories"
    ON gallery_categories FOR SELECT
    USING (true);

CREATE POLICY "Allow authenticated staff to manage gallery categories"
    ON gallery_categories FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
