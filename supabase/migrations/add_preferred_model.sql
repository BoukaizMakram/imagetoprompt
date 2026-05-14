-- Run this in the Supabase SQL editor.

-- Add preferred model tier to user profiles.
-- standard = GPT-4o mini (1 credit, default)
-- enhanced = GPT-4.1 mini (2 credits)
-- premium  = Claude Haiku 4.5 (3 credits)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS preferred_model text NOT NULL DEFAULT 'standard'
  CHECK (preferred_model IN ('standard', 'enhanced', 'premium'));

-- Update consume_credit to deduct p_amount credits atomically.
-- Returns new remaining count, or -1 if insufficient credits.
CREATE OR REPLACE FUNCTION public.consume_credit(
  p_user_id uuid,
  p_billing_month text,
  p_amount integer DEFAULT 1
) RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_remaining integer;
  v_unlimited boolean;
BEGIN
  SELECT credits_remaining, unlimited
    INTO v_remaining, v_unlimited
  FROM public.credit_balances
  WHERE user_id = p_user_id AND billing_month = p_billing_month
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN -1;
  END IF;

  IF v_unlimited THEN
    RETURN 999999;
  END IF;

  IF v_remaining < p_amount THEN
    RETURN -1;
  END IF;

  UPDATE public.credit_balances
    SET credits_remaining = credits_remaining - p_amount,
        updated_at = now()
  WHERE user_id = p_user_id AND billing_month = p_billing_month;

  RETURN v_remaining - p_amount;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_credit(uuid, text, integer) FROM public;
GRANT EXECUTE ON FUNCTION public.consume_credit(uuid, text, integer) TO service_role;

-- Update refund_credit to refund p_amount credits.
CREATE OR REPLACE FUNCTION public.refund_credit(
  p_user_id uuid,
  p_billing_month text,
  p_amount integer DEFAULT 1
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.credit_balances
    SET credits_remaining = credits_remaining + p_amount,
        updated_at = now()
  WHERE user_id = p_user_id
    AND billing_month = p_billing_month
    AND unlimited = false;
END;
$$;

REVOKE ALL ON FUNCTION public.refund_credit(uuid, text, integer) FROM public;
GRANT EXECUTE ON FUNCTION public.refund_credit(uuid, text, integer) TO service_role;
