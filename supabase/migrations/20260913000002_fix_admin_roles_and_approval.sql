-- ==============================================================================
-- EARNZO - PRODUCTION MIGRATION: FIX ADMIN AUTHORIZATION, ROLES & PAYMENT APPROVAL
-- ==============================================================================
-- Migration: 20260913000002_fix_admin_roles_and_approval.sql
-- Description: Ensures administrator authorization is properly recognized via
--              Supabase Auth JWT, promotes admin@earnzo.com to role 'admin',
--              updates handle_new_user() trigger for admin role attribution,
--              and hardens rpc_verify_payment and rpc_process_withdrawal.
-- ==============================================================================

-- 1. Hardened is_admin function (Checks profiles, JWT email, and auth.users)
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  IF user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- A. Check cryptographically verified JWT email from Supabase Auth
  IF (COALESCE(auth.jwt() ->> 'email', '')) IN ('admin@earnzo.com', 'zohaibyn.uns@gmail.com') 
     OR (COALESCE(auth.jwt() ->> 'email', '')) LIKE '%@earnzo.com' THEN
    RETURN TRUE;
  END IF;

  -- B. Check profiles table for admin / manager role
  IF EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND (
      role IN ('admin', 'manager')
      OR email IN ('admin@earnzo.com', 'zohaibyn.uns@gmail.com')
      OR email LIKE '%@earnzo.com'
    )
  ) THEN
    RETURN TRUE;
  END IF;

  -- C. Check auth.users table for designated admin email or metadata
  IF EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = user_id AND (
      email IN ('admin@earnzo.com', 'zohaibyn.uns@gmail.com')
      OR email LIKE '%@earnzo.com'
      OR (raw_user_meta_data->>'role') IN ('admin', 'manager')
    )
  ) THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Promote admin@earnzo.com and designated staff in public.profiles
UPDATE public.profiles
SET role = 'admin', updated_at = NOW()
WHERE email IN ('admin@earnzo.com', 'zohaibyn.uns@gmail.com')
   OR email LIKE '%@earnzo.com';

-- 3. Update handle_new_user() trigger to automatically assign role 'admin' for staff
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_ref_code TEXT;
  v_referred_by_id UUID := NULL;
  v_meta_ref TEXT;
  v_role TEXT := 'user';
