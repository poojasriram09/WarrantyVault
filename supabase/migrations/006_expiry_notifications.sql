-- ===========================================
-- MIGRATION 006: Smart Expiry Notifications
-- pg_cron + SQL function approach
-- ===========================================

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Fix channel constraint to include in_app
ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_channel_check;
ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_channel_check
  CHECK (channel IN ('push', 'email', 'sms', 'in_app'));

-- 3. Fix type constraint to include expiry_90d
ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('expiry_90d', 'expiry_30d', 'expiry_7d', 'expiry_1d', 'expiry_today', 'claim_update'));

-- 4. Core notification generator function
--    Runs inside the DB, bypasses RLS (SECURITY DEFINER),
--    inserts in_app notifications for warranties expiring in 90/30/7/1/0 days.
--    Deduplicates: never inserts the same warranty+type twice on the same calendar day.
CREATE OR REPLACE FUNCTION public.generate_expiry_notifications()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_inserted  INTEGER := 0;
  batch_inserted  INTEGER := 0;
  days_ahead      INTEGER;
  notif_type      TEXT;
  title_prefix    TEXT;
  msg_suffix      TEXT;
BEGIN
  -- Loop over each check window
  FOREACH days_ahead IN ARRAY ARRAY[90, 30, 7, 1, 0]
  LOOP
    -- Map days to type/message
    notif_type   := CASE days_ahead
                      WHEN 90 THEN 'expiry_90d'
                      WHEN 30 THEN 'expiry_30d'
                      WHEN  7 THEN 'expiry_7d'
                      WHEN  1 THEN 'expiry_1d'
                      WHEN  0 THEN 'expiry_today'
                    END;
    title_prefix := CASE days_ahead
                      WHEN 90 THEN 'Warranty reminder'
                      WHEN 30 THEN 'Warranty expiring soon'
                      WHEN  7 THEN 'Warranty expiring in 7 days'
                      WHEN  1 THEN 'Warranty expires tomorrow'
                      WHEN  0 THEN 'Warranty expires TODAY'
                    END;
    msg_suffix   := CASE days_ahead
                      WHEN 90 THEN 'expires in 90 days. Plan ahead.'
                      WHEN 30 THEN 'expires in 30 days. Consider renewing.'
                      WHEN  7 THEN 'expires in 7 days. Act now!'
                      WHEN  1 THEN 'expires tomorrow. File a claim if needed!'
                      WHEN  0 THEN 'expires today! Last chance to file a claim.'
                    END;

    INSERT INTO public.notifications
      (user_id, warranty_id, type, channel, title, message, is_read, sent_at)
    SELECT
      w.user_id,
      w.id,
      notif_type,
      'in_app',
      title_prefix || ': ' || p.product_name,
      p.product_name
        || ' (' || COALESCE(p.brand, 'Unknown brand') || ') '
        || msg_suffix,
      false,
      NOW()
    FROM public.warranties w
    JOIN public.products p ON p.id = w.product_id
    WHERE w.end_date = CURRENT_DATE + days_ahead
      -- Deduplicate: skip if same warranty+type already notified today
      AND NOT EXISTS (
        SELECT 1
        FROM public.notifications n
        WHERE n.warranty_id = w.id
          AND n.type        = notif_type
          AND n.sent_at::date = CURRENT_DATE
      );

    GET DIAGNOSTICS batch_inserted = ROW_COUNT;
    total_inserted := total_inserted + batch_inserted;
  END LOOP;

  RETURN total_inserted;
END;
$$;

-- Allow the anon/service role to call this function
GRANT EXECUTE ON FUNCTION public.generate_expiry_notifications() TO service_role;

-- 5. Schedule with pg_cron — runs every day at 9:00 AM UTC
--    Unschedule first in case this migration is re-run
SELECT cron.unschedule('daily-expiry-notifications');

SELECT cron.schedule(
  'daily-expiry-notifications',
  '0 9 * * *',
  $cron$SELECT public.generate_expiry_notifications()$cron$
);
