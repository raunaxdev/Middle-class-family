-- ==============================================================================
-- GrihaLedger Database Schema
-- Production-ready PostgreSQL schema with Row Level Security (RLS) for Supabase
-- Zero Cost Architecture: Runs 100% within Supabase Free Tier limits
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. FAMILIES TABLE
CREATE TABLE IF NOT EXISTS public.families (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    join_code VARCHAR(12) NOT NULL UNIQUE,
    monthly_budget NUMERIC(12, 2) NOT NULL DEFAULT 45000.00,
    currency VARCHAR(5) NOT NULL DEFAULT 'INR',
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'public.families'::regclass
            AND conname = 'families_join_code_format'
    ) THEN
        ALTER TABLE public.families
            ADD CONSTRAINT families_join_code_format CHECK (join_code ~ '^[0-9]{6}$');
    END IF;
END;
$$;

-- Index on join_code for quick family lookups
CREATE INDEX IF NOT EXISTS idx_families_join_code ON public.families(join_code);

-- 3. FAMILY MEMBERS TABLE
CREATE TABLE IF NOT EXISTS public.family_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('Head', 'Member')),
    relation VARCHAR(50) NOT NULL DEFAULT 'Self',
    avatar_color VARCHAR(20) NOT NULL DEFAULT '#047857',
    phone VARCHAR(20),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_family_members_family ON public.family_members(family_id);
