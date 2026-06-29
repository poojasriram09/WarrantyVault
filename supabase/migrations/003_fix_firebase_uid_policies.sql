-- Run this in Supabase Dashboard → SQL Editor
--
-- Root cause: auth.uid() casts the JWT 'sub' claim to UUID type.
-- Firebase UIDs are plain text (e.g. "Un0hSnDHjgMTHT2d9I9xcBG..."), not UUIDs,
-- so the cast returns null and every policy check fails silently.
-- Fix: use auth.jwt() ->> 'sub' which returns text as-is.
--
-- Also adds a SECURITY DEFINER function for user upsert so it bypasses
-- RLS completely — the INSERT doesn't need a valid JWT to succeed.

-- ─── SECURITY DEFINER function for Firebase user sync ────────────────────────
-- Called from useAuth.js instead of a direct table upsert.
-- Bypasses RLS so it works regardless of JWT / Third-Party Auth state.
CREATE OR REPLACE FUNCTION public.sync_firebase_user(
  p_firebase_uid  TEXT,
  p_email         TEXT,
  p_display_name  TEXT DEFAULT NULL,
  p_avatar_url    TEXT DEFAULT NULL
)
RETURNS public.users
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user public.users;
BEGIN
  INSERT INTO public.users (firebase_uid, email, display_name, avatar_url)
  VALUES (p_firebase_uid, p_email, p_display_name, p_avatar_url)
  ON CONFLICT (firebase_uid) DO UPDATE
    SET email        = EXCLUDED.email,
        display_name = COALESCE(EXCLUDED.display_name, users.display_name),
        avatar_url   = COALESCE(EXCLUDED.avatar_url,   users.avatar_url),
        updated_at   = now()
  RETURNING * INTO v_user;

  RETURN v_user;
END;
$$;

GRANT EXECUTE ON FUNCTION public.sync_firebase_user(TEXT, TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.sync_firebase_user(TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- ─── USERS ───────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users access own data"   ON public.users;
DROP POLICY IF EXISTS "Allow user registration" ON public.users;
DROP POLICY IF EXISTS "Allow user lookup"       ON public.users;
DROP POLICY IF EXISTS "allow_firebase_upsert"   ON public.users;

CREATE POLICY "Users access own data" ON public.users
  FOR ALL
  USING     (firebase_uid = (auth.jwt() ->> 'sub'))
  WITH CHECK (firebase_uid = (auth.jwt() ->> 'sub'));

-- ─── PRODUCTS ────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users access own products" ON public.products;

CREATE POLICY "Users access own products" ON public.products
  FOR ALL
  USING (user_id = (
    SELECT id FROM public.users WHERE firebase_uid = (auth.jwt() ->> 'sub')
  ))
  WITH CHECK (user_id = (
    SELECT id FROM public.users WHERE firebase_uid = (auth.jwt() ->> 'sub')
  ));

-- ─── WARRANTIES ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users access own warranties" ON public.warranties;

CREATE POLICY "Users access own warranties" ON public.warranties
  FOR ALL
  USING (user_id = (
    SELECT id FROM public.users WHERE firebase_uid = (auth.jwt() ->> 'sub')
  ))
  WITH CHECK (user_id = (
    SELECT id FROM public.users WHERE firebase_uid = (auth.jwt() ->> 'sub')
  ));

-- ─── DOCUMENTS ───────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users access own documents" ON public.documents;

CREATE POLICY "Users access own documents" ON public.documents
  FOR ALL
  USING (user_id = (
    SELECT id FROM public.users WHERE firebase_uid = (auth.jwt() ->> 'sub')
  ))
  WITH CHECK (user_id = (
    SELECT id FROM public.users WHERE firebase_uid = (auth.jwt() ->> 'sub')
  ));

-- ─── CLAIMS ──────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users access own claims" ON public.claims;

CREATE POLICY "Users access own claims" ON public.claims
  FOR ALL
  USING (user_id = (
    SELECT id FROM public.users WHERE firebase_uid = (auth.jwt() ->> 'sub')
  ))
  WITH CHECK (user_id = (
    SELECT id FROM public.users WHERE firebase_uid = (auth.jwt() ->> 'sub')
  ));

-- ─── NOTIFICATIONS ───────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users access own notifications" ON public.notifications;

CREATE POLICY "Users access own notifications" ON public.notifications
  FOR ALL
  USING (user_id = (
    SELECT id FROM public.users WHERE firebase_uid = (auth.jwt() ->> 'sub')
  ))
  WITH CHECK (user_id = (
    SELECT id FROM public.users WHERE firebase_uid = (auth.jwt() ->> 'sub')
  ));

-- ─── CHAT MESSAGES ───────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users access own chats" ON public.chat_messages;

CREATE POLICY "Users access own chats" ON public.chat_messages
  FOR ALL
  USING (user_id = (
    SELECT id FROM public.users WHERE firebase_uid = (auth.jwt() ->> 'sub')
  ))
  WITH CHECK (user_id = (
    SELECT id FROM public.users WHERE firebase_uid = (auth.jwt() ->> 'sub')
  ));
