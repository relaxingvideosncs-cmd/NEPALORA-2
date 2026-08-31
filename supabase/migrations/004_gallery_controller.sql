-- ==========================================================
-- Migration 004: Clean Cloudinary Gallery Controller System
-- ==========================================================

CREATE TABLE IF NOT EXISTS gallery_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gallery_slot TEXT NOT NULL, -- 'hero-slideshow' | 'home-grid' | 'polaroid-prepare' | 'polaroid-trekking' | 'polaroid-recovery' | 'main-gallery'
    title TEXT NOT NULL,
    caption TEXT,
    location TEXT,
    category TEXT, -- 'trekking-adventure' | 'prepare-for-nepal' | 'recovery-healing' | etc.
    image_url TEXT NOT NULL,
    alt_text TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gallery_items_slot_order ON gallery_items (gallery_slot, is_active, display_order ASC);

CREATE TRIGGER set_gallery_items_updated_at
BEFORE UPDATE ON gallery_items
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security
ALTER TABLE gallery_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on active gallery items"
    ON gallery_items FOR SELECT
    USING (is_active = true);

CREATE POLICY "Allow authenticated staff to manage gallery items"
    ON gallery_items FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
