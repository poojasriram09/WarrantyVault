-- Fix RLS so Firebase ID tokens are accepted by Supabase.
-- Run this in Supabase Dashboard → SQL Editor.

-- ─── USERS ───────────────────────────────────────────────────────────────────
-- The original policy had no WITH CHECK, so INSERT was always blocked.
-- Recreate it with WITH CHECK so the upsert on first login works.
DROP POLICY IF EXISTS "Users access own data" ON public.users;

CREATE POLICY "Users access own data" ON public.users
  FOR ALL
  USING     (firebase_uid = auth.uid()::text)
  WITH CHECK (firebase_uid = auth.uid()::text);

-- ─── PRODUCTS ────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users access own products" ON public.products;

CREATE POLICY "Users access own products" ON public.products
  FOR ALL
  USING (user_id = (
    SELECT id FROM public.users WHERE firebase_uid = auth.uid()::text
  ))
  WITH CHECK (user_id = (
    SELECT id FROM public.users WHERE firebase_uid = auth.uid()::text
  ));

-- ─── WARRANTIES ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users access own warranties" ON public.warranties;

CREATE POLICY "Users access own warranties" ON public.warranties
  FOR ALL
  USING (user_id = (
    SELECT id FROM public.users WHERE firebase_uid = auth.uid()::text
  ))
  WITH CHECK (user_id = (
    SELECT id FROM public.users WHERE firebase_uid = auth.uid()::text
  ));

-- ─── DOCUMENTS ───────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users access own documents" ON public.documents;

CREATE POLICY "Users access own documents" ON public.documents
  FOR ALL
  USING (user_id = (
    SELECT id FROM public.users WHERE firebase_uid = auth.uid()::text
  ))
  WITH CHECK (user_id = (
    SELECT id FROM public.users WHERE firebase_uid = auth.uid()::text
  ));

-- ─── CLAIMS ──────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users access own claims" ON public.claims;

CREATE POLICY "Users access own claims" ON public.claims
  FOR ALL
  USING (user_id = (
    SELECT id FROM public.users WHERE firebase_uid = auth.uid()::text
  ))
  WITH CHECK (user_id = (
    SELECT id FROM public.users WHERE firebase_uid = auth.uid()::text
  ));

-- ─── NOTIFICATIONS ───────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users access own notifications" ON public.notifications;

CREATE POLICY "Users access own notifications" ON public.notifications
  FOR ALL
  USING (user_id = (
    SELECT id FROM public.users WHERE firebase_uid = auth.uid()::text
  ))
  WITH CHECK (user_id = (
    SELECT id FROM public.users WHERE firebase_uid = auth.uid()::text
  ));

-- ─── CHAT MESSAGES ───────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users access own chats" ON public.chat_messages;

CREATE POLICY "Users access own chats" ON public.chat_messages
  FOR ALL
  USING (user_id = (
    SELECT id FROM public.users WHERE firebase_uid = auth.uid()::text
  ))
  WITH CHECK (user_id = (
    SELECT id FROM public.users WHERE firebase_uid = auth.uid()::text
  ));
