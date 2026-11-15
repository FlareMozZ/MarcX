-- ========================================================================
-- SUPABASE POSTGRESQL SCHEMAS FOR UNIFIED PRODUCTION ARCHITECTURE
-- Tables: categories, ideas, canvases, canvas_nodes
-- ========================================================================

-- Drop deprecated/redundant tables if migrating
-- DROP TABLE IF EXISTS canvas_nodes CASCADE;
-- DROP TABLE IF EXISTS canvases CASCADE;
-- DROP TABLE IF EXISTS ideas CASCADE;
-- DROP TABLE IF EXISTS categories CASCADE;

-- 1. Table: categories
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    icon_color TEXT NOT NULL DEFAULT '#938ab3',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Table: ideas
-- Stores standard concept cards, library assets, and notebook items.
CREATE TABLE IF NOT EXISTS ideas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    domain_tag TEXT NOT NULL DEFAULT 'Computer Science',
    feasibility TEXT NOT NULL DEFAULT 'Micro-MVP',
    status TEXT NOT NULL DEFAULT 'Inbox',
    tech_stacks TEXT[] NOT NULL DEFAULT '{}',
    year TEXT NOT NULL DEFAULT '2026',
    type TEXT NOT NULL DEFAULT 'item', -- 'item' | 'notebook'
    color TEXT NOT NULL DEFAULT 'lilac', -- 'lilac' | 'sky' | 'mint' | 'peach'
    comments JSONB DEFAULT '[]'::jsonb,
    notion_blocks JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Table: canvases
-- Stores whiteboard metadata and connections links.
CREATE TABLE IF NOT EXISTS canvases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'New Canvas',
    description TEXT DEFAULT 'An empty spatial research workspace canvas.',
    domain_tag TEXT NOT NULL DEFAULT 'Architectural',
    color TEXT NOT NULL DEFAULT 'sky',
    zoom_scale DOUBLE PRECISION DEFAULT 1.0,
    pan_x DOUBLE PRECISION DEFAULT 0.0,
    pan_y DOUBLE PRECISION DEFAULT 0.0,
    connections JSONB DEFAULT '[]'::jsonb, -- Store flowchart linkages: [{ "from": "id1", "to": "id2" }]
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Table: canvas_nodes
-- Stores spatial cards placed on a specific canvas board.
CREATE TABLE IF NOT EXISTS canvas_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    canvas_id UUID NOT NULL REFERENCES canvases(id) ON DELETE CASCADE,
    type TEXT NOT NULL DEFAULT 'note', -- 'note' | 'image' | 'video' | 'item'
    title TEXT NOT NULL,
    content TEXT DEFAULT '', -- Text content for notes, URL/link for images/videos
    x DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    y DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    width DOUBLE PRECISION NOT NULL DEFAULT 300.0,
    height DOUBLE PRECISION NOT NULL DEFAULT 250.0,
    item_id UUID REFERENCES ideas(id) ON DELETE SET NULL, -- optional link to standard library item
    code_snippet TEXT DEFAULT NULL,
    resource_url TEXT DEFAULT NULL,
    resource_title TEXT DEFAULT NULL,
    files JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================================================
-- 5. High-Performance Speed Indexes
-- ========================================================================
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);
CREATE INDEX IF NOT EXISTS idx_ideas_domain_id ON ideas(domain_id);
CREATE INDEX IF NOT EXISTS idx_ideas_type_status ON ideas(type, status);
CREATE INDEX IF NOT EXISTS idx_canvases_domain_id ON canvases(domain_id);
CREATE INDEX IF NOT EXISTS idx_canvas_nodes_canvas_id ON canvas_nodes(canvas_id);
CREATE INDEX IF NOT EXISTS idx_canvas_nodes_item_id ON canvas_nodes(item_id);

-- ========================================================================
-- 6. Row Level Security (RLS) Hardening
-- ========================================================================
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE canvases ENABLE ROW LEVEL SECURITY;
ALTER TABLE canvas_nodes ENABLE ROW LEVEL SECURITY;

-- 7. Granular CRUD policies to authorize public/client proxies
-- Categories Policies
CREATE POLICY "Allow select on categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Allow insert on categories" ON categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on categories" ON categories FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete on categories" ON categories FOR DELETE USING (true);

-- Ideas Policies
CREATE POLICY "Allow select on ideas" ON ideas FOR SELECT USING (true);
CREATE POLICY "Allow insert on ideas" ON ideas FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on ideas" ON ideas FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete on ideas" ON ideas FOR DELETE USING (true);

-- Canvases Policies
CREATE POLICY "Allow select on canvases" ON canvases FOR SELECT USING (true);
CREATE POLICY "Allow insert on canvases" ON canvases FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on canvases" ON canvases FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete on canvases" ON canvases FOR DELETE USING (true);

-- Canvas Nodes Policies
CREATE POLICY "Allow select on canvas_nodes" ON canvas_nodes FOR SELECT USING (true);
CREATE POLICY "Allow insert on canvas_nodes" ON canvas_nodes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on canvas_nodes" ON canvas_nodes FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete on canvas_nodes" ON canvas_nodes FOR DELETE USING (true);
