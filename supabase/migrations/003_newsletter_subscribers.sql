-- ==========================================================
-- Migration 003: Newsletter Subscribers & PDF Download Leads
-- ==========================================================

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    source TEXT DEFAULT 'download_guide_pdf',
    article_slug TEXT,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscribers_email ON newsletter_subscribers (email);
CREATE INDEX IF NOT EXISTS idx_subscribers_created ON newsletter_subscribers (created_at DESC);

-- Enable RLS
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Allow public lead capture insertion
DROP POLICY IF EXISTS "Allow anonymous subscriber insertion" ON newsletter_subscribers;
CREATE POLICY "Allow anonymous subscriber insertion"
ON newsletter_subscribers FOR INSERT
WITH CHECK (true);

-- Allow reading subscribers for staff / API
DROP POLICY IF EXISTS "Allow reading subscribers" ON newsletter_subscribers;
CREATE POLICY "Allow reading subscribers"
ON newsletter_subscribers FOR SELECT
USING (true);
