-- ============================================================================
-- Migration 013: Revert RLS to permissive policies
--
-- The header-based RLS (migration 012) doesn't work reliably with Supabase
-- PostgREST because custom headers are not exposed via current_setting().
-- Reverting to anon full-access policies. Data isolation is enforced at the
-- application layer via .eq("user_id", userId) in every query.
-- ============================================================================

-- Drop the header-based policies
DROP POLICY IF EXISTS "Users read own row" ON public.users;
DROP POLICY IF EXISTS "Users update own row" ON public.users;
DROP POLICY IF EXISTS "Allow inserts for user sync" ON public.users;
DROP POLICY IF EXISTS "Users own products" ON public.products;
DROP POLICY IF EXISTS "Users own warranties" ON public.warranties;
DROP POLICY IF EXISTS "Users own documents" ON public.documents;
DROP POLICY IF EXISTS "Users own claims" ON public.claims;
DROP POLICY IF EXISTS "Users own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Service centers public read" ON public.service_centers;

-- Drop the helper function
DROP FUNCTION IF EXISTS public.requesting_user_id();

-- Restore permissive policies
CREATE POLICY "Anon full access" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anon full access" ON public.products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anon full access" ON public.warranties FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anon full access" ON public.documents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anon full access" ON public.claims FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anon full access" ON public.notifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anon full access" ON public.service_centers FOR ALL USING (true) WITH CHECK (true);
