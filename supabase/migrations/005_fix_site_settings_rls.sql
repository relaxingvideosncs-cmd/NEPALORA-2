-- ==========================================================
-- Migration 005: Fix Site Settings Row Level Security (RLS)
-- Enables seamless publishing of brand logos, favicons, and settings
-- ==========================================================

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated staff to manage site settings" ON site_settings;
DROP POLICY IF EXISTS "Allow public read on site settings" ON site_settings;
DROP POLICY IF EXISTS "Allow all operations on site settings" ON site_settings;

-- Allow read and management across public and server API routes
CREATE POLICY "Allow all operations on site settings"
    ON site_settings FOR ALL
    USING (true)
    WITH CHECK (true);
