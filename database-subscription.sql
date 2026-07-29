-- ============================================================
-- VIP subscription payments (adapted from KH Invoice's PayWay
-- integration — same flow, but unlocks `profiles.is_vip` /
-- `vip_expires_at` instead of `is_locked`.)
-- ============================================================

CREATE TABLE IF NOT EXISTS subscription_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  plan text NOT NULL CHECK (plan IN ('1m','6m','1y')),
  amount numeric NOT NULL,
  discount numeric NOT NULL DEFAULT 0,
  description text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','rejected')),
  transaction_id text,          -- user's own manual claim (manual-proof flow)
  payway_tran_id text UNIQUE,   -- our generated id sent to PayWay's generate-qr API
  qr_expires_at timestamptz,    -- when the generated KHQR code stops being scannable
  payment_date date,
  proof_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscription_requests_user ON subscription_requests(user_id, created_at);

-- Users can only see/create their own requests; status changes are admin/trigger only.
ALTER TABLE subscription_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select own subscription requests" ON subscription_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "insert own subscription requests" ON subscription_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ---------- Auto-unlock trigger ----------
-- Fires whenever a subscription_requests row's status changes to
-- 'confirmed' (done by the check-qr-status Edge Function once PayWay
-- confirms payment, or manually by an admin for edge cases). Extends
-- profiles.vip_expires_at and sets profiles.is_vip = true.
CREATE OR REPLACE FUNCTION apply_subscription_on_confirm()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  plan_months integer;
  current_expiry timestamptz;
BEGIN
  IF NEW.status = 'confirmed' AND (OLD.status IS DISTINCT FROM 'confirmed') THEN
    plan_months := CASE NEW.plan
      WHEN '1m' THEN 1
      WHEN '6m' THEN 6
      WHEN '1y' THEN 12
      ELSE 1
    END;

    SELECT vip_expires_at INTO current_expiry FROM profiles WHERE id = NEW.user_id;

    UPDATE profiles
    SET is_vip = true,
        vip_expires_at = GREATEST(now(), COALESCE(current_expiry, now())) + (plan_months || ' months')::interval
    WHERE id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_apply_subscription_on_confirm ON subscription_requests;
CREATE TRIGGER trg_apply_subscription_on_confirm
  AFTER UPDATE ON subscription_requests
  FOR EACH ROW
  EXECUTE FUNCTION apply_subscription_on_confirm();

-- Note: this does NOT auto re-lock accounts when vip_expires_at passes —
-- that needs a small scheduled Edge Function (e.g. daily cron) that sets
-- is_vip = false where vip_expires_at < now(). Ask me to add that next
-- if you want expired VIPs to lose access automatically.
