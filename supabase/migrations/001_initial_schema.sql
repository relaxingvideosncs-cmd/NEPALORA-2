-- ==========================================================
-- Migration 001: Initial Schema
-- ==========================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ----------------------------------------------------------
-- 1. Helper Functions
-- ----------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------
-- 2. Categories Table
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_categories_updated_at
BEFORE UPDATE ON categories
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Seed initial categories if not existing
INSERT INTO categories (name, slug, description)
VALUES 
    ('Prepare for Nepal', 'prepare-for-nepal', 'Essential information, visas, packing, safety, and cultural etiquette for travelers visiting Nepal.'),
    ('Trekking & Adventure', 'trekking-adventure', 'Comprehensive guides for Himalayan trekking routes, permits, difficulty levels, and mountain safety.'),
    ('Recovery & Healing', 'recovery-healing', 'Post-trek wellness, yoga, meditation, breathwork, Ayurveda, and healing retreats in Nepal.')
ON CONFLICT (slug) DO NOTHING;

-- ----------------------------------------------------------
-- 3. Tags Table
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tags_slug ON tags (slug);

-- ----------------------------------------------------------
-- 4. Media Table
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cloudinary_public_id TEXT NOT NULL UNIQUE,
    secure_url TEXT NOT NULL,
    width INTEGER,
    height INTEGER,
    format VARCHAR(50),
    alt_text TEXT,
    title TEXT,
    caption TEXT,
    credit TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_media_updated_at
BEFORE UPDATE ON media
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------
-- 5. Articles Table
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(500) NOT NULL UNIQUE,
    excerpt TEXT NOT NULL,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    content_json JSONB NOT NULL,
    featured_image_id UUID REFERENCES media(id) ON DELETE SET NULL,
    author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    seo_title VARCHAR(255),
    seo_description TEXT,
    canonical_url TEXT,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    view_count INTEGER NOT NULL DEFAULT 0,
    search_vector TSVECTOR
);

CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles (slug);
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles (category_id);
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles (status);
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles (published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_is_featured ON articles (is_featured);

CREATE TRIGGER set_articles_updated_at
BEFORE UPDATE ON articles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Function & Trigger to maintain Full-Text Search Vector
CREATE OR REPLACE FUNCTION articles_search_vector_update()
RETURNS TRIGGER AS $$
DECLARE
    content_text TEXT := '';
    block_record RECORD;
BEGIN
    -- Extract plain text from content_json blocks
    IF NEW.content_json IS NOT NULL AND jsonb_typeof(NEW.content_json->'blocks') = 'array' THEN
        FOR block_record IN SELECT * FROM jsonb_array_elements(NEW.content_json->'blocks')
        LOOP
            IF block_record.value->>'text' IS NOT NULL THEN
                content_text := content_text || ' ' || (block_record.value->>'text');
            END IF;
        END LOOP;
    END IF;

    NEW.search_vector := 
        setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(NEW.excerpt, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(NEW.seo_title, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(NEW.seo_description, '')), 'C') ||
        setweight(to_tsvector('english', coalesce(content_text, '')), 'D');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_articles_search_vector
BEFORE INSERT OR UPDATE ON articles
FOR EACH ROW
EXECUTE FUNCTION articles_search_vector_update();

CREATE INDEX IF NOT EXISTS idx_articles_search_vector ON articles USING GIN (search_vector);

-- ----------------------------------------------------------
-- 6. Article Tags Relationship
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS article_tags (
    article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (article_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_article_tags_tag ON article_tags (tag_id);

-- ----------------------------------------------------------
-- 7. Advertising Architecture
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS ad_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    location VARCHAR(100) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ad_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slot_id UUID NOT NULL REFERENCES ad_slots(id) ON DELETE CASCADE,
    provider VARCHAR(100) NOT NULL,
    configuration JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_ad_slots_updated_at
BEFORE UPDATE ON ad_slots
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_ad_configurations_updated_at
BEFORE UPDATE ON ad_configurations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Seed initial reusable ad slots
INSERT INTO ad_slots (name, slug, location, description)
VALUES
    ('Homepage Top', 'homepage-top', 'homepage', 'Top banner slot on the homepage.'),
    ('Homepage Between Sections', 'homepage-between-sections', 'homepage', 'Slot between content discovery sections on the homepage.'),
    ('Category Top', 'category-top', 'category', 'Top banner slot on category pages.'),
    ('Category Between Articles', 'category-between-articles', 'category', 'Slot inserted between articles in category listings.'),
    ('Article Top', 'article-top', 'article', 'Slot right below article header/hero.'),
    ('Article Middle', 'article-middle', 'article', 'Slot within the article body flow.'),
    ('Article Bottom', 'article-bottom', 'article', 'Slot at the end of article content.')
ON CONFLICT (slug) DO NOTHING;

-- ----------------------------------------------------------
-- 8. Site Settings
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS site_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) NOT NULL UNIQUE,
    value JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------
-- 9. Row Level Security (RLS) Policies
-- ----------------------------------------------------------
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Categories RLS
CREATE POLICY "Allow public read on categories"
    ON categories FOR SELECT
    USING (true);

CREATE POLICY "Allow authenticated staff to manage categories"
    ON categories FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Tags RLS
CREATE POLICY "Allow public read on tags"
    ON tags FOR SELECT
    USING (true);

CREATE POLICY "Allow authenticated staff to manage tags"
    ON tags FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Media RLS
CREATE POLICY "Allow public read on media"
    ON media FOR SELECT
    USING (true);

CREATE POLICY "Allow authenticated staff to manage media"
    ON media FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Articles RLS
CREATE POLICY "Allow public read on published articles"
    ON articles FOR SELECT
    USING (status = 'published');

CREATE POLICY "Allow authenticated staff to select all articles"
    ON articles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated staff to insert articles"
    ON articles FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated staff to update articles"
    ON articles FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow authenticated staff to delete articles"
    ON articles FOR DELETE
    TO authenticated
    USING (true);

-- Article Tags RLS
CREATE POLICY "Allow public read on article tags for published articles"
    ON article_tags FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM articles
            WHERE articles.id = article_tags.article_id
            AND (articles.status = 'published' OR auth.role() = 'authenticated')
        )
    );

CREATE POLICY "Allow authenticated staff to manage article tags"
    ON article_tags FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Ad Slots RLS
CREATE POLICY "Allow public read on ad slots"
    ON ad_slots FOR SELECT
    USING (is_active = true);

CREATE POLICY "Allow authenticated staff to manage ad slots"
    ON ad_slots FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Ad Configurations RLS
CREATE POLICY "Allow public read on active ad configurations"
    ON ad_configurations FOR SELECT
    USING (is_active = true);

CREATE POLICY "Allow authenticated staff to manage ad configurations"
    ON ad_configurations FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Site Settings RLS
CREATE POLICY "Allow public read on site settings"
    ON site_settings FOR SELECT
    USING (true);

CREATE POLICY "Allow authenticated staff to manage site settings"
    ON site_settings FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
