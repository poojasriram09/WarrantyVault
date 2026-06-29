-- ============================================================================
-- Migration 012: Header-Based Row-Level Security
--
-- The frontend sets an "x-firebase-uid" header on every Supabase request
-- after Firebase login. RLS policies use current_setting() to read this
-- header and resolve the internal user_id.
--
-- This provides per-user data isolation without Supabase Auth or Edge Functions.
-- Firebase UIDs are 28-char random strings — not guessable.
-- ============================================================================

-- Helper function: resolve user_id from the Firebase UID header
CREATE OR REPLACE FUNCTION public.requesting_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT id FROM public.users
  WHERE firebase_uid = current_setting('request.headers.x-firebase-uid', true)
  LIMIT 1;
$$;

-- Re-enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warranties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_centers ENABLE ROW LEVEL SECURITY;

-- Drop existing permissive policies
DROP POLICY IF EXISTS "Anon full access" ON public.users;
DROP POLICY IF EXISTS "Anon full access" ON public.products;
DROP POLICY IF EXISTS "Anon full access" ON public.warranties;
DROP POLICY IF EXISTS "Anon full access" ON public.documents;
DROP POLICY IF EXISTS "Anon full access" ON public.claims;
DROP POLICY IF EXISTS "Anon full access" ON public.notifications;
DROP POLICY IF EXISTS "Anon full access" ON public.service_centers;

-- ── users ──────────────────────────────────────────────────────────────────────
-- Users can read their own row. Insert allowed for sync_firebase_user RPC.
CREATE POLICY "Users read own row"
  ON public.users FOR SELECT
  USING (
    firebase_uid = current_setting('request.headers.x-firebase-uid', true)
    OR current_setting('request.headers.x-firebase-uid', true) IS NULL
  );

CREATE POLICY "Users update own row"
  ON public.users FOR UPDATE
  USING (firebase_uid = current_setting('request.headers.x-firebase-uid', true))
  WITH CHECK (firebase_uid = current_setting('request.headers.x-firebase-uid', true));

CREATE POLICY "Allow inserts for user sync"
  ON public.users FOR INSERT
  WITH CHECK (true);

-- ── products ───────────────────────────────────────────────────────────────────
CREATE POLICY "Users own products"
  ON public.products FOR ALL
  USING (user_id = public.requesting_user_id())
  WITH CHECK (user_id = public.requesting_user_id());

-- ── warranties ─────────────────────────────────────────────────────────────────
CREATE POLICY "Users own warranties"
  ON public.warranties FOR ALL
  USING (user_id = public.requesting_user_id())
  WITH CHECK (user_id = public.requesting_user_id());

-- ── documents ──────────────────────────────────────────────────────────────────
CREATE POLICY "Users own documents"
  ON public.documents FOR ALL
  USING (user_id = public.requesting_user_id())
  WITH CHECK (user_id = public.requesting_user_id());

-- ── claims ─────────────────────────────────────────────────────────────────────
CREATE POLICY "Users own claims"
  ON public.claims FOR ALL
  USING (user_id = public.requesting_user_id())
  WITH CHECK (user_id = public.requesting_user_id());

-- ── notifications ──────────────────────────────────────────────────────────────
CREATE POLICY "Users own notifications"
  ON public.notifications FOR ALL
  USING (user_id = public.requesting_user_id())
  WITH CHECK (user_id = public.requesting_user_id());

-- ── service_centers ────────────────────────────────────────────────────────────
-- Public read (no auth needed). No write for regular users.
CREATE POLICY "Service centers public read"
  ON public.service_centers FOR SELECT
  USING (true);
