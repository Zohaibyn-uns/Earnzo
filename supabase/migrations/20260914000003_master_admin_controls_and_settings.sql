-- ==============================================================================
-- EARNZO - PRODUCTION MIGRATION: MASTER ADMIN CONTROLS & SETTINGS
-- ==============================================================================
-- Migration: 20260914000003_master_admin_controls_and_settings.sql
-- Description: Upgrades the Earnzo database for full administrative control:
--              1. RLS policies and indexes for public.audit_logs.
--              2. Realtime publication for settings, audit_logs, and plans.
--              3. Default configuration seeds for business_rules, referral_settings,
--                 welcome_message_settings, general_settings, and auth_settings.
--              4. Atomic RPC procedures for settings mutation, audit logging,
--                 and admin-safe user status management.
-- ==============================================================================

-- 1. Ensure RLS is active on public.audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only administrators can read audit logs
DROP POLICY IF EXISTS "Admins read audit logs" ON public.audit_logs;
CREATE POLICY "Admins read audit logs" ON public.audit_logs
    FOR SELECT USING (public.is_admin(auth.uid()));

-- RLS Policy: Authenticated users & system can insert audit logs
DROP POLICY IF EXISTS "System and admins insert audit logs" ON public.audit_logs;
CREATE POLICY "System and admins insert audit logs" ON public.audit_logs
    FOR INSERT WITH CHECK (
        public.is_admin(auth.uid()) 
        OR auth.uid() IS NOT NULL
    );

-- 2. Add tables to Supabase Realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'settings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.settings;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'audit_logs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_logs;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'plans'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.plans;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END $$;

-- 3. Seed Configurable Settings Modules (Preserves existing data)
INSERT INTO public.settings (key, value, description)
VALUES
(
    'general_settings',
    jsonb_build_object(
        'site_name', 'Earnzo',
        'site_description', 'Watch Authenticated Brand Campaigns • Earn Verified Rewards • Grow Together',
        'maintenance_mode', false,
        'currency', 'PKR',
        'currency_symbol', 'Rs. ',
        'timezone', 'Asia/Karachi',
        'support_email', 'support@earnzo.com',
        'support_phone', '03001234567',
        'general_announcement', 'Welcome to Earnzo! Daily tasks reset every night at 12:00 AM PKT.'
    ),
    'General website metadata, maintenance mode with admin bypass, and public support coordinates'
),
(
    'referral_settings',
    jsonb_build_object(
        'referrals_enabled', true,
        'rewards_enabled', true,
        'reward_type', 'percentage',
        'reward_value', 10,
        'min_qualified_referrals', 2,
        'max_reward_cap', 50000,
        'earning_enabled', true
    ),
    'Referral system toggle, commission types (fixed/percentage), and withdrawal qualification criteria'
),
(
    'withdrawal_settings',
    jsonb_build_object(
        'withdrawals_enabled', true,
        'min_withdrawal', 500,
        'max_withdrawal', 50000,
        'processing_fee_pct', 2.0,
        'allowed_methods', jsonb_build_object(
            'jazzcash', true,
            'easypaisa', true,
            'bank', true
        ),
        'processing_notice', 'Withdrawals are audited and dispatched within 24-48 banking hours.'
    ),
    'Live withdrawal gating, min/max limits, fees, and rail toggles'
),
(
    'welcome_message_settings',
    jsonb_build_object(
        'enabled', true,
        'new_user_message', 'Welcome to Earnzo, {name}! Choose your membership plan to unlock daily sponsored reward tasks.',
        'returning_user_message', 'Welcome back, {name}! Your daily sponsored video tasks are ready to complete.',
        'display_duration_seconds', 6
    ),
    'Customizable greeting notifications for new and returning members'
),
(
    'auth_settings',
    jsonb_build_object(
        'registration_enabled', true,
        'email_otp_enabled', false,
        'otp_cooldown_seconds', 60
    ),
    'User onboarding gating, registration toggle, and email verification parameters'
)
ON CONFLICT (key) DO NOTHING;

