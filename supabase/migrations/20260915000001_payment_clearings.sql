-- ==============================================================================
-- EARNZO - PRODUCTION MIGRATION: PAYMENT CLEARING HISTORY & REVENUE RESET
-- ==============================================================================
-- Migration: 20260915000001_payment_clearings.sql
-- Description: Creates the payment_clearings table and atomic RPC to allow
--              administrators to clear the displayed revenue total without
--              deleting, altering or hiding original payment / transaction records.
-- ==============================================================================

-- 1. Create payment_clearings table
CREATE TABLE IF NOT EXISTS public.payment_clearings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference_id TEXT NOT NULL UNIQUE,
    amount_cleared NUMERIC(12, 2) NOT NULL CHECK (amount_cleared > 0),
    total_before NUMERIC(12, 2) NOT NULL,
    remaining_total NUMERIC(12, 2) NOT NULL,
    admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    admin_email TEXT NOT NULL,
    contributing_payments_count INT NOT NULL DEFAULT 0,
    contributing_users_count INT NOT NULL DEFAULT 0,
    breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast ordering
CREATE INDEX IF NOT EXISTS idx_payment_clearings_created ON public.payment_clearings(created_at DESC);

-- 2. Row Level Security
ALTER TABLE public.payment_clearings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read payment clearings" ON public.payment_clearings;
CREATE POLICY "Admins read payment clearings" ON public.payment_clearings
    FOR SELECT USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins insert payment clearings" ON public.payment_clearings;
CREATE POLICY "Admins insert payment clearings" ON public.payment_clearings
    FOR INSERT WITH CHECK (public.is_admin(auth.uid()));

-- 3. Add to Supabase Realtime
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'payment_clearings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.payment_clearings;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END $$;

-- 4. Atomic RPC: Admin Clear Revenue Total
CREATE OR REPLACE FUNCTION public.rpc_admin_clear_revenue(
  p_amount NUMERIC,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_admin_email TEXT;
  v_total_revenue NUMERIC(12, 2) := 0.00;
  v_total_cleared NUMERIC(12, 2) := 0.00;
  v_current_active NUMERIC(12, 2) := 0.00;
  v_remaining NUMERIC(12, 2) := 0.00;
  v_clearing_id UUID := uuid_generate_v4();
  v_ref_id TEXT;
  v_payments_count INT := 0;
  v_users_count INT := 0;
  v_breakdown JSONB;
BEGIN
  -- Authorization check
  IF NOT public.is_admin(v_admin_id) THEN
    RAISE EXCEPTION 'Access Denied: Only platform administrators can clear revenue totals.';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Invalid Amount: Clearing amount must be greater than zero.';
  END IF;

  SELECT email INTO v_admin_email FROM public.profiles WHERE id = v_admin_id;
  v_admin_email := COALESCE(v_admin_email, auth.jwt() ->> 'email', 'admin@earnzo.com');

  -- Calculate total verified paid revenue from immutable payments table
  SELECT COALESCE(SUM(amount), 0.00) INTO v_total_revenue 
  FROM public.payments 
  WHERE status = 'paid';

  -- Calculate previously cleared sum
  SELECT COALESCE(SUM(amount_cleared), 0.00) INTO v_total_cleared 
  FROM public.payment_clearings;

  v_current_active := GREATEST(0.00, v_total_revenue - v_total_cleared);

  IF p_amount > v_current_active THEN
    RAISE EXCEPTION 'Exceeded Limit: Clearing amount (Rs. %) exceeds current active total (Rs. %).', p_amount, v_current_active;
  END IF;

  v_remaining := v_current_active - p_amount;

  -- Count contributing payments and users
  SELECT COUNT(*), COUNT(DISTINCT user_id) 
  INTO v_payments_count, v_users_count
  FROM public.payments 
  WHERE status = 'paid';

  -- Generate breakdown of paid payments by method
  SELECT jsonb_object_agg(COALESCE(method, 'Other'), total_by_method)
  INTO v_breakdown
  FROM (
    SELECT method, SUM(amount) AS total_by_method
    FROM public.payments
    WHERE status = 'paid'
    GROUP BY method
  ) b;

  IF v_breakdown IS NULL THEN
    v_breakdown := '{}'::jsonb;
  END IF;

  v_ref_id := CONCAT('CLR-', TO_CHAR(NOW(), 'YYYYMMDD'), '-', SUBSTRING(v_clearing_id::text, 1, 8));

  -- Insert clearing record (historical record permanently preserved)
  INSERT INTO public.payment_clearings (
    id,
    reference_id,
    amount_cleared,
    total_before,
    remaining_total,
    admin_id,
    admin_email,
    contributing_payments_count,
    contributing_users_count,
    breakdown,
    notes,
    created_at
  ) VALUES (
    v_clearing_id,
    v_ref_id,
    p_amount,
    v_current_active,
    v_remaining,
    v_admin_id,
    v_admin_email,
    v_payments_count,
    v_users_count,
    v_breakdown,
    p_notes,
    NOW()
  );

  -- Non-blocking audit log
  BEGIN
    INSERT INTO public.audit_logs (actor_id, actor_email, action, entity, entity_id, details)
    VALUES (
      v_admin_id,
      v_admin_email,
      'revenue_cleared',
      'payment_clearings',
      v_clearing_id,
      jsonb_build_object(
        'reference_id', v_ref_id,
        'amount_cleared', p_amount,
        'total_before', v_current_active,
        'remaining_total', v_remaining,
        'notes', p_notes
      )
    );
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN jsonb_build_object(
    'success', TRUE,
    'id', v_clearing_id,
    'reference_id', v_ref_id,
    'amount_cleared', p_amount,
    'total_before', v_current_active,
    'remaining_total', v_remaining,
    'contributing_payments_count', v_payments_count,
    'contributing_users_count', v_users_count,
    'created_at', NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Grant permissions
GRANT EXECUTE ON FUNCTION public.rpc_admin_clear_revenue TO authenticated, anon;
