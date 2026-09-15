-- ==============================================================================
-- EARNZO - PRODUCTION MIGRATION: VIDEOS RLS, REALTIME & SYNC FIX
-- ==============================================================================
-- Migration: 20260914000002_fix_videos_rls_and_sync.sql
-- Description: Fixes synchronization between Admin Panel and User task list for
--              Sponsored Tasks by:
--              1. Enabling RLS on public.videos with proper SELECT and ADMIN policies.
--              2. Adding public.videos to supabase_realtime publication.
--              3. Providing atomic RPC procedures for administrator video CRUD
--                 (rpc_admin_add_video, rpc_admin_update_video, rpc_admin_delete_video).
--              4. Seeding default active sponsored video tasks with YouTube embeds.
-- ==============================================================================

-- 1. Ensure RLS is active on public.videos
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

-- 2. RLS Policy: Public read active videos (or admins read all)
DROP POLICY IF EXISTS "Public read active videos" ON public.videos;
CREATE POLICY "Public read active videos" ON public.videos
    FOR SELECT USING (
        status = 'active' 
        OR public.is_admin(auth.uid())
    );

-- 3. RLS Policy: Administrators can manage (INSERT, UPDATE, DELETE) videos
DROP POLICY IF EXISTS "Admins manage videos" ON public.videos;
DROP POLICY IF EXISTS "Admins can manage videos" ON public.videos;
CREATE POLICY "Admins manage videos" ON public.videos
    FOR ALL 
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));

-- 4. Enable Supabase Realtime for public.videos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'videos'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.videos;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    NULL; -- Publication might not exist in local testing
END $$;

-- 5. Atomic RPC: Admin Add Sponsored Video Task
CREATE OR REPLACE FUNCTION public.rpc_admin_add_video(
  p_id UUID DEFAULT NULL,
  p_campaign_id UUID DEFAULT NULL,
  p_title TEXT DEFAULT '',
  p_description TEXT DEFAULT '',
  p_video_url TEXT DEFAULT '',
  p_thumbnail_url TEXT DEFAULT '',
  p_duration_seconds INT DEFAULT 30,
  p_reward_amount NUMERIC DEFAULT 10.00,
  p_daily_limit INT DEFAULT 500,
  p_per_user_limit INT DEFAULT 1,
  p_status TEXT DEFAULT 'active',
  p_category TEXT DEFAULT 'Technology',
  p_sponsor_badge TEXT DEFAULT 'Official Sponsor'
)
RETURNS JSONB AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_admin_email TEXT;
  v_new_id UUID := COALESCE(p_id, uuid_generate_v4());
  v_clean_campaign_id UUID := NULL;
  v_clean_status TEXT;