-- 4. Atomic RPC: Admin Update Settings Key
CREATE OR REPLACE FUNCTION public.rpc_admin_update_settings(
  p_key TEXT,
  p_value JSONB
)
RETURNS JSONB AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_admin_email TEXT;
BEGIN
  IF NOT public.is_admin(v_admin_id) THEN
    RAISE EXCEPTION 'Access Denied: Only platform administrators can update system settings.';
  END IF;

  SELECT email INTO v_admin_email FROM public.profiles WHERE id = v_admin_id;

  INSERT INTO public.settings (key, value, updated_at)
  VALUES (p_key, p_value, NOW())
  ON CONFLICT (key) DO UPDATE
  SET value = EXCLUDED.value, updated_at = NOW();

  -- Audit log entry
  INSERT INTO public.audit_logs (actor_id, actor_email, action, entity, entity_id, details)
  VALUES (
    v_admin_id,
    COALESCE(v_admin_email, 'admin@earnzo.com'),
    'settings_updated',
    'settings',
    p_key,
    jsonb_build_object('key', p_key, 'new_value', p_value)
  );

  RETURN jsonb_build_object('success', TRUE, 'key', p_key);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Atomic RPC: Admin Safe User Status Management (Prevents Self-Lockout)
CREATE OR REPLACE FUNCTION public.rpc_admin_manage_user_status(
  p_user_id UUID,
  p_status TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_admin_email TEXT;
  v_target_email TEXT;
BEGIN
  IF NOT public.is_admin(v_admin_id) THEN
    RAISE EXCEPTION 'Access Denied: Only platform administrators can change user access statuses.';
  END IF;

  -- Protection: Admin cannot suspend or ban themselves
  IF p_user_id = v_admin_id THEN
    RAISE EXCEPTION 'Action Prohibited: Administrators cannot suspend or terminate their own profile.';
  END IF;

  SELECT email INTO v_admin_email FROM public.profiles WHERE id = v_admin_id;
  SELECT email INTO v_target_email FROM public.profiles WHERE id = p_user_id;

  -- Protection: Do not suspend designated root admins
  IF v_target_email IN ('admin@earnzo.com', 'zohaibyn.uns@gmail.com') THEN
    RAISE EXCEPTION 'Action Prohibited: Root platform administrator accounts cannot be suspended.';
  END IF;

  UPDATE public.profiles
  SET status = p_status, updated_at = NOW()
  WHERE id = p_user_id;

  -- Audit log entry
  INSERT INTO public.audit_logs (actor_id, actor_email, action, entity, entity_id, details)
  VALUES (
    v_admin_id,
    COALESCE(v_admin_email, 'admin@earnzo.com'),
    CONCAT('user_status_', p_status),
    'profiles',
    p_user_id::TEXT,
    jsonb_build_object('target_email', v_target_email, 'new_status', p_status)
  );

  RETURN jsonb_build_object('success', TRUE, 'user_id', p_user_id, 'status', p_status);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Atomic RPC: Audit Log Record
CREATE OR REPLACE FUNCTION public.rpc_admin_log_audit(
  p_action TEXT,
  p_entity TEXT,
  p_entity_id TEXT,
  p_details JSONB
)
RETURNS JSONB AS $$
DECLARE
  v_actor_id UUID := auth.uid();
  v_actor_email TEXT;
BEGIN
  SELECT email INTO v_actor_email FROM public.profiles WHERE id = v_actor_id;

  INSERT INTO public.audit_logs (actor_id, actor_email, action, entity, entity_id, details)
  VALUES (
    v_actor_id,
    COALESCE(v_actor_email, 'system@earnzo.com'),
    p_action,
    p_entity,
    p_entity_id,
    p_details
  );

  RETURN jsonb_build_object('success', TRUE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
