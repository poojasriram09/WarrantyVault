-- ===========================================
-- MIGRATION 008: Fix notify_user_on_login to use
-- range-based checks instead of exact-day matches.
-- Previously only fired at exactly 0/1/7/30/90 days.
-- Now fires for any warranty expiring within each window.
-- Deduplication: skip if same warranty+type was already
-- notified today, preventing spam on repeated visits.
-- ===========================================

CREATE OR REPLACE FUNCTION public.notify_user_on_login(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_inserted INTEGER := 0;
  batch_inserted INTEGER := 0;
BEGIN

  -- ── TODAY (0 days) ──────────────────────────────────────────
  INSERT INTO public.notifications
    (user_id, warranty_id, type, channel, title, message, is_read, sent_at)
  SELECT
    w.user_id,
    w.id,
    'expiry_today',
    'in_app',
    'Warranty expires TODAY: ' || p.product_name,
    p.product_name || ' (' || COALESCE(p.brand, 'Unknown brand')
      || ') expires today! Last chance to file a claim.',
    false,
    NOW()
  FROM public.warranties w
  JOIN public.products p ON p.id = w.product_id
  WHERE w.user_id = p_user_id
    AND w.end_date = CURRENT_DATE
    AND NOT EXISTS (
      SELECT 1 FROM public.notifications n
      WHERE n.warranty_id = w.id
        AND n.type = 'expiry_today'
        AND n.sent_at::date = CURRENT_DATE
    );

  GET DIAGNOSTICS batch_inserted = ROW_COUNT;
  total_inserted := total_inserted + batch_inserted;

  -- ── TOMORROW (1 day) ────────────────────────────────────────
  INSERT INTO public.notifications
    (user_id, warranty_id, type, channel, title, message, is_read, sent_at)
  SELECT
    w.user_id,
    w.id,
    'expiry_1d',
    'in_app',
    'Warranty expires tomorrow: ' || p.product_name,
    p.product_name || ' (' || COALESCE(p.brand, 'Unknown brand')
      || ') expires tomorrow. File a claim if needed!',
    false,
    NOW()
  FROM public.warranties w
  JOIN public.products p ON p.id = w.product_id
  WHERE w.user_id = p_user_id
    AND w.end_date = CURRENT_DATE + 1
    AND NOT EXISTS (
      SELECT 1 FROM public.notifications n
      WHERE n.warranty_id = w.id
        AND n.type = 'expiry_1d'
        AND n.sent_at::date = CURRENT_DATE
    );

  GET DIAGNOSTICS batch_inserted = ROW_COUNT;
  total_inserted := total_inserted + batch_inserted;

  -- ── WITHIN 7 DAYS (2–7 days) ────────────────────────────────
  INSERT INTO public.notifications
    (user_id, warranty_id, type, channel, title, message, is_read, sent_at)
  SELECT
    w.user_id,
    w.id,
    'expiry_7d',
    'in_app',
    'Warranty expiring in ' || (w.end_date - CURRENT_DATE)::text || ' days: ' || p.product_name,
    p.product_name || ' (' || COALESCE(p.brand, 'Unknown brand')
      || ') expires in ' || (w.end_date - CURRENT_DATE)::text || ' days. Act now!',
    false,
    NOW()
  FROM public.warranties w
  JOIN public.products p ON p.id = w.product_id
  WHERE w.user_id = p_user_id
    AND w.end_date > CURRENT_DATE + 1
    AND w.end_date <= CURRENT_DATE + 7
    AND NOT EXISTS (
      SELECT 1 FROM public.notifications n
      WHERE n.warranty_id = w.id
        AND n.type = 'expiry_7d'
        AND n.sent_at::date = CURRENT_DATE
    );

  GET DIAGNOSTICS batch_inserted = ROW_COUNT;
  total_inserted := total_inserted + batch_inserted;

  -- ── WITHIN 30 DAYS (8–30 days) ──────────────────────────────
  INSERT INTO public.notifications
    (user_id, warranty_id, type, channel, title, message, is_read, sent_at)
  SELECT
    w.user_id,
    w.id,
    'expiry_30d',
    'in_app',
    'Warranty expiring soon: ' || p.product_name,
    p.product_name || ' (' || COALESCE(p.brand, 'Unknown brand')
      || ') expires in ' || (w.end_date - CURRENT_DATE)::text || ' days. Consider renewing.',
    false,
    NOW()
  FROM public.warranties w
  JOIN public.products p ON p.id = w.product_id
  WHERE w.user_id = p_user_id
    AND w.end_date > CURRENT_DATE + 7
    AND w.end_date <= CURRENT_DATE + 30
    AND NOT EXISTS (
      SELECT 1 FROM public.notifications n
      WHERE n.warranty_id = w.id
        AND n.type = 'expiry_30d'
        AND n.sent_at::date = CURRENT_DATE
    );

  GET DIAGNOSTICS batch_inserted = ROW_COUNT;
  total_inserted := total_inserted + batch_inserted;

  -- ── WITHIN 90 DAYS (31–90 days) ─────────────────────────────
  INSERT INTO public.notifications
    (user_id, warranty_id, type, channel, title, message, is_read, sent_at)
  SELECT
    w.user_id,
    w.id,
    'expiry_90d',
    'in_app',
    'Warranty reminder: ' || p.product_name,
    p.product_name || ' (' || COALESCE(p.brand, 'Unknown brand')
      || ') expires in ' || (w.end_date - CURRENT_DATE)::text || ' days. Plan ahead.',
    false,
    NOW()
  FROM public.warranties w
  JOIN public.products p ON p.id = w.product_id
  WHERE w.user_id = p_user_id
    AND w.end_date > CURRENT_DATE + 30
    AND w.end_date <= CURRENT_DATE + 90
    AND NOT EXISTS (
      SELECT 1 FROM public.notifications n
      WHERE n.warranty_id = w.id
        AND n.type = 'expiry_90d'
        AND n.sent_at::date = CURRENT_DATE
    );

  GET DIAGNOSTICS batch_inserted = ROW_COUNT;
  total_inserted := total_inserted + batch_inserted;

  RETURN total_inserted;
END;
$$;

GRANT EXECUTE ON FUNCTION public.notify_user_on_login(UUID) TO anon, authenticated, service_role;
