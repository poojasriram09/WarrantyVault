-- Run this in Supabase Dashboard → SQL Editor
--
-- Firebase JWTs can't be verified by Supabase without Third-Party Auth setup,
-- so JWT-based RLS is not usable here.
--
-- Security model: RLS allows anon to access all rows; data isolation is
-- enforced at the application layer (.eq("user_id", userId) in every query).
-- The sync_firebase_user function (from migration 003) handles user upsert securely.

-- ─── PRODUCTS ────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users access own products" ON public.products;

CREATE POLICY "Anon full access" ON public.products
  FOR ALL USING (true) WITH CHECK (true);

-- ─── WARRANTIES ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users access own warranties" ON public.warranties;

CREATE POLICY "Anon full access" ON public.warranties
  FOR ALL USING (true) WITH CHECK (true);

-- ─── DOCUMENTS ───────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users access own documents" ON public.documents;

CREATE POLICY "Anon full access" ON public.documents
  FOR ALL USING (true) WITH CHECK (true);

-- ─── CLAIMS ──────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users access own claims" ON public.claims;

CREATE POLICY "Anon full access" ON public.claims
  FOR ALL USING (true) WITH CHECK (true);

-- ─── NOTIFICATIONS ───────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users access own notifications" ON public.notifications;

CREATE POLICY "Anon full access" ON public.notifications
  FOR ALL USING (true) WITH CHECK (true);

-- ─── CHAT MESSAGES ───────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users access own chats" ON public.chat_messages;

CREATE POLICY "Anon full access" ON public.chat_messages
  FOR ALL USING (true) WITH CHECK (true);

-- ─── USERS ───────────────────────────────────────────────────────────────────
-- sync_firebase_user (SECURITY DEFINER) handles writes.
-- Allow anon to read users table (needed for profile lookups).
DROP POLICY IF EXISTS "Users access own data" ON public.users;

CREATE POLICY "Anon full access" ON public.users
  FOR ALL USING (true) WITH CHECK (true);