BEGIN
  -- Strict administrator authorization check
  IF NOT public.is_admin(v_admin_id) THEN
    RAISE EXCEPTION 'Access Denied: Only platform administrators can create sponsored tasks.';
  END IF;

  SELECT email INTO v_admin_email FROM public.profiles WHERE id = v_admin_id;

  -- Validate campaign foreign key if provided
  IF p_campaign_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM public.video_campaigns WHERE id = p_campaign_id) THEN
      v_clean_campaign_id := p_campaign_id;
    END IF;
  END IF;

  -- Ensure status is valid ('active', 'paused', 'archived')
  IF p_status IN ('active', 'paused', 'archived') THEN
    v_clean_status := p_status;
  ELSE
    v_clean_status := 'active';
  END IF;

  INSERT INTO public.videos (
    id,
    campaign_id,
    title,
    description,
    video_url,
    thumbnail_url,
    duration_seconds,
    reward_amount,
    daily_limit,
    per_user_limit,
    status,
    category,
    sponsor_badge,
    created_at,
    updated_at
  ) VALUES (
    v_new_id,
    v_clean_campaign_id,
    COALESCE(p_title, 'Sponsored Task'),
    COALESCE(p_description, ''),
    COALESCE(p_video_url, ''),
    COALESCE(p_thumbnail_url, ''),
    COALESCE(p_duration_seconds, 30),
    COALESCE(p_reward_amount, 10.00),
    COALESCE(p_daily_limit, 500),
    COALESCE(p_per_user_limit, 1),
    v_clean_status,
    COALESCE(p_category, 'Technology'),
    COALESCE(p_sponsor_badge, 'Official Sponsor'),
    NOW(),
    NOW()
  );

  -- Audit log entry (failsafe)
  BEGIN
    INSERT INTO public.audit_logs (actor_id, actor_email, action, entity, entity_id, details)
    VALUES (
      v_admin_id,
      COALESCE(v_admin_email, 'admin@earnzo.com'),
      'video_created',
      'videos',
      v_new_id,
      jsonb_build_object('title', p_title, 'url', p_video_url)
    );
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN jsonb_build_object('success', TRUE, 'id', v_new_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Atomic RPC: Admin Update Sponsored Video Task
CREATE OR REPLACE FUNCTION public.rpc_admin_update_video(
  p_id UUID,
  p_campaign_id UUID DEFAULT NULL,
  p_title TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_video_url TEXT DEFAULT NULL,
  p_thumbnail_url TEXT DEFAULT NULL,
  p_duration_seconds INT DEFAULT NULL,
  p_reward_amount NUMERIC DEFAULT NULL,
  p_daily_limit INT DEFAULT NULL,
  p_per_user_limit INT DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_sponsor_badge TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_admin_email TEXT;
  v_clean_campaign_id UUID := NULL;
  v_valid_status TEXT := NULL;
BEGIN
  IF NOT public.is_admin(v_admin_id) THEN
    RAISE EXCEPTION 'Access Denied: Only platform administrators can update sponsored tasks.';
  END IF;

  SELECT email INTO v_admin_email FROM public.profiles WHERE id = v_admin_id;

  IF p_campaign_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM public.video_campaigns WHERE id = p_campaign_id) THEN
      v_clean_campaign_id := p_campaign_id;
    END IF;
  END IF;

  IF p_status IS NOT NULL AND p_status IN ('active', 'paused', 'archived') THEN
    v_valid_status := p_status;
  END IF;

  UPDATE public.videos
  SET
    title = COALESCE(p_title, title),
    description = COALESCE(p_description, description),
    video_url = COALESCE(p_video_url, video_url),
    thumbnail_url = COALESCE(p_thumbnail_url, thumbnail_url),
    duration_seconds = COALESCE(p_duration_seconds, duration_seconds),
    reward_amount = COALESCE(p_reward_amount, reward_amount),
    daily_limit = COALESCE(p_daily_limit, daily_limit),
    per_user_limit = COALESCE(p_per_user_limit, per_user_limit),
    status = COALESCE(v_valid_status, status),
    category = COALESCE(p_category, category),
    sponsor_badge = COALESCE(p_sponsor_badge, sponsor_badge),
    campaign_id = CASE WHEN p_campaign_id IS NOT NULL THEN v_clean_campaign_id ELSE campaign_id END,
    updated_at = NOW()
  WHERE id = p_id;

  BEGIN
    INSERT INTO public.audit_logs (actor_id, actor_email, action, entity, entity_id, details)
    VALUES (
      v_admin_id,
      COALESCE(v_admin_email, 'admin@earnzo.com'),
      'video_updated',
      'videos',
      p_id,
      jsonb_build_object('title', p_title, 'status', p_status)
    );
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN jsonb_build_object('success', TRUE, 'id', p_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Atomic RPC: Admin Delete Sponsored Video Task
CREATE OR REPLACE FUNCTION public.rpc_admin_delete_video(p_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_admin_email TEXT;
BEGIN
  IF NOT public.is_admin(v_admin_id) THEN
    RAISE EXCEPTION 'Access Denied: Only platform administrators can delete sponsored tasks.';
  END IF;

  SELECT email INTO v_admin_email FROM public.profiles WHERE id = v_admin_id;

  DELETE FROM public.videos WHERE id = p_id;

  BEGIN
    INSERT INTO public.audit_logs (actor_id, actor_email, action, entity, entity_id, details)
    VALUES (
      v_admin_id,
      COALESCE(v_admin_email, 'admin@earnzo.com'),
      'video_deleted',
      'videos',
      p_id,
      jsonb_build_object('deleted_id', p_id)
    );
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN jsonb_build_object('success', TRUE, 'id', p_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Grant Execution Permissions
GRANT EXECUTE ON FUNCTION public.rpc_admin_add_video TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.rpc_admin_update_video TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.rpc_admin_delete_video TO authenticated, anon;

-- 9. Seed Initial Verified Active Sponsored Tasks (with YouTube embeds)
INSERT INTO public.videos (
    id,
    title,
    description,
    video_url,
    thumbnail_url,
    duration_seconds,
    reward_amount,
    daily_limit,
    per_user_limit,
    status,
    category,
    sponsor_badge,
    created_at,
    updated_at
) VALUES 
(
    '11111111-1111-4111-a111-111111111111',
    'Earnzo Official: How to Watch & Earn Guide 2026',
    'Official walkthrough on completing sponsored brand tasks, telemetry verification countdowns, and ledger withdrawals.',
    'https://www.youtube.com/embed/dQw4w9WgXcQ',
    'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    30,
    10.00,
    500,
    1,
    'active',
    'Technology',
    'Earnzo Official',
    NOW(),
    NOW()
),
(
    '22222222-2222-4222-a222-222222222222',
    'Web & Cloud Architecture Fundamentals',
    'Comprehensive introduction to modern cloud-native architectures, API security, and high-demand developer stacks.',
    'https://www.youtube.com/embed/jNQXAC9IVRw',
    'https://img.youtube.com/vi/jNQXAC9IVRw/hqdefault.jpg',
    45,
    12.00,
    400,
    1,
    'active',
    'Education',
    'Tech Sponsor',
    NOW(),
    NOW()
),
(
    '33333333-3333-4333-a333-333333333333',
    'Digital Economy & Freelancing Insights',
    'Essential strategies for navigating the 2026 remote work ecosystem, payment gateways, and international earnings.',
    'https://www.youtube.com/embed/9bZkp7q19f0',
    'https://img.youtube.com/vi/9bZkp7q19f0/hqdefault.jpg',
    35,
    15.00,
    300,
    1,
    'active',
    'Finance',
    'Verified Sponsor',
    NOW(),
    NOW()
)
ON CONFLICT (id) DO NOTHING;
