-- ==============================================================================
-- WATCH EARN — MIGRATION: THREE CONFIGURABLE VIP PLANS & WITHDRAWAL GATING RULES
-- ==============================================================================

-- 1. Add new columns to plans table if not already present
ALTER TABLE public.plans 
  ADD COLUMN IF NOT EXISTS badge TEXT,
  ADD COLUMN IF NOT EXISTS daily_reward_limit NUMERIC(10, 2) DEFAULT 56.00,
  ADD COLUMN IF NOT EXISTS display_order INT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS cta_text TEXT DEFAULT 'Buy Plan';

-- 2. Add commission and qualification fields to referrals
ALTER TABLE public.referrals
  ADD COLUMN IF NOT EXISTS commission_rate NUMERIC(5, 2) DEFAULT 10.00,
  ADD COLUMN IF NOT EXISTS commission_amount NUMERIC(10, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS is_qualified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS qualifying_plan_id UUID REFERENCES public.plans(id);

-- 3. Upsert the 3 Configurable Plans
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

-- 4. Update Stored Procedure for Withdrawal Gating (Rs. 500 Min & 2 Qualified Referrals)
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
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- 1. Check minimum balance requirement (Rs. 500)
  IF p_amount < v_min_withdrawal THEN
    RAISE EXCEPTION 'Minimum withdrawal threshold is Rs. %', v_min_withdrawal;
  END IF;

  -- 2. Check 2 Qualified Referrals Requirement
  SELECT COUNT(*) INTO v_qualified_referrals
  FROM public.referrals
  WHERE referrer_id = v_user_id AND is_qualified = TRUE;

  IF v_qualified_referrals < 2 THEN
    RAISE EXCEPTION 'Withdrawal eligibility requirement not met: You need at least 2 qualified referrals (current: %).', v_qualified_referrals;
  END IF;

  -- 3. Lock wallet row
  SELECT * INTO v_wallet FROM public.wallet_accounts WHERE user_id = v_user_id FOR UPDATE;

  IF v_wallet.balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient available balance. You have Rs. %, requested Rs. %', v_wallet.balance, p_amount;
  END IF;

  IF EXISTS (SELECT 1 FROM public.withdrawals WHERE user_id = v_user_id AND status = 'pending') THEN
    RAISE EXCEPTION 'You already have an active pending withdrawal under review.';
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
    CONCAT('Withdrawal request via ', p_method), v_withdrawal_id
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
