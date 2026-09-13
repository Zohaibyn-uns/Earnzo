-- ==============================================================================
-- WATCH EARN — ROW LEVEL SECURITY (RLS) & ATOMIC STORED PROCEDURES
-- ==============================================================================

-- Enable RLS on all tables
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

-- Helper function to check if current user is admin/manager
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND role IN ('admin', 'manager')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. PROFILES POLICIES
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin(auth.uid()));

CREATE POLICY "Users can update own non-sensitive profile fields"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Admins can manage all profiles"
  ON public.profiles FOR ALL
  USING (public.is_admin(auth.uid()));

-- 2. PLANS POLICIES (Public read, Admin manage)
CREATE POLICY "Anyone can view active plans"
  ON public.plans FOR SELECT
  USING (is_active = TRUE OR public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage plans"
  ON public.plans FOR ALL
  USING (public.is_admin(auth.uid()));

-- 3. MEMBERSHIPS POLICIES (User read own, Admin manage)
CREATE POLICY "Users can view own memberships"
  ON public.memberships FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage memberships"
  ON public.memberships FOR ALL
  USING (public.is_admin(auth.uid()));

-- 4. PAYMENTS POLICIES
CREATE POLICY "Users can view own payments"
  ON public.payments FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Users can submit payments"
  ON public.payments FOR INSERT
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins can manage all payments"
  ON public.payments FOR ALL
  USING (public.is_admin(auth.uid()));

-- 5. VIDEO CAMPAIGNS POLICIES
CREATE POLICY "Anyone can view active campaigns"
  ON public.video_campaigns FOR SELECT
  USING (status = 'active' OR public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage campaigns"
  ON public.video_campaigns FOR ALL
  USING (public.is_admin(auth.uid()));

-- 6. VIDEOS POLICIES
CREATE POLICY "Anyone can view active videos"
  ON public.videos FOR SELECT
  USING (status = 'active' OR public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage videos"
  ON public.videos FOR ALL
  USING (public.is_admin(auth.uid()));

-- 7. VIDEO WATCH SESSIONS POLICIES
CREATE POLICY "Users can view own watch sessions"
  ON public.video_watch_sessions FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Users can create own watch sessions"
  ON public.video_watch_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage watch sessions"
  ON public.video_watch_sessions FOR ALL
  USING (public.is_admin(auth.uid()));

-- 8. WALLET ACCOUNTS & TRANSACTIONS (READ ONLY FOR USERS, MODIFIED ONLY VIA DB FUNCTIONS)
CREATE POLICY "Users can view own wallet account"
  ON public.wallet_accounts FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Users can view own wallet transactions"
  ON public.wallet_transactions FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage wallet accounts"
  ON public.wallet_accounts FOR ALL
  USING (public.is_admin(auth.uid()));

-- 9. WITHDRAWALS POLICIES
CREATE POLICY "Users can view own withdrawals"
  ON public.withdrawals FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage all withdrawals"
  ON public.withdrawals FOR ALL
  USING (public.is_admin(auth.uid()));

-- 10. ANNOUNCEMENTS & ADS (Public read, Admin write)
CREATE POLICY "Public can view active announcements"
  ON public.announcements FOR SELECT
  USING (is_active = TRUE OR public.is_admin(auth.uid()));

CREATE POLICY "Public can view active ad placements"
  ON public.ad_placements FOR SELECT
  USING (is_active = TRUE OR public.is_admin(auth.uid()));

-- ==============================================================================
-- STORED PROCEDURES (LEDGER & ANTI-CHEAT ENGINE)
-- ==============================================================================

-- PROCEDURE: Start Watch Session
CREATE OR REPLACE FUNCTION public.rpc_start_watch_session(p_video_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_session_id UUID;
  v_session_token TEXT;
  v_video RECORD;
  v_membership RECORD;
  v_tasks_today INT;
BEGIN
  -- Verify user authentication
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: User not authenticated';
  END IF;

  -- Verify active membership
  SELECT * INTO v_membership FROM public.memberships
  WHERE user_id = v_user_id AND status = 'active' AND expires_at > NOW()
  LIMIT 1;

  IF v_membership.id IS NULL THEN
    RAISE EXCEPTION 'Access Denied: An active Rs. 300 WatchEarn membership is required to watch reward videos.';
  END IF;

  -- Verify video availability
  SELECT * INTO v_video FROM public.videos WHERE id = p_video_id AND status = 'active';
  IF v_video.id IS NULL THEN
    RAISE EXCEPTION 'Video task is currently unavailable or completed.';
  END IF;

  -- Check daily limit for user
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
    'reward_amount', v_video.reward_amount
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PROCEDURE: Complete Watch Session (Validates Duration & Credits Ledger)
CREATE OR REPLACE FUNCTION public.rpc_complete_watch_session(p_session_id UUID, p_session_token TEXT)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_session RECORD;
  v_video RECORD;
  v_campaign RECORD;
  v_wallet RECORD;
  v_elapsed_seconds INT;
  v_new_balance NUMERIC(12, 2);
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Fetch and lock session row
  SELECT * INTO v_session FROM public.video_watch_sessions
  WHERE id = p_session_id AND user_id = v_user_id FOR UPDATE;

  IF v_session.id IS NULL THEN
    RAISE EXCEPTION 'Invalid watch session.';
  END IF;

  IF v_session.status = 'completed' OR v_session.reward_credited THEN
    RAISE EXCEPTION 'This watch session has already been completed and credited.';
  END IF;

  IF v_session.session_token <> p_session_token THEN
    -- Flag session as suspicious
    UPDATE public.video_watch_sessions 
    SET is_fraud_flagged = TRUE, fraud_reason = 'Invalid session token signature' 
    WHERE id = p_session_id;
    RAISE EXCEPTION 'Security verification failed.';
  END IF;

  -- Calculate true server-side elapsed seconds
  v_elapsed_seconds := EXTRACT(EPOCH FROM (NOW() - v_session.started_at))::INT;

  SELECT * INTO v_video FROM public.videos WHERE id = v_session.video_id;

  IF v_elapsed_seconds < (v_video.duration_seconds - 2) THEN
    UPDATE public.video_watch_sessions 
    SET is_fraud_flagged = TRUE, fraud_reason = 'Premature watch completion attempt'
    WHERE id = p_session_id;
    RAISE EXCEPTION 'Playback incomplete: Video must be watched for full duration (%s seconds).', v_video.duration_seconds;
  END IF;

  -- Fetch campaign and ensure budget remains
  IF v_video.campaign_id IS NOT NULL THEN
    SELECT * INTO v_campaign FROM public.video_campaigns WHERE id = v_video.campaign_id FOR UPDATE;
    IF v_campaign.spent_budget + v_video.reward_amount > v_campaign.total_budget THEN
      RAISE EXCEPTION 'Campaign allocated reward budget has been exhausted.';
    END IF;

    -- Increment campaign spent
    UPDATE public.video_campaigns 
    SET spent_budget = spent_budget + v_video.reward_amount,
        current_completions = current_completions + 1,
        updated_at = NOW()
    WHERE id = v_campaign.id;
  END IF;

  -- Lock wallet account row for atomic balance update
  SELECT * INTO v_wallet FROM public.wallet_accounts WHERE user_id = v_user_id FOR UPDATE;
  IF v_wallet.id IS NULL THEN
    -- Initialize wallet if missing
    INSERT INTO public.wallet_accounts (user_id, balance, pending_balance, total_earned, total_withdrawn)
    VALUES (v_user_id, 0.00, 0.00, 0.00, 0.00)
    RETURNING * INTO v_wallet;
  END IF;

  v_new_balance := v_wallet.balance + v_video.reward_amount;

  -- Update wallet account
  UPDATE public.wallet_accounts
  SET balance = v_new_balance,
      total_earned = total_earned + v_video.reward_amount,
      updated_at = NOW()
  WHERE id = v_wallet.id;

  -- Insert immutable ledger transaction
  INSERT INTO public.wallet_transactions (
    wallet_id, user_id, type, amount, balance_before, balance_after, description, reference_id, metadata
  ) VALUES (
    v_wallet.id, v_user_id, 'video_reward', v_video.reward_amount, v_wallet.balance, v_new_balance,
    CONCAT('Reward for watching: ', v_video.title), v_session.id,
    jsonb_build_object('video_id', v_video.id, 'duration', v_elapsed_seconds)
  );

  -- Mark session completed
  UPDATE public.video_watch_sessions
  SET status = 'completed',
      completed_at = NOW(),
      watch_duration_seconds = v_elapsed_seconds,
      reward_credited = TRUE
  WHERE id = p_session_id;

  -- Insert in-app notification
  INSERT INTO public.notifications (user_id, title, message, type, action_url)
  VALUES (
    v_user_id, 'Reward Received!', 
    CONCAT('Rs. ', v_video.reward_amount, ' credited to your wallet for watching "', v_video.title, '".'),
    'reward', '/dashboard/wallet'
  );

  RETURN jsonb_build_object(
    'success', TRUE,
    'reward_amount', v_video.reward_amount,
    'new_balance', v_new_balance,
    'message', 'Reward credited successfully!'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PROCEDURE: Request Withdrawal (Atomically Locks Available Funds)
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
  v_plan RECORD;
  v_withdrawal_id UUID;
  v_fee NUMERIC(10, 2) := 0.00;
  v_net_amount NUMERIC(10, 2);
  v_new_balance NUMERIC(12, 2);
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Withdrawal amount must be greater than zero.';
  END IF;

  -- Fetch default plan limits (or active user plan)
  SELECT * INTO v_plan FROM public.plans WHERE is_active = TRUE ORDER BY price ASC LIMIT 1;
  IF v_plan.id IS NOT NULL THEN
    IF p_amount < v_plan.min_withdrawal THEN
      RAISE EXCEPTION 'Minimum withdrawal threshold is Rs. %', v_plan.min_withdrawal;
    END IF;
    IF p_amount > v_plan.max_withdrawal THEN
      RAISE EXCEPTION 'Maximum withdrawal limit per request is Rs. %', v_plan.max_withdrawal;
    END IF;
    v_fee := ROUND((p_amount * (v_plan.withdrawal_fee_pct / 100.0)), 2);
  END IF;

  v_net_amount := p_amount - v_fee;

  -- Lock wallet row
  SELECT * INTO v_wallet FROM public.wallet_accounts WHERE user_id = v_user_id FOR UPDATE;

  IF v_wallet.balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient available balance. You have Rs. %, requested Rs. %', v_wallet.balance, p_amount;
  END IF;

  -- Check for existing pending withdrawal to prevent spam
  IF EXISTS (SELECT 1 FROM public.withdrawals WHERE user_id = v_user_id AND status = 'pending') THEN
    RAISE EXCEPTION 'You already have a pending withdrawal request under review. Please wait for completion.';
  END IF;

  v_new_balance := v_wallet.balance - p_amount;
  v_withdrawal_id := uuid_generate_v4();

  -- Move funds from balance to pending_balance
  UPDATE public.wallet_accounts
  SET balance = v_new_balance,
      pending_balance = pending_balance + p_amount,
      updated_at = NOW()
  WHERE id = v_wallet.id;

  -- Insert withdrawal record
  INSERT INTO public.withdrawals (
    id, user_id, wallet_id, amount, fee, net_amount, method, 
    account_title, account_number, bank_name, status
  ) VALUES (
    v_withdrawal_id, v_user_id, v_wallet.id, p_amount, v_fee, v_net_amount,
    p_method, p_account_title, p_account_number, p_bank_name, 'pending'
  );

  -- Record in ledger
  INSERT INTO public.wallet_transactions (
    wallet_id, user_id, type, amount, balance_before, balance_after, description, reference_id, metadata
  ) VALUES (
    v_wallet.id, v_user_id, 'withdrawal_request', -p_amount, v_wallet.balance, v_new_balance,
    CONCAT('Withdrawal request via ', p_method), v_withdrawal_id,
    jsonb_build_object('method', p_method, 'account', p_account_number, 'fee', v_fee, 'net', v_net_amount)
  );

  RETURN jsonb_build_object(
    'success', TRUE,
    'withdrawal_id', v_withdrawal_id,
    'amount', p_amount,
    'fee', v_fee,
    'net_amount', v_net_amount,
    'remaining_balance', v_new_balance
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PROCEDURE: Admin Process Withdrawal (Approve or Reject with Refund)
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
    RAISE EXCEPTION 'Access Denied: Administrative authority required.';
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
    -- Finalize deduction: Deduct from pending_balance and increment total_withdrawn
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
      CONCAT('Withdrawal marked paid (Ref: ', COALESCE(p_transaction_ref, 'N/A'), ')'), p_withdrawal_id
    );

    INSERT INTO public.notifications (user_id, title, message, type, action_url)
    VALUES (
      v_withdrawal.user_id, 'Withdrawal Paid!',
      CONCAT('Your withdrawal of Rs. ', v_withdrawal.net_amount, ' via ', v_withdrawal.method, ' has been successfully dispatched.'),
      'withdrawal', '/dashboard/wallet'
    );

  ELSIF p_action = 'reject' THEN
    -- Return funds back to user's available balance
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
      CONCAT('Your withdrawal of Rs. ', v_withdrawal.amount, ' was rejected. Reason: ', COALESCE(p_rejection_reason, 'Verification failed'), '. Funds have been refunded to your wallet.'),
      'withdrawal', '/dashboard/withdraw'
    );
  ELSE
    RAISE EXCEPTION 'Invalid action: specify approve or reject';
  END IF;

  -- Audit log entry
  INSERT INTO public.audit_logs (actor_id, action, entity, entity_id, details)
  VALUES (
    v_admin_id, CONCAT('withdrawal_', p_action), 'withdrawals', p_withdrawal_id,
    jsonb_build_object('amount', v_withdrawal.amount, 'reason', p_rejection_reason, 'ref', p_transaction_ref)
  );

  RETURN jsonb_build_object('success', TRUE, 'action', p_action);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