CREATE INDEX IF NOT EXISTS idx_family_members_user ON public.family_members(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_family_members_family_user
    ON public.family_members(family_id, user_id)
    WHERE user_id IS NOT NULL;

-- 4. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID REFERENCES public.families(id) ON DELETE CASCADE,
    slug VARCHAR(64) NOT NULL,
    name VARCHAR(100) NOT NULL,
    hindi_name VARCHAR(100),
    description TEXT,
    icon_name VARCHAR(50) NOT NULL DEFAULT 'ShoppingBag',
    monthly_budget NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_family_category_slug UNIQUE(family_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_categories_family ON public.categories(family_id);

-- 5. LEDGER ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.ledger_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    category_slug VARCHAR(64) NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    quantity VARCHAR(50) NOT NULL DEFAULT '1',
    unit VARCHAR(30) NOT NULL DEFAULT 'unit',
    expected_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    actual_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Bought', 'Paid', 'Settled')),
    recurrence VARCHAR(20) NOT NULL DEFAULT 'Monthly' CHECK (recurrence IN ('One-time', 'Daily', 'Monthly', 'Quarterly', 'Yearly')),
    due_date DATE,
    notes TEXT,
    created_by_name VARCHAR(150) NOT NULL DEFAULT 'Family Member',
    extra_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ledger_items_family ON public.ledger_items(family_id);
CREATE INDEX IF NOT EXISTS idx_ledger_items_category ON public.ledger_items(family_id, category_slug);
CREATE INDEX IF NOT EXISTS idx_ledger_items_status ON public.ledger_items(family_id, status);
CREATE INDEX IF NOT EXISTS idx_ledger_items_created_at ON public.ledger_items(family_id, created_at DESC);

-- 6. CHAT HISTORY TABLE ("Parivar AI")
CREATE TABLE IF NOT EXISTS public.chat_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    parsed_actions JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_history_family ON public.chat_history(family_id, created_at ASC);

-- 7. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user belongs to family
CREATE OR REPLACE FUNCTION public.current_user_family_ids()
RETURNS TABLE (family_id UUID) AS $$
BEGIN
    RETURN QUERY
    SELECT fm.family_id
    FROM public.family_members fm
    WHERE fm.user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION public.join_family_by_code(
    p_join_code TEXT,
    p_member_name TEXT,
    p_avatar_color TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_family_id UUID;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Authentication is required to join a family';
    END IF;

    IF p_join_code IS NULL OR p_join_code !~ '^[0-9]{6}$' THEN
        RAISE EXCEPTION 'Invalid 6-digit family join code';
    END IF;

    IF p_member_name IS NULL OR length(btrim(p_member_name)) = 0 OR length(btrim(p_member_name)) > 150 THEN
        RAISE EXCEPTION 'A valid member name is required';
    END IF;

    SELECT f.id INTO v_family_id
    FROM public.families f
    WHERE f.join_code = p_join_code;

    IF v_family_id IS NULL THEN
        RAISE EXCEPTION 'Invalid 6-digit family join code';
    END IF;

    INSERT INTO public.family_members (family_id, user_id, name, role, relation, avatar_color)
    VALUES (
        v_family_id,
        auth.uid(),
        btrim(p_member_name),
        'Member',
        'Member',
        CASE
            WHEN p_avatar_color IN ('#B45309', '#0284C7', '#7C3AED', '#D97706', '#2563EB')
                THEN p_avatar_color
            ELSE '#047857'
        END
    )
    ON CONFLICT (family_id, user_id) WHERE user_id IS NOT NULL DO NOTHING;

    RETURN v_family_id;
END;
$$;

REVOKE ALL ON FUNCTION public.join_family_by_code(TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.join_family_by_code(TEXT, TEXT, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.join_family_by_code(TEXT, TEXT, TEXT) TO authenticated;

-- Policies for public.families
DROP POLICY IF EXISTS "Users can view their family or query by join code" ON public.families;
DROP POLICY IF EXISTS "Family creators and members can view their family" ON public.families;
DROP POLICY IF EXISTS "Allow authenticated users to create family" ON public.families;
DROP POLICY IF EXISTS "Heads can update family settings" ON public.families;
CREATE POLICY "Family creators and members can view their family"
    ON public.families FOR SELECT
    USING (created_by = auth.uid() OR id IN (SELECT current_user_family_ids()));

CREATE POLICY "Allow authenticated users to create family"
    ON public.families FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

CREATE POLICY "Heads can update family settings"
    ON public.families FOR UPDATE
    USING (id IN (
        SELECT fm.family_id FROM public.family_members fm
        WHERE fm.user_id = auth.uid() AND fm.role = 'Head'
    ))
    WITH CHECK (
        created_by = auth.uid()
        AND id IN (
            SELECT fm.family_id FROM public.family_members fm
            WHERE fm.user_id = auth.uid() AND fm.role = 'Head'
        )
    );

-- Policies for public.family_members
DROP POLICY IF EXISTS "Users can view members of their family" ON public.family_members;
DROP POLICY IF EXISTS "Users can insert themselves into a family" ON public.family_members;
CREATE POLICY "Users can view members of their family"
    ON public.family_members FOR SELECT
    USING (family_id IN (SELECT current_user_family_ids()));

CREATE POLICY "Users can insert themselves into a family"
    ON public.family_members FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        AND (
            family_id IN (SELECT current_user_family_ids())
            OR family_id IN (SELECT f.id FROM public.families f WHERE f.created_by = auth.uid())
        )
    );

-- Policies for public.categories
DROP POLICY IF EXISTS "Users can view their family categories" ON public.categories;
DROP POLICY IF EXISTS "Users can insert categories for their family" ON public.categories;
DROP POLICY IF EXISTS "Users can update their family categories" ON public.categories;
CREATE POLICY "Users can view their family categories"
    ON public.categories FOR SELECT
    USING (family_id IN (SELECT current_user_family_ids()) OR family_id IS NULL);

CREATE POLICY "Users can insert categories for their family"
    ON public.categories FOR INSERT
    WITH CHECK (family_id IN (SELECT current_user_family_ids()));

CREATE POLICY "Users can update their family categories"
    ON public.categories FOR UPDATE
    USING (family_id IN (SELECT current_user_family_ids()));

-- Policies for public.ledger_items
DROP POLICY IF EXISTS "Family members can view all family ledger items" ON public.ledger_items;
DROP POLICY IF EXISTS "Family members can insert ledger items" ON public.ledger_items;
DROP POLICY IF EXISTS "Family members can update ledger items" ON public.ledger_items;
DROP POLICY IF EXISTS "Family members can delete ledger items" ON public.ledger_items;
CREATE POLICY "Family members can view all family ledger items"
    ON public.ledger_items FOR SELECT
    USING (family_id IN (SELECT current_user_family_ids()));

CREATE POLICY "Family members can insert ledger items"
    ON public.ledger_items FOR INSERT
    WITH CHECK (family_id IN (SELECT current_user_family_ids()));

CREATE POLICY "Family members can update ledger items"
    ON public.ledger_items FOR UPDATE
    USING (family_id IN (SELECT current_user_family_ids()));

CREATE POLICY "Family members can delete ledger items"
    ON public.ledger_items FOR DELETE
    USING (family_id IN (SELECT current_user_family_ids()));

-- Policies for chat_history
DROP POLICY IF EXISTS "Family members can read chat history" ON public.chat_history;
DROP POLICY IF EXISTS "Family members can add chat messages" ON public.chat_history;
CREATE POLICY "Family members can read chat history"
    ON public.chat_history FOR SELECT
    USING (family_id IN (SELECT current_user_family_ids()));

CREATE POLICY "Family members can add chat messages"
    ON public.chat_history FOR INSERT
    WITH CHECK (family_id IN (SELECT current_user_family_ids()));

-- 8. REALTIME REPLICATION ENABLEMENT
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'ledger_items'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.ledger_items;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'chat_history'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_history;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'family_members'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.family_members;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'categories'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.categories;
    END IF;
END;
$$;
