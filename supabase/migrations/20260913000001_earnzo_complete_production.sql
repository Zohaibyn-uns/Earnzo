-- ==============================================================================
-- EARNZO — COMPLETE PRODUCTION DATABASE SCHEMA & ATOMIC PROCEDURES
-- ==============================================================================
-- Migration: 20260913000001_earnzo_complete_production.sql
-- Project: Earnzo (Watch Videos • Earn Rewards • Grow Together)
-- ==============================================================================

-- 0. Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. SCHEMAS & RELATIONAL TABLES
-- ==============================================================================

-- 1.1 PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'support', 'manager', 'admin')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'banned')),
    referral_code TEXT UNIQUE NOT NULL,
    referred_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.2 PLANS TABLE
CREATE TABLE IF NOT EXISTS public.plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    badge TEXT,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL DEFAULT 300.00,
    duration_days INT NOT NULL DEFAULT 30,
    daily_task_limit INT NOT NULL DEFAULT 7,
    reward_per_task NUMERIC(10, 2) NOT NULL DEFAULT 8.00,
    daily_reward_limit NUMERIC(10, 2) NOT NULL DEFAULT 56.00,
    min_withdrawal NUMERIC(10, 2) NOT NULL DEFAULT 500.00,
    max_withdrawal NUMERIC(10, 2) NOT NULL DEFAULT 10000.00,
    withdrawal_fee_pct NUMERIC(5, 2) NOT NULL DEFAULT 2.50,
    display_order INT DEFAULT 1,
    cta_text TEXT DEFAULT 'Buy Plan',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.3 MEMBERSHIPS TABLE
CREATE TABLE IF NOT EXISTS public.memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.plans(id),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    tasks_completed_today INT NOT NULL DEFAULT 0,
    last_task_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.4 PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.plans(id),
    amount NUMERIC(10, 2) NOT NULL,
    method TEXT NOT NULL CHECK (method IN ('JazzCash', 'Easypaisa', 'Bank Transfer', 'Internal Wallet')),
    transaction_ref TEXT,
    proof_image_url TEXT,
    sender_account_title TEXT,
    sender_account_number TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'cancelled', 'refunded')),
    admin_notes TEXT,
    reviewed_by UUID REFERENCES public.profiles(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.5 VIDEO CAMPAIGNS TABLE
CREATE TABLE IF NOT EXISTS public.video_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    sponsor_name TEXT NOT NULL,
    description TEXT,
    total_budget NUMERIC(12, 2) NOT NULL,
    spent_budget NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    reward_per_completion NUMERIC(10, 2) NOT NULL,
    max_completions INT NOT NULL,
    current_completions INT NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'scheduled', 'active', 'paused', 'completed', 'expired')),
    start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.6 VIDEOS TABLE
CREATE TABLE IF NOT EXISTS public.videos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES public.video_campaigns(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    duration_seconds INT NOT NULL DEFAULT 60,
    reward_amount NUMERIC(10, 2) NOT NULL DEFAULT 8.00,
    daily_limit INT NOT NULL DEFAULT 1000,
    per_user_limit INT NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
    category TEXT DEFAULT 'Promotional',
    sponsor_badge TEXT DEFAULT 'Official Sponsor',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.7 VIDEO WATCH SESSIONS (Anti-Cheat Server Telemetry)
CREATE TABLE IF NOT EXISTS public.video_watch_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
    session_token TEXT UNIQUE NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    watch_duration_seconds INT NOT NULL DEFAULT 0,
    ip_address INET,
    user_agent TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned', 'flagged')),
    is_fraud_flagged BOOLEAN NOT NULL DEFAULT FALSE,
    fraud_reason TEXT,
    reward_credited BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.8 WALLET ACCOUNTS (Double-Entry Ledger Anchor)
CREATE TABLE IF NOT EXISTS public.wallet_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (balance >= 0),
    pending_balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (pending_balance >= 0),
    total_earned NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (total_earned >= 0),
    total_withdrawn NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (total_withdrawn >= 0),
    currency TEXT NOT NULL DEFAULT 'PKR',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.9 WALLET TRANSACTIONS (Immutable Ledger Entries)
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_id UUID NOT NULL REFERENCES public.wallet_accounts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN (
        'membership_purchase',
        'video_reward',
        'withdrawal_request',
        'withdrawal_completed',
        'withdrawal_rejected',
        'referral_reward',
        'bonus',
        'refund',
        'admin_adjustment'
    )),
    amount NUMERIC(12, 2) NOT NULL,
    balance_before NUMERIC(12, 2) NOT NULL,
    balance_after NUMERIC(12, 2) NOT NULL,
    description TEXT NOT NULL,
    reference_id UUID,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.10 WITHDRAWALS TABLE
