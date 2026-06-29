-- ===========================================
-- MIGRATION 007: Per-user notification on login
-- Called from the frontend via supabase.rpc()
-- immediately after a user signs in.
-- ===========================================

CREATE OR REPLACE FUNCTION public.notify_user_on_login(p_user_id UUID)
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
  FOREACH days_ahead IN ARRAY ARRAY[90, 30, 7, 1, 0]
  LOOP
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
    WHERE w.user_id = p_user_id
      AND w.end_date = CURRENT_DATE + days_ahead;

    GET DIAGNOSTICS batch_inserted = ROW_COUNT;
    total_inserted := total_inserted + batch_inserted;
  END LOOP;

  RETURN total_inserted;
END;
$$;

GRANT EXECUTE ON FUNCTION public.notify_user_on_login(UUID) TO anon, authenticated, service_role;
