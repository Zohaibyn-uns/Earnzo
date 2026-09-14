-- ==============================================================================
-- EARNZO - PRODUCTION MIGRATION: WEBSITE CONTENT & PAGE ELEMENT MANAGER
-- ==============================================================================
-- Migration: 20260914000001_website_content.sql
-- Description: Creates controlled website_content table for dynamic page elements
--              (banners, text/announcements, videos, YouTube embeds, audio)
--              with placement controls, responsive visibility, and strict RLS.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.website_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL CHECK (type IN ('banner', 'text', 'video', 'youtube', 'audio')),
    title TEXT,
    description TEXT,
    content_url TEXT NOT NULL,
    placement TEXT NOT NULL CHECK (placement IN (
        'dashboard_top',
        'dashboard_content',
        'dashboard_bottom',
        'earn_top',
        'earn_bottom',
        'plans_top',
        'plans_bottom'
    )),
    display_order INT NOT NULL DEFAULT 0,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    desktop_visible BOOLEAN NOT NULL DEFAULT TRUE,
    mobile_visible BOOLEAN NOT NULL DEFAULT TRUE,
    layout_config JSONB NOT NULL DEFAULT '{
        "width": "full",
        "height": "auto",
        "alignment": "center",
        "margin": "md",
        "padding": "md",
        "borderRadius": "xl"
    }'::jsonb,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance Index for fast placement lookups
CREATE INDEX IF NOT EXISTS idx_website_content_placement 
ON public.website_content(placement, display_order) 
WHERE enabled = TRUE;

-- Row Level Security (RLS)
ALTER TABLE public.website_content ENABLE ROW LEVEL SECURITY;

-- Read policy: Normal users read published/enabled content; Admins read all
DROP POLICY IF EXISTS "Public read enabled website content" ON public.website_content;
CREATE POLICY "Public read enabled website content" ON public.website_content
    FOR SELECT USING (enabled = TRUE OR public.is_admin(auth.uid()));

-- Admin write policy: Only administrators can insert, update, or delete
DROP POLICY IF EXISTS "Admins manage website content" ON public.website_content;
CREATE POLICY "Admins manage website content" ON public.website_content
    FOR ALL USING (public.is_admin(auth.uid()));