CREATE TABLE IF NOT EXISTS public.withdrawals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    wallet_id UUID NOT NULL REFERENCES public.wallet_accounts(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    net_amount NUMERIC(10, 2) NOT NULL CHECK (net_amount > 0),
    method TEXT NOT NULL CHECK (method IN ('JazzCash', 'Easypaisa', 'Bank Transfer')),
    account_title TEXT NOT NULL,
    account_number TEXT NOT NULL,
    bank_name TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'approved', 'paid', 'rejected', 'cancelled')),
    transaction_reference TEXT,
    rejection_reason TEXT,
    processed_by UUID REFERENCES public.profiles(id),
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.11 REFERRALS & REFERRAL REWARDS
CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    referred_user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    membership_purchased BOOLEAN NOT NULL DEFAULT FALSE,
    reward_issued BOOLEAN NOT NULL DEFAULT FALSE,
    commission_rate NUMERIC(5, 2) DEFAULT 10.00,
    commission_amount NUMERIC(10, 2) DEFAULT 0.00,
    is_qualified BOOLEAN DEFAULT FALSE,
    qualifying_plan_id UUID REFERENCES public.plans(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.referral_rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referral_id UUID NOT NULL REFERENCES public.referrals(id) ON DELETE CASCADE,
    referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reward_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'credited' CHECK (status IN ('pending', 'credited', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.12 AD PLACEMENTS (Third-Party Display Units)
CREATE TABLE IF NOT EXISTS public.ad_placements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    placement TEXT NOT NULL CHECK (placement IN ('homepage', 'dashboard', 'sidebar', 'content', 'footer')),
    image_url TEXT NOT NULL,
    target_url TEXT NOT NULL,
    sponsor_name TEXT NOT NULL,
    impressions INT NOT NULL DEFAULT 0,
    clicks INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.13 ANNOUNCEMENTS
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('general', 'payout', 'maintenance', 'promotion')),
    is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.14 SUPPORT TICKETS & MESSAGES
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Payment', 'Withdrawal', 'Video Tasks', 'Account', 'Other')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    assigned_to UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.support_ticket_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_admin_reply BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.15 NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('payment', 'reward', 'membership', 'withdrawal', 'announcement', 'security')),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    action_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.16 AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    actor_email TEXT,
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    entity_id UUID,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address INET,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.17 SYSTEM SETTINGS
CREATE TABLE IF NOT EXISTS public.settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 2. INDEXES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_memberships_user ON public.memberships(user_id, status);
CREATE INDEX IF NOT EXISTS idx_watch_sessions_user ON public.video_watch_sessions(user_id, video_id);
CREATE INDEX IF NOT EXISTS idx_wallet_trx_user ON public.wallet_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON public.withdrawals(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON public.referrals(referrer_id, is_qualified);

-- ==============================================================================
-- 3. SEED INITIAL CONFIGURATIONS & PLANS
-- ==============================================================================

-- 3.1 Three VIP Plans
INSERT INTO public.plans (
    id, name, badge, description, price, duration_days, daily_task_limit, 
    reward_per_task, daily_reward_limit, min_withdrawal, max_withdrawal, 
    withdrawal_fee_pct, display_order, cta_text, is_active
) VALUES 
(
    '11111111-1111-1111-1111-111111111111',
    'Plan 1',
    NULL,
    'Entry-level verified tier unlocking 7 daily sponsored tasks with direct wallet earnings.',
    300.00,
    30,
    7,
    8.00,
    56.00,
    500.00,
    10000.00,
    2.50,
    1,
    'Buy Plan 1',
    TRUE
),
(
    '11111111-1111-1111-1111-111111111112',
    'Plan 2',
    'POPULAR',
    'Most popular balanced tier unlocking 12 daily tasks and elevated Rs. 10 task rewards.',
    500.00,
    30,
    12,
    10.00,
    120.00,
    500.00,
    15000.00,
    2.50,
    2,
    'Buy Plan 2',
    TRUE
),
(
    '11111111-1111-1111-1111-111111111113',
    'Plan 3',
    'VIP',
    'Premier VIP member tier unlocking 17 daily tasks and maximum Rs. 12 task payouts.',
    950.00,
    30,
    17,
    12.00,
    204.00,
    500.00,
    25000.00,
    2.00,
    3,
    'Buy Plan 3',
    TRUE
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    badge = EXCLUDED.badge,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    duration_days = EXCLUDED.duration_days,
    daily_task_limit = EXCLUDED.daily_task_limit,
    reward_per_task = EXCLUDED.reward_per_task,
    daily_reward_limit = EXCLUDED.daily_reward_limit,
    min_withdrawal = EXCLUDED.min_withdrawal,
    max_withdrawal = EXCLUDED.max_withdrawal,
    display_order = EXCLUDED.display_order,
    cta_text = EXCLUDED.cta_text,
    is_active = EXCLUDED.is_active;

-- 3.2 System Settings Seed
INSERT INTO public.settings (key, value, description)
VALUES
(
    'business_rules',
    jsonb_build_object(
        'min_withdrawal_balance', 500,
        'required_qualified_referrals', 2,
        'referral_commission_pct', 10,
        'maintenance_mode', false,
        'jazzcash_title', 'Earnzo Operations',
        'jazzcash_number', '03001234567',
        'easypaisa_title', 'Earnzo Payments',
        'easypaisa_number', '03451234567',
        'bank_iban', 'PK36MEZN0001234567890123'
    ),
    'Core business rules, deposit receiving accounts, and maintenance mode toggle'
)
ON CONFLICT (key) DO NOTHING;

-- ==============================================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_watch_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Helper function: Is Admin or Manager
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND role IN ('admin', 'manager')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles Policies
CREATE POLICY "Users read own profile or admin" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.is_admin(auth.uid()));

CREATE POLICY "Users update own non-sensitive profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Admins manage all profiles" ON public.profiles
  FOR ALL USING (public.is_admin(auth.uid()));

-- Plans Policies
CREATE POLICY "Public read active plans" ON public.plans
  FOR SELECT USING (is_active = TRUE OR public.is_admin(auth.uid()));

CREATE POLICY "Admins manage plans" ON public.plans
  FOR ALL USING (public.is_admin(auth.uid()));

-- Memberships Policies
CREATE POLICY "Users read own memberships" ON public.memberships
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Admins manage memberships" ON public.memberships
  FOR ALL USING (public.is_admin(auth.uid()));

-- Payments Policies
CREATE POLICY "Users read own payments" ON public.payments
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Users insert pending payments" ON public.payments
  FOR INSERT WITH CHECK (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins manage payments" ON public.payments
  FOR ALL USING (public.is_admin(auth.uid()));

-- Videos & Campaigns Policies
CREATE POLICY "Public read active campaigns" ON public.video_campaigns
  FOR SELECT USING (status = 'active' OR public.is_admin(auth.uid()));

CREATE POLICY "Admins manage campaigns" ON public.video_campaigns
  FOR ALL USING (public.is_admin(auth.uid()));

-- Watch Sessions Policies
CREATE POLICY "Users read own watch sessions" ON public.video_watch_sessions
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Users insert own watch sessions" ON public.video_watch_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins manage watch sessions" ON public.video_watch_sessions
  FOR ALL USING (public.is_admin(auth.uid()));

-- Wallet Accounts & Transactions (Users Read-Only, Mutations via Secure RPC)
CREATE POLICY "Users read own wallet account" ON public.wallet_accounts
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Users read own wallet transactions" ON public.wallet_transactions
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Admins manage wallet accounts" ON public.wallet_accounts
  FOR ALL USING (public.is_admin(auth.uid()));

-- Withdrawals Policies
CREATE POLICY "Users read own withdrawals" ON public.withdrawals
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Admins manage withdrawals" ON public.withdrawals
  FOR ALL USING (public.is_admin(auth.uid()));

-- Referrals Policies
CREATE POLICY "Users read own referrals" ON public.referrals
  FOR SELECT USING (auth.uid() = referrer_id OR public.is_admin(auth.uid()));

CREATE POLICY "Users read own referral rewards" ON public.referral_rewards
  FOR SELECT USING (auth.uid() = referrer_id OR public.is_admin(auth.uid()));

CREATE POLICY "Admins manage referrals" ON public.referrals
  FOR ALL USING (public.is_admin(auth.uid()));

-- Announcements, Ads, Settings, Tickets
CREATE POLICY "Public read announcements" ON public.announcements
  FOR SELECT USING (is_active = TRUE OR public.is_admin(auth.uid()));

CREATE POLICY "Admins manage announcements" ON public.announcements
  FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Public read ads" ON public.ad_placements
  FOR SELECT USING (is_active = TRUE OR public.is_admin(auth.uid()));

CREATE POLICY "Admins manage ads" ON public.ad_placements
  FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Users read own tickets" ON public.support_tickets
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Users insert tickets" ON public.support_tickets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users read own ticket messages" ON public.support_ticket_messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.support_tickets WHERE id = ticket_id AND (user_id = auth.uid() OR public.is_admin(auth.uid())))
  );

CREATE POLICY "Users insert ticket messages" ON public.support_ticket_messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Admins manage tickets" ON public.support_tickets
  FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Public read settings" ON public.settings
  FOR SELECT USING (TRUE);

CREATE POLICY "Admins manage settings" ON public.settings
  FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Users read own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Users update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- ==============================================================================
-- 5. AUTH USER CREATION TRIGGER (GUARANTEES CLEAN SLATE)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_ref_code TEXT;
  v_referred_by_id UUID := NULL;
  v_meta_ref TEXT;
BEGIN
  -- Generate unique referral code
  v_ref_code := 'EZ' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));

  -- Check if referred by someone via user metadata
  v_meta_ref := NEW.raw_user_meta_data->>'referral_code';
  IF v_meta_ref IS NOT NULL AND v_meta_ref <> '' THEN
    SELECT id INTO v_referred_by_id FROM public.profiles WHERE referral_code = UPPER(v_meta_ref) LIMIT 1;
  END IF;

  -- 1. Create clean profile: NO active plan, role 'user', status 'active'
  INSERT INTO public.profiles (
    id, email, full_name, phone, role, status, referral_code, referred_by
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'phone',
    'user',
    'active',
    v_ref_code,
    v_referred_by_id
  );

  -- 2. Create clean wallet with Rs. 0 balance
  INSERT INTO public.wallet_accounts (
    user_id, balance, pending_balance, total_earned, total_withdrawn, currency
  ) VALUES (
    NEW.id, 0.00, 0.00, 0.00, 0.00, 'PKR'
  );

  -- 3. If referred by existing user, record referral relationship (starts NOT qualified)
  IF v_referred_by_id IS NOT NULL THEN
    INSERT INTO public.referrals (
      referrer_id, referred_user_id, membership_purchased, is_qualified
    ) VALUES (
      v_referred_by_id, NEW.id, FALSE, FALSE
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 6. STORED PROCEDURES (ATOMIC LEDGER & ANTI-CHEAT ENGINE)
-- ==============================================================================

-- 6.1 RPC: Start Watch Session (Validates Plan & Limits, Anti-Cheat Token)
CREATE OR REPLACE FUNCTION public.rpc_start_watch_session(p_video_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_session_id UUID;
  v_session_token TEXT;
  v_video RECORD;
  v_membership RECORD;
  v_tasks_today INT;
  v_active_plan RECORD;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Please log in to access tasks.';
  END IF;

  -- 1. Verify active membership
  SELECT * INTO v_membership FROM public.memberships
  WHERE user_id = v_user_id AND status = 'active' AND expires_at > NOW()
  LIMIT 1;

  IF v_membership.id IS NULL THEN
    RAISE EXCEPTION 'Access Denied: Earning is locked. An active Earnzo membership plan is required to watch reward videos.';
  END IF;

  -- Fetch plan
  SELECT * INTO v_active_plan FROM public.plans WHERE id = v_membership.plan_id;

  -- Reset daily task count if day rolled over
  IF v_membership.last_task_date < CURRENT_DATE THEN
    UPDATE public.memberships
    SET tasks_completed_today = 0, last_task_date = CURRENT_DATE, updated_at = NOW()
    WHERE id = v_membership.id;
    v_membership.tasks_completed_today := 0;
  END IF;

  -- Check daily plan task limit (7 / 12 / 17)
  IF v_membership.tasks_completed_today >= v_active_plan.daily_task_limit THEN
    RAISE EXCEPTION 'Daily task allocation exhausted (% of % tasks completed). Please return tomorrow!',
      v_membership.tasks_completed_today, v_active_plan.daily_task_limit;
  END IF;

  -- Verify video availability
  SELECT * INTO v_video FROM public.videos WHERE id = p_video_id AND status = 'active';
  IF v_video.id IS NULL THEN
    RAISE EXCEPTION 'Video task is currently unavailable or completed.';
  END IF;

  -- Check per-video user limit for today
  SELECT COUNT(*) INTO v_tasks_today FROM public.video_watch_sessions
  WHERE user_id = v_user_id AND video_id = p_video_id 
    AND status = 'completed' AND started_at::DATE = CURRENT_DATE;

  IF v_tasks_today >= v_video.per_user_limit THEN
    RAISE EXCEPTION 'Daily limit reached for this specific video task.';
  END IF;

  -- Generate secure token
  v_session_token := encode(gen_random_bytes(32), 'hex');
  v_session_id := uuid_generate_v4();

  INSERT INTO public.video_watch_sessions (
    id, user_id, video_id, session_token, started_at, status
  ) VALUES (
    v_session_id, v_user_id, p_video_id, v_session_token, NOW(), 'active'
  );

  RETURN jsonb_build_object(
    'session_id', v_session_id,
    'session_token', v_session_token,
    'required_duration', v_video.duration_seconds,
    'reward_amount', v_active_plan.reward_per_task
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 6.2 RPC: Complete Watch Session (Server Duration Validation & Ledger Credit)
CREATE OR REPLACE FUNCTION public.rpc_complete_watch_session(p_session_id UUID, p_session_token TEXT)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_session RECORD;
  v_video RECORD;
  v_membership RECORD;
  v_plan RECORD;
  v_campaign RECORD;
  v_wallet RECORD;
  v_elapsed_seconds INT;
  v_reward_amount NUMERIC(10, 2);
  v_new_balance NUMERIC(12, 2);
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Fetch and lock session
  SELECT * INTO v_session FROM public.video_watch_sessions
  WHERE id = p_session_id AND user_id = v_user_id FOR UPDATE;

  IF v_session.id IS NULL THEN
    RAISE EXCEPTION 'Invalid watch session.';
  END IF;

  IF v_session.status = 'completed' OR v_session.reward_credited THEN
    RAISE EXCEPTION 'This watch session has already been completed and credited.';
  END IF;

  IF v_session.session_token <> p_session_token THEN
    UPDATE public.video_watch_sessions 
    SET is_fraud_flagged = TRUE, fraud_reason = 'Invalid session token signature' 
    WHERE id = p_session_id;
    RAISE EXCEPTION 'Security verification failed: invalid token signature.';
  END IF;

  -- Fetch active membership and plan for exact reward rate
  SELECT * INTO v_membership FROM public.memberships
  WHERE user_id = v_user_id AND status = 'active' AND expires_at > NOW() FOR UPDATE;

  IF v_membership.id IS NULL THEN
    RAISE EXCEPTION 'No active plan found for this account.';
  END IF;

  SELECT * INTO v_plan FROM public.plans WHERE id = v_membership.plan_id;
  v_reward_amount := v_plan.reward_per_task;

  -- Calculate true server elapsed time
  v_elapsed_seconds := EXTRACT(EPOCH FROM (NOW() - v_session.started_at))::INT;
  SELECT * INTO v_video FROM public.videos WHERE id = v_session.video_id;

  -- Anti-Cheat: 95% completion requirement
  IF v_elapsed_seconds < (v_video.duration_seconds - 2) THEN
    UPDATE public.video_watch_sessions 
    SET is_fraud_flagged = TRUE, fraud_reason = 'Premature watch completion attempt'
    WHERE id = p_session_id;
    RAISE EXCEPTION 'Playback incomplete: Video must be watched for full duration (%s seconds).', v_video.duration_seconds;
  END IF;

  -- Deduct from campaign budget if applicable
  IF v_video.campaign_id IS NOT NULL THEN
    SELECT * INTO v_campaign FROM public.video_campaigns WHERE id = v_video.campaign_id FOR UPDATE;
    IF v_campaign.id IS NOT NULL THEN
      UPDATE public.video_campaigns 
      SET spent_budget = spent_budget + v_reward_amount,
          current_completions = current_completions + 1,
          updated_at = NOW()
      WHERE id = v_campaign.id;
    END IF;
  END IF;

  -- Lock wallet account
  SELECT * INTO v_wallet FROM public.wallet_accounts WHERE user_id = v_user_id FOR UPDATE;
  IF v_wallet.id IS NULL THEN
    INSERT INTO public.wallet_accounts (user_id, balance, pending_balance, total_earned, total_withdrawn)
    VALUES (v_user_id, 0.00, 0.00, 0.00, 0.00)
    RETURNING * INTO v_wallet;
  END IF;

  v_new_balance := v_wallet.balance + v_reward_amount;

  -- Update wallet
  UPDATE public.wallet_accounts
  SET balance = v_new_balance,
      total_earned = total_earned + v_reward_amount,
      updated_at = NOW()
  WHERE id = v_wallet.id;

  -- Increment tasks completed today
  UPDATE public.memberships
  SET tasks_completed_today = tasks_completed_today + 1,
      last_task_date = CURRENT_DATE,
      updated_at = NOW()
  WHERE id = v_membership.id;

  -- Insert immutable ledger record
  INSERT INTO public.wallet_transactions (
    wallet_id, user_id, type, amount, balance_before, balance_after, description, reference_id, metadata
  ) VALUES (
    v_wallet.id, v_user_id, 'video_reward', v_reward_amount, v_wallet.balance, v_new_balance,
    CONCAT('Reward for completing: ', v_video.title), v_session.id,
    jsonb_build_object('video_id', v_video.id, 'duration', v_elapsed_seconds, 'plan', v_plan.name)
  );

  -- Mark session completed
  UPDATE public.video_watch_sessions
  SET status = 'completed',
      completed_at = NOW(),
      watch_duration_seconds = v_elapsed_seconds,
      reward_credited = TRUE
  WHERE id = p_session_id;

  -- Notification
  INSERT INTO public.notifications (user_id, title, message, type, action_url)
  VALUES (
    v_user_id, 'Task Reward Credited!', 
    CONCAT('Rs. ', v_reward_amount, ' credited to your wallet for watching "', v_video.title, '".'),
    'reward', '/dashboard/wallet'
  );

  RETURN jsonb_build_object(
    'success', TRUE,
    'reward_amount', v_reward_amount,
    'new_balance', v_new_balance,
    'tasks_completed_today', v_membership.tasks_completed_today + 1,
    'daily_limit', v_plan.daily_task_limit,
    'message', 'Reward credited successfully!'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 6.3 RPC: Verify Payment & Activate Plan (Admin Action with Referral Commission)
CREATE OR REPLACE FUNCTION public.rpc_verify_payment(
  p_payment_id UUID,
  p_action TEXT, -- 'approve' or 'reject'
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_payment RECORD;
  v_plan RECORD;
  v_existing_mem RECORD;
  v_referrer_record RECORD;
  v_referrer_wallet RECORD;
  v_comm_rate NUMERIC(5, 2) := 10.00;
  v_comm_amount NUMERIC(10, 2);
  v_new_ref_balance NUMERIC(12, 2);
BEGIN
  IF NOT public.is_admin(v_admin_id) THEN
    RAISE EXCEPTION 'Access Denied: Admin authorization required.';
  END IF;

  SELECT * INTO v_payment FROM public.payments WHERE id = p_payment_id FOR UPDATE;
  IF v_payment.id IS NULL THEN
    RAISE EXCEPTION 'Payment record not found.';
  END IF;

  IF v_payment.status <> 'pending' THEN
    RAISE EXCEPTION 'Payment has already been processed with status: %', v_payment.status;
  END IF;

  IF p_action = 'reject' THEN
    UPDATE public.payments
    SET status = 'failed', admin_notes = p_notes, reviewed_by = v_admin_id, reviewed_at = NOW(), updated_at = NOW()
    WHERE id = p_payment_id;

    INSERT INTO public.notifications (user_id, title, message, type, action_url)
    VALUES (
      v_payment.user_id, 'Payment Verification Rejected',
      CONCAT('Your payment was rejected: ', COALESCE(p_notes, 'Invalid transaction proof.')),
      'payment', '/plans'
    );

    RETURN jsonb_build_object('success', TRUE, 'action', 'rejected');
  END IF;

  -- APPROVE FLOW
  SELECT * INTO v_plan FROM public.plans WHERE id = v_payment.plan_id;
  IF v_plan.id IS NULL THEN
    RAISE EXCEPTION 'Plan not found.';
  END IF;

  -- 1. Mark payment paid
  UPDATE public.payments
  SET status = 'paid', admin_notes = p_notes, reviewed_by = v_admin_id, reviewed_at = NOW(), updated_at = NOW()
  WHERE id = p_payment_id;

  -- 2. Deactivate any existing active membership and activate new plan
  UPDATE public.memberships
  SET status = 'cancelled', updated_at = NOW()
  WHERE user_id = v_payment.user_id AND status = 'active';

  INSERT INTO public.memberships (
    user_id, plan_id, status, started_at, expires_at, tasks_completed_today, last_task_date
  ) VALUES (
    v_payment.user_id, v_plan.id, 'active', NOW(), NOW() + (v_plan.duration_days || ' days')::INTERVAL, 0, CURRENT_DATE
  );

  -- 3. Record purchase ledger entry for user
  INSERT INTO public.wallet_transactions (
    wallet_id, user_id, type, amount, balance_before, balance_after, description, reference_id
  ) 
  SELECT id, v_payment.user_id, 'membership_purchase', -v_payment.amount, balance, balance,
         CONCAT('Purchased 30-day ', v_plan.name, ' via ', v_payment.method, ' (TRX: ', COALESCE(v_payment.transaction_ref, 'N/A'), ')'),
         p_payment_id
  FROM public.wallet_accounts WHERE user_id = v_payment.user_id;

  -- 4. Check Referral: 10% Direct 1-Tier Commission & Qualify Referrer
  SELECT * INTO v_referrer_record FROM public.referrals 
  WHERE referred_user_id = v_payment.user_id FOR UPDATE;

  IF v_referrer_record.id IS NOT NULL THEN
    v_comm_amount := ROUND(v_payment.amount * (v_comm_rate / 100.0), 2);

    -- Lock referrer wallet
    SELECT * INTO v_referrer_wallet FROM public.wallet_accounts 
    WHERE user_id = v_referrer_record.referrer_id FOR UPDATE;

    IF v_referrer_wallet.id IS NOT NULL THEN
      v_new_ref_balance := v_referrer_wallet.balance + v_comm_amount;

      -- Credit referrer wallet
      UPDATE public.wallet_accounts
      SET balance = v_new_ref_balance,
          total_earned = total_earned + v_comm_amount,
          updated_at = NOW()
      WHERE id = v_referrer_wallet.id;

      -- Referral ledger transaction
      INSERT INTO public.wallet_transactions (
        wallet_id, user_id, type, amount, balance_before, balance_after, description, reference_id
      ) VALUES (
        v_referrer_wallet.id, v_referrer_record.referrer_id, 'referral_reward', v_comm_amount,
        v_referrer_wallet.balance, v_new_ref_balance,
        CONCAT('10% Referral commission from ', v_plan.name, ' purchase'), p_payment_id
      );

      -- Record referral reward entry
      INSERT INTO public.referral_rewards (
        referral_id, referrer_id, reward_amount, status
      ) VALUES (
        v_referrer_record.id, v_referrer_record.referrer_id, v_comm_amount, 'credited'
      );

      -- Notification to referrer
      INSERT INTO public.notifications (user_id, title, message, type, action_url)
      VALUES (
        v_referrer_record.referrer_id, 'Referral Commission Received!',
        CONCAT('You received Rs. ', v_comm_amount, ' (10% commission) because your referral purchased ', v_plan.name, '. They are now a Qualified Referral!'),
        'reward', '/dashboard/referrals'
      );
    END IF;

    -- Update referral record to QUALIFIED
    UPDATE public.referrals
    SET membership_purchased = TRUE,
        reward_issued = TRUE,
        is_qualified = TRUE,
        commission_rate = v_comm_rate,
        commission_amount = v_comm_amount,
        qualifying_plan_id = v_plan.id,
        updated_at = NOW()
    WHERE id = v_referrer_record.id;
  END IF;

  -- Notification to buyer
  INSERT INTO public.notifications (user_id, title, message, type, action_url)
  VALUES (
    v_payment.user_id, 'Plan Activated!',
    CONCAT('Your ', v_plan.name, ' is now active! You have ', v_plan.daily_task_limit, ' daily tasks unlocked at Rs. ', v_plan.reward_per_task, ' per task.'),
    'membership', '/earn'
  );

  RETURN jsonb_build_object(
    'success', TRUE,
    'action', 'approved',
    'plan', v_plan.name,
    'user_id', v_payment.user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 6.4 RPC: Request Withdrawal (Gated: Min Rs. 500 AND Min 2 Qualified Referrals)
CREATE OR REPLACE FUNCTION public.rpc_request_withdrawal(
  p_amount NUMERIC(10, 2),
  p_method TEXT,
  p_account_title TEXT,
  p_account_number TEXT,
  p_bank_name TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_wallet RECORD;
  v_withdrawal_id UUID;
  v_fee NUMERIC(10, 2) := 0.00;
  v_net_amount NUMERIC(10, 2);
  v_new_balance NUMERIC(12, 2);
  v_qualified_referrals INT := 0;
  v_min_withdrawal NUMERIC(10, 2) := 500.00;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Please log in to request a withdrawal.';
  END IF;

  -- 1. Check minimum balance threshold (Rs. 500)
  IF p_amount < v_min_withdrawal THEN
    RAISE EXCEPTION 'Minimum withdrawal threshold is Rs. %', v_min_withdrawal;
  END IF;

  -- 2. Check 2 Qualified Referrals Requirement (Minimum 2, Uncapped)
  SELECT COUNT(*) INTO v_qualified_referrals
  FROM public.referrals
  WHERE referrer_id = v_user_id AND is_qualified = TRUE;

  IF v_qualified_referrals < 2 THEN
    RAISE EXCEPTION 'Withdrawal eligibility requirement not met: You need at least 2 qualified referrals who purchased a verified plan (You currently have: %).', v_qualified_referrals;
  END IF;

  -- 3. Lock wallet row
  SELECT * INTO v_wallet FROM public.wallet_accounts WHERE user_id = v_user_id FOR UPDATE;

  IF v_wallet.balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient available balance. You have Rs. %, requested Rs. %', v_wallet.balance, p_amount;
  END IF;

  -- Check for pending withdrawal
  IF EXISTS (SELECT 1 FROM public.withdrawals WHERE user_id = v_user_id AND status = 'pending') THEN
    RAISE EXCEPTION 'You already have an active pending withdrawal under review. Please await its completion.';
  END IF;

  v_fee := ROUND(p_amount * 0.025, 2);
  v_net_amount := p_amount - v_fee;
  v_new_balance := v_wallet.balance - p_amount;
  v_withdrawal_id := uuid_generate_v4();

  -- Move funds to pending_balance
  UPDATE public.wallet_accounts
  SET balance = v_new_balance,
      pending_balance = pending_balance + p_amount,
      updated_at = NOW()
  WHERE id = v_wallet.id;

  -- Insert withdrawal
  INSERT INTO public.withdrawals (
    id, user_id, wallet_id, amount, fee, net_amount, method,
    account_title, account_number, bank_name, status
  ) VALUES (
    v_withdrawal_id, v_user_id, v_wallet.id, p_amount, v_fee, v_net_amount,
    p_method, p_account_title, p_account_number, p_bank_name, 'pending'
  );

  -- Record in ledger
  INSERT INTO public.wallet_transactions (
    wallet_id, user_id, type, amount, balance_before, balance_after, description, reference_id
  ) VALUES (
    v_wallet.id, v_user_id, 'withdrawal_request', -p_amount, v_wallet.balance, v_new_balance,
    CONCAT('Withdrawal request of Rs. ', p_amount, ' via ', p_method), v_withdrawal_id
  );

  RETURN jsonb_build_object(
    'success', TRUE,
    'withdrawal_id', v_withdrawal_id,
    'amount', p_amount,
    'net_amount', v_net_amount,
    'remaining_balance', v_new_balance
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 6.5 RPC: Process Withdrawal (Admin Approve or Reject with 100% Refund)
CREATE OR REPLACE FUNCTION public.rpc_process_withdrawal(
  p_withdrawal_id UUID,
  p_action TEXT, -- 'approve' or 'reject'
  p_transaction_ref TEXT DEFAULT NULL,
  p_rejection_reason TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_withdrawal RECORD;
  v_wallet RECORD;
BEGIN
  IF NOT public.is_admin(v_admin_id) THEN
    RAISE EXCEPTION 'Access Denied: Administrative authorization required.';
  END IF;

  SELECT * INTO v_withdrawal FROM public.withdrawals WHERE id = p_withdrawal_id FOR UPDATE;
  IF v_withdrawal.id IS NULL THEN
    RAISE EXCEPTION 'Withdrawal request not found.';
  END IF;

  IF v_withdrawal.status NOT IN ('pending', 'processing') THEN
    RAISE EXCEPTION 'Withdrawal has already been processed with status: %', v_withdrawal.status;
  END IF;

  SELECT * INTO v_wallet FROM public.wallet_accounts WHERE id = v_withdrawal.wallet_id FOR UPDATE;

  IF p_action = 'approve' THEN
    -- Finalize deduction from pending_balance and increment total_withdrawn
    UPDATE public.wallet_accounts
    SET pending_balance = pending_balance - v_withdrawal.amount,
        total_withdrawn = total_withdrawn + v_withdrawal.amount,
        updated_at = NOW()
    WHERE id = v_wallet.id;

    UPDATE public.withdrawals
    SET status = 'paid',
        transaction_reference = p_transaction_ref,
        processed_by = v_admin_id,
        processed_at = NOW(),
        updated_at = NOW()
    WHERE id = p_withdrawal_id;

    INSERT INTO public.wallet_transactions (
      wallet_id, user_id, type, amount, balance_before, balance_after, description, reference_id
    ) VALUES (
      v_wallet.id, v_withdrawal.user_id, 'withdrawal_completed', 0.00, v_wallet.balance, v_wallet.balance,
      CONCAT('Withdrawal marked paid (Ref: ', COALESCE(p_transaction_ref, 'Dispatched'), ')'), p_withdrawal_id
    );

    INSERT INTO public.notifications (user_id, title, message, type, action_url)
    VALUES (
      v_withdrawal.user_id, 'Withdrawal Paid!',
      CONCAT('Your withdrawal of Rs. ', v_withdrawal.net_amount, ' via ', v_withdrawal.method, ' has been dispatched.'),
      'withdrawal', '/dashboard/wallet'
    );

  ELSIF p_action = 'reject' THEN
    -- Return 100% of funds back to user's available balance
    UPDATE public.wallet_accounts
    SET balance = balance + v_withdrawal.amount,
        pending_balance = pending_balance - v_withdrawal.amount,
        updated_at = NOW()
    WHERE id = v_wallet.id;

    UPDATE public.withdrawals
    SET status = 'rejected',
        rejection_reason = p_rejection_reason,
        processed_by = v_admin_id,
        processed_at = NOW(),
        updated_at = NOW()
    WHERE id = p_withdrawal_id;

    INSERT INTO public.wallet_transactions (
      wallet_id, user_id, type, amount, balance_before, balance_after, description, reference_id
    ) VALUES (
      v_wallet.id, v_withdrawal.user_id, 'withdrawal_rejected', v_withdrawal.amount, v_wallet.balance, v_wallet.balance + v_withdrawal.amount,
      CONCAT('Withdrawal rejected and refunded: ', COALESCE(p_rejection_reason, 'Information mismatch')), p_withdrawal_id
    );

    INSERT INTO public.notifications (user_id, title, message, type, action_url)
    VALUES (
      v_withdrawal.user_id, 'Withdrawal Rejected',
      CONCAT('Your withdrawal of Rs. ', v_withdrawal.amount, ' was rejected: ', COALESCE(p_rejection_reason, 'Verification failed'), '. Funds have been refunded to your wallet.'),
      'withdrawal', '/dashboard/withdraw'
    );
  ELSE
    RAISE EXCEPTION 'Invalid action: specify approve or reject';
  END IF;

  RETURN jsonb_build_object('success', TRUE, 'action', p_action);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
