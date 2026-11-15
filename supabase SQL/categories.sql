-- ========================================================================
-- SUPABASE POSTGRESQL TABLES FOR CATEGORIES & SYSTEM DOMAINS
-- File: /supabase SQL/categories.sql
-- ========================================================================

-- 1. Main category domains query lookup table
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT DEFAULT 'Categorized micro-framework blueprint container.',
    icon_color TEXT NOT NULL DEFAULT '#938ab3', -- Hex code or CSS indicator class
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Populate standard preset directories matching the compiler defaults
INSERT INTO categories (id, name, description, icon_color) VALUES
('b1a7d6ff-4bd8-49f9-aa2b-b83b3e2b2026', 'Full-Chain Auditing', 'Unified visual traces, contract verifications, and gas-usage models.', '#938ab3'),
('c5e9134a-939e-4eec-8ab3-c20e2efda202', 'Halcyon VM Archetype', 'Core sandboxed bytecode executions, VM states, and registers.', '#6293a3')
ON CONFLICT (name) DO NOTHING;

-- 3. Security Hardening - Enable Row Level Security (RLS)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- 4. Dynamic Access Control Policies
CREATE POLICY "Allow public read access" ON categories FOR SELECT USING (true);
CREATE POLICY "Allow public creation access" ON categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON categories FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete access" ON categories FOR DELETE USING (true);
