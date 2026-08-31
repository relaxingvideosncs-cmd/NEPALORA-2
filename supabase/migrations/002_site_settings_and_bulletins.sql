-- ==========================================================
-- Migration 002: Comprehensive Site Settings & Bulletin System
-- ==========================================================

-- ----------------------------------------------------------
-- 1. Site Settings (Upgrade to Comprehensive Structured Table)
-- ----------------------------------------------------------
DROP TABLE IF EXISTS site_settings CASCADE;

CREATE TABLE site_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Brand
    brand_name TEXT NOT NULL DEFAULT 'Soul of Nepal',
    tagline TEXT DEFAULT 'Independent Nepal Travel, Trekking & Wellness Knowledge Base',
    description TEXT DEFAULT 'A JSON-first Nepal travel, trekking, adventure, recovery and wellness information platform.',

    -- Branding assets
    logo_url TEXT,
    full_logo_url TEXT,
    favicon_url TEXT,
    og_image_url TEXT,

    -- Business details
    legal_business_name TEXT DEFAULT 'Soul of Nepal Knowledge Platform',
    business_type TEXT DEFAULT 'Editorial & Publishing',
    founded_year INTEGER DEFAULT 2026,

    -- Contact
    email TEXT DEFAULT 'editorial@soulofnepal.com',
    support_email TEXT DEFAULT 'support@soulofnepal.com',
    phone TEXT,
    whatsapp TEXT,

    -- Address
    country TEXT DEFAULT 'Nepal',
    province TEXT,
    district TEXT,
    city TEXT DEFAULT 'Kathmandu',
    address TEXT,
    postal_code TEXT,

    -- Website
    website_url TEXT DEFAULT 'https://soulofnepal.com',

    -- Social media
    facebook_url TEXT,
    instagram_url TEXT,
    youtube_url TEXT,
    tiktok_url TEXT,
    linkedin_url TEXT,
    x_url TEXT,

    -- SEO defaults
    seo_title TEXT DEFAULT 'Soul of Nepal — Nepal Travel, Trekking & Wellness Platform',
    seo_description TEXT DEFAULT 'Comprehensive independent Nepal travel guides, Himalayan trekking routes, visa checklists, and post-trek holistic wellness sanctuaries.',
    seo_keywords TEXT[] DEFAULT ARRAY['nepal travel', 'himalayan trekking', 'everest base camp', 'annapurna circuit', 'nepal visa', 'yoga retreats nepal'],
    google_site_verification TEXT,

    -- Legal
    privacy_policy_url TEXT,
    terms_url TEXT,
    disclaimer_url TEXT,

    -- Status
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_site_settings_updated_at
BEFORE UPDATE ON site_settings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Seed initial default settings row
INSERT INTO site_settings (brand_name, tagline, description, email, country, city, website_url)
VALUES (
    'Soul of Nepal',
    'Independent Nepal Travel, Trekking & Wellness Knowledge Base',
    'A JSON-first Nepal travel, trekking, adventure, recovery and wellness information platform.',
    'editorial@soulofnepal.com',
    'Nepal',
    'Kathmandu',
    'https://soulofnepal.com'
);

-- ----------------------------------------------------------
-- 2. Bulletins Table (Notices & Announcement System)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS bulletins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Bulletin content
    title TEXT NOT NULL,
    notice TEXT NOT NULL,

    -- Optional image
    picture_url TEXT,

    -- Optional article connection
    article_id UUID REFERENCES articles(id) ON DELETE SET NULL,

    -- Optional external link
    link_url TEXT,

    -- Display period
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,

    -- Display settings
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    priority INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT bulletin_valid_dates
        CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_bulletins_active_dates ON bulletins (is_active, start_date, end_date, priority DESC);

CREATE TRIGGER set_bulletins_updated_at
BEFORE UPDATE ON bulletins
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------
-- 3. Row Level Security (RLS) Policies
-- ----------------------------------------------------------
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bulletins ENABLE ROW LEVEL SECURITY;

-- Site Settings RLS
CREATE POLICY "Allow public read on site settings"
    ON site_settings FOR SELECT
    USING (true);

CREATE POLICY "Allow authenticated staff to manage site settings"
    ON site_settings FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Bulletins RLS
CREATE POLICY "Allow public read on active bulletins within date window"
    ON bulletins FOR SELECT
    USING (
        is_active = true 
        AND NOW() >= start_date 
        AND NOW() <= end_date
    );

CREATE POLICY "Allow authenticated staff to manage bulletins"
    ON bulletins FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