BEGIN
  v_ref_code := 'EZ' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));

  -- Check referral code in metadata
  v_meta_ref := NEW.raw_user_meta_data->>'referral_code';
  IF v_meta_ref IS NOT NULL AND v_meta_ref <> '' THEN
    SELECT id INTO v_referred_by_id FROM public.profiles WHERE referral_code = UPPER(v_meta_ref) LIMIT 1;
  END IF;

  -- Automatically assign admin role for designated administrative accounts
  IF NEW.email IN ('admin@earnzo.com', 'zohaibyn.uns@gmail.com')
     OR NEW.email LIKE '%@earnzo.com'
     OR (NEW.raw_user_meta_data->>'role') IN ('admin', 'manager') THEN
    v_role := 'admin';
  END IF;

  -- Insert profile
  INSERT INTO public.profiles (
    id, email, full_name, phone, role, status, referral_code, referred_by
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'phone',
    v_role,
    'active',
    v_ref_code,
    v_referred_by_id
  ) ON CONFLICT (id) DO UPDATE
    SET role = CASE WHEN EXCLUDED.role = 'admin' THEN 'admin' ELSE public.profiles.role END,
        email = EXCLUDED.email,
        updated_at = NOW();

  -- Clean wallet with Rs. 0 balance
  INSERT INTO public.wallet_accounts (
    user_id, balance, pending_balance, total_earned, total_withdrawn, currency
  ) VALUES (
    NEW.id, 0.00, 0.00, 0.00, 0.00, 'PKR'
  ) ON CONFLICT (user_id) DO NOTHING;

  -- Record referral if referred
  IF v_referred_by_id IS NOT NULL THEN
    INSERT INTO public.referrals (
      referrer_id, referred_user_id, membership_purchased, is_qualified
    ) VALUES (
      v_referred_by_id, NEW.id, FALSE, FALSE
    ) ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-attach trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Hardened rpc_verify_payment with Auto-Healing and Guaranteed Wallet Initialization
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
  -- Admin Access Verification
  IF NOT public.is_admin(v_admin_id) THEN
    RAISE EXCEPTION 'Access Denied: Admin authorization required.';
  END IF;

  -- Auto-heal admin profile row if needed
  IF v_admin_id IS NOT NULL THEN
    UPDATE public.profiles
    SET role = 'admin', updated_at = NOW()
    WHERE id = v_admin_id AND role <> 'admin';
  END IF;

  -- Lock payment record
  SELECT * INTO v_payment FROM public.payments WHERE id = p_payment_id FOR UPDATE;
  IF v_payment.id IS NULL THEN
    RAISE EXCEPTION 'Payment record not found.';
  END IF;

  -- Idempotency check
  IF v_payment.status <> 'pending' THEN
    RAISE EXCEPTION 'Payment has already been processed with status: %', v_payment.status;
  END IF;

  -- REJECT ACTION
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

    RETURN jsonb_build_object('success', TRUE, 'action', 'rejected', 'payment_id', p_payment_id);
  END IF;

  -- APPROVE ACTION
  SELECT * INTO v_plan FROM public.plans WHERE id = v_payment.plan_id;
  IF v_plan.id IS NULL THEN
    RAISE EXCEPTION 'Plan not found.';
  END IF;

  -- 1. Mark payment paid
  UPDATE public.payments
  SET status = 'paid', admin_notes = p_notes, reviewed_by = v_admin_id, reviewed_at = NOW(), updated_at = NOW()
  WHERE id = p_payment_id;

  -- 2. Deactivate previous active memberships and insert new 30-day active membership
  UPDATE public.memberships
  SET status = 'cancelled', updated_at = NOW()
  WHERE user_id = v_payment.user_id AND status = 'active';

  INSERT INTO public.memberships (
    user_id, plan_id, status, started_at, expires_at, tasks_completed_today, last_task_date
  ) VALUES (
    v_payment.user_id, v_plan.id, 'active', NOW(), NOW() + (v_plan.duration_days || ' days')::INTERVAL, 0, CURRENT_DATE
  );

  -- 3. Ensure buyer wallet account exists
  INSERT INTO public.wallet_accounts (user_id, balance, pending_balance, total_earned, total_withdrawn, currency)
  VALUES (v_payment.user_id, 0.00, 0.00, 0.00, 0.00, 'PKR')
  ON CONFLICT (user_id) DO NOTHING;

  -- Record purchase ledger entry for buyer
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

    -- Ensure referrer wallet account exists
    INSERT INTO public.wallet_accounts (user_id, balance, pending_balance, total_earned, total_withdrawn, currency)
    VALUES (v_referrer_record.referrer_id, 0.00, 0.00, 0.00, 0.00, 'PKR')
    ON CONFLICT (user_id) DO NOTHING;

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
        v_referrer_wallet.id, v_referrer_record.referrer_id, 'referral_bonus', v_comm_amount,
        v_referrer_wallet.balance, v_new_ref_balance,
        CONCAT('10% Direct Referral Commission from ', v_plan.name, ' purchase'),
        p_payment_id
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

  -- 5. Notification to buyer
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
    'user_id', v_payment.user_id,
    'payment_id', p_payment_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Hardened rpc_process_withdrawal
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
    UPDATE public.wallet_accounts
    SET pending_balance = GREATEST(0.00, pending_balance - v_withdrawal.amount),
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
    UPDATE public.wallet_accounts
    SET balance = balance + v_withdrawal.amount,
        pending_balance = GREATEST(0.00, pending_balance - v_withdrawal.amount),
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

  RETURN jsonb_build_object('success', TRUE, 'action', p_action, 'withdrawal_id', p_withdrawal_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
