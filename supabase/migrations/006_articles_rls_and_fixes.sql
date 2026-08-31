-- ==========================================================
-- Migration 006: Comprehensive Articles RLS & Full Persistence
-- ==========================================================

-- 1. Ensure RLS on articles permits full server and staff operations
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read on published articles" ON articles;
DROP POLICY IF EXISTS "Allow authenticated staff to select all articles" ON articles;
DROP POLICY IF EXISTS "Allow authenticated staff to insert articles" ON articles;
DROP POLICY IF EXISTS "Allow authenticated staff to update articles" ON articles;
DROP POLICY IF EXISTS "Allow authenticated staff to delete articles" ON articles;
DROP POLICY IF EXISTS "Allow all operations on articles" ON articles;

-- Grant all operations so API routes and staff can seamlessly publish and draft articles
CREATE POLICY "Allow all operations on articles"
    ON articles FOR ALL
    USING (true)
    WITH CHECK (true);

-- 2. Categories permissions
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read on categories" ON categories;
DROP POLICY IF EXISTS "Allow authenticated staff to manage categories" ON categories;
DROP POLICY IF EXISTS "Allow all operations on categories" ON categories;

CREATE POLICY "Allow all operations on categories"
    ON categories FOR ALL
    USING (true)
    WITH CHECK (true);

-- 3. Tags and Article Tags permissions
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations on tags" ON tags;
CREATE POLICY "Allow all operations on tags"
    ON tags FOR ALL
    USING (true)
    WITH CHECK (true);

ALTER TABLE article_tags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations on article_tags" ON article_tags;
CREATE POLICY "Allow all operations on article_tags"
    ON article_tags FOR ALL
    USING (true)
    WITH CHECK (true);
