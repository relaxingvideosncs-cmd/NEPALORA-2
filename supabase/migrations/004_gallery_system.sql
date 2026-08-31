-- ==========================================================
-- Migration 004: Pure Cloudinary Gallery System (5 Galleries)
-- ==========================================================

-- Clean up any previous experimental tables
DROP TABLE IF EXISTS gallery_items CASCADE;
DROP TABLE IF EXISTS gallery_photos CASCADE;

-- Create gallery_photos table
CREATE TABLE gallery_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gallery_slot TEXT NOT NULL, -- 'hero', 'home_grid', 'prepare_polaroid', 'trekking_polaroid', 'recovery_polaroid'
    image_url TEXT NOT NULL, -- Cloudinary secure image URL
    title TEXT NOT NULL, -- Image short title
    description TEXT, -- Description / Caption / Handwritten text
    location TEXT, -- Location (e.g., Poon Hill, Upper Mustang, Pokhara)
    seo_alt TEXT, -- SEO Alt text
    seo_keywords TEXT[], -- SEO keywords / tags
    like_count INTEGER NOT NULL DEFAULT 0, -- Persistent like counter
    display_order INTEGER NOT NULL DEFAULT 0, -- Display order in gallery
    is_active BOOLEAN NOT NULL DEFAULT TRUE, -- Published / Live status
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for lightning fast lookups
CREATE INDEX idx_gallery_photos_slot_active_order 
    ON gallery_photos (gallery_slot, is_active, display_order ASC);

-- Updated_at trigger function
CREATE TRIGGER set_gallery_photos_updated_at
BEFORE UPDATE ON gallery_photos
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Atomic like increment function
CREATE OR REPLACE FUNCTION increment_gallery_photo_like(photo_id UUID)
RETURNS INTEGER AS $$
DECLARE
    new_count INTEGER;
BEGIN
    UPDATE gallery_photos
    SET like_count = like_count + 1
    WHERE id = photo_id
    RETURNING like_count INTO new_count;
    
    RETURN new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Row Level Security (RLS)
ALTER TABLE gallery_photos ENABLE ROW LEVEL SECURITY;

-- Allow full access for server API routes and public reads
CREATE POLICY "Allow all operations on gallery photos"
    ON gallery_photos FOR ALL
    USING (true)
    WITH CHECK (true);

-- Allow public to increment like count
GRANT EXECUTE ON FUNCTION increment_gallery_photo_like(UUID) TO anon, authenticated;
