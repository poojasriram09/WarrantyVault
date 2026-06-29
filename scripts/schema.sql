
-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firebase_uid  TEXT UNIQUE NOT NULL,
  email         TEXT,
  display_name  TEXT,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- PRODUCTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.products (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID REFERENCES public.users(id) ON DELETE CASCADE,
  product_name   TEXT NOT NULL,
  brand          TEXT,
  model_number   TEXT,
  serial_number  TEXT,
  category       TEXT DEFAULT 'other',
  purchase_date  DATE,
  purchase_price NUMERIC(12,2),
  retailer       TEXT,
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- WARRANTIES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.warranties (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id               UUID REFERENCES public.products(id) ON DELETE CASCADE,
  user_id                  UUID REFERENCES public.users(id) ON DELETE CASCADE,
  warranty_type            TEXT DEFAULT 'manufacturer',
  start_date               DATE,
  end_date                 DATE,
  warranty_duration_months INT,
  created_at               TIMESTAMPTZ DEFAULT now(),
  updated_at               TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- DOCUMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.documents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    UUID REFERENCES public.products(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES public.users(id) ON DELETE CASCADE,
  doc_type      TEXT CHECK (doc_type IN ('invoice','receipt','warranty_card','manual','insurance','other')),
  file_url      TEXT NOT NULL,
  public_id     TEXT,
  file_name     TEXT,
  file_size     INT,
  mime_type     TEXT,
  ocr_raw_text  TEXT,
  uploaded_at   TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- CLAIMS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.claims (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warranty_id    UUID REFERENCES public.warranties(id) ON DELETE CASCADE,
  user_id        UUID REFERENCES public.users(id) ON DELETE CASCADE,
  issue_summary  TEXT,
  issue_details  TEXT,
  status         TEXT DEFAULT 'submitted',
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES public.users(id) ON DELETE CASCADE,
  warranty_id UUID REFERENCES public.warranties(id) ON DELETE CASCADE,
  type        TEXT CHECK (type IN ('expiry_0d','expiry_1d','expiry_7d','expiry_30d','expiry_90d')),
  channel     TEXT CHECK (channel IN ('in_app','email','push')),
  message     TEXT,
  is_read     BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- CHAT MESSAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES public.users(id) ON DELETE CASCADE,
  role       TEXT CHECK (role IN ('user','assistant')),
  content    TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- SERVICE CENTERS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.service_centers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand           TEXT NOT NULL,
  name            TEXT NOT NULL,
  address         TEXT,
  area            TEXT,
  city            TEXT,
  state           TEXT,
  pincode         TEXT,
  phone           TEXT,
  email           TEXT,
  latitude        DOUBLE PRECISION,
  longitude       DOUBLE PRECISION,
  map_url         TEXT,
  warranty_label  TEXT,
  warranty_url    TEXT
);

-- ============================================================
-- WARRANTIES STATUS VIEW
-- ============================================================
CREATE OR REPLACE VIEW public.warranties_with_status AS
  SELECT *,
    CASE
      WHEN end_date < CURRENT_DATE THEN 'expired'
      WHEN end_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'expiring_soon'
      ELSE 'active'
    END AS status
  FROM public.warranties;

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_products_user      ON public.products(user_id);
CREATE INDEX IF NOT EXISTS idx_warranties_user    ON public.warranties(user_id);
CREATE INDEX IF NOT EXISTS idx_warranties_product ON public.warranties(product_id);
CREATE INDEX IF NOT EXISTS idx_documents_product  ON public.documents(product_id);
CREATE INDEX IF NOT EXISTS idx_claims_warranty    ON public.claims(warranty_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_service_centers_brand ON public.service_centers(brand);
CREATE INDEX IF NOT EXISTS idx_service_centers_city  ON public.service_centers(city);

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE public.users            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warranties       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claims           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_centers  ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users access own data"    ON public.users;
  DROP POLICY IF EXISTS "Users access own products" ON public.products;
  DROP POLICY IF EXISTS "Users access own warranties" ON public.warranties;
  DROP POLICY IF EXISTS "Users access own documents" ON public.documents;
  DROP POLICY IF EXISTS "Users access own claims"  ON public.claims;
  DROP POLICY IF EXISTS "Users access own notifications" ON public.notifications;
  DROP POLICY IF EXISTS "Users access own chats"   ON public.chat_messages;
  DROP POLICY IF EXISTS "Service centers are public" ON public.service_centers;
  DROP POLICY IF EXISTS "Anon full access" ON public.users;
  DROP POLICY IF EXISTS "Anon full access" ON public.products;
  DROP POLICY IF EXISTS "Anon full access" ON public.warranties;
  DROP POLICY IF EXISTS "Anon full access" ON public.documents;
  DROP POLICY IF EXISTS "Anon full access" ON public.claims;
  DROP POLICY IF EXISTS "Anon full access" ON public.notifications;
  DROP POLICY IF EXISTS "Anon full access" ON public.chat_messages;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Firebase JWTs can't be verified by Supabase RLS directly.
-- Security is enforced at application layer (.eq("user_id", userId)).
CREATE POLICY "Anon full access" ON public.users            FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anon full access" ON public.products         FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anon full access" ON public.warranties       FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anon full access" ON public.documents        FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anon full access" ON public.claims           FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anon full access" ON public.notifications    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anon full access" ON public.chat_messages    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service centers are public" ON public.service_centers FOR SELECT USING (true);
CREATE POLICY "Anon full access" ON public.service_centers  FOR ALL   USING (true) WITH CHECK (true);

-- ============================================================
-- sync_firebase_user RPC
-- ============================================================
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
DECLARE v_user public.users;
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
