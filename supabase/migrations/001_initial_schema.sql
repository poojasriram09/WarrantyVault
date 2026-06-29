-- ===========================================
-- USERS (synced from Firebase Auth)
-- ===========================================
CREATE TABLE public.users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firebase_uid  TEXT UNIQUE NOT NULL,
  email         TEXT NOT NULL,
  display_name  TEXT,
  avatar_url    TEXT,
  phone         TEXT,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- ===========================================
-- PRODUCTS
-- ===========================================
CREATE TABLE public.products (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES public.users(id) ON DELETE CASCADE,
  product_name    TEXT NOT NULL,
  brand           TEXT,
  model_number    TEXT,
  serial_number   TEXT,
  category        TEXT CHECK (category IN (
                    'electronics', 'appliances', 'mobile',
                    'computer', 'kitchen', 'furniture',
                    'automotive', 'wearable', 'other'
                  )),
  purchase_date   DATE NOT NULL,
  purchase_price  NUMERIC(10,2),
  retailer        TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ===========================================
-- WARRANTIES
-- ===========================================
CREATE TABLE public.warranties (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id        UUID REFERENCES public.products(id) ON DELETE CASCADE,
  user_id           UUID REFERENCES public.users(id) ON DELETE CASCADE,
  warranty_provider TEXT,
  warranty_type     TEXT CHECK (warranty_type IN (
                      'manufacturer', 'extended', 'store', 'accidental'
                    )),
  start_date        DATE NOT NULL,
  end_date          DATE NOT NULL,
  warranty_duration_months INT,
  coverage_details  TEXT,
  terms_url         TEXT,
  created_at        TIMESTAMPTZ DEFAULT now()
);

-- ===========================================
-- DOCUMENTS (Digital Vault)
-- ===========================================
CREATE TABLE public.documents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    UUID REFERENCES public.products(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES public.users(id) ON DELETE CASCADE,
  doc_type      TEXT CHECK (doc_type IN (
                  'invoice', 'receipt', 'warranty_card',
                  'manual', 'insurance', 'other'
                )),
  file_url      TEXT NOT NULL,
  public_id     TEXT,
  file_name     TEXT,
  file_size     INT,
  mime_type     TEXT,
  ocr_raw_text  TEXT,
  uploaded_at   TIMESTAMPTZ DEFAULT now()
);

-- ===========================================
-- CLAIMS
-- ===========================================
CREATE TABLE public.claims (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warranty_id     UUID REFERENCES public.warranties(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES public.users(id) ON DELETE CASCADE,
  issue_summary   TEXT NOT NULL,
  issue_details   TEXT,
  claim_status    TEXT DEFAULT 'draft' CHECK (claim_status IN (
                    'draft', 'submitted', 'in_progress',
                    'approved', 'rejected', 'completed'
                  )),
  submitted_at    TIMESTAMPTZ,
  resolved_at     TIMESTAMPTZ,
  ai_suggestion   TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ===========================================
-- NOTIFICATIONS LOG
-- ===========================================
CREATE TABLE public.notifications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES public.users(id) ON DELETE CASCADE,
  warranty_id   UUID REFERENCES public.warranties(id) ON DELETE SET NULL,
  type          TEXT CHECK (type IN ('expiry_30d', 'expiry_7d', 'expiry_1d', 'expiry_today', 'claim_update')),
  channel       TEXT CHECK (channel IN ('push', 'email', 'sms')),
  title         TEXT,
  message       TEXT,
  is_read       BOOLEAN DEFAULT false,
  sent_at       TIMESTAMPTZ DEFAULT now()
);

-- ===========================================
-- SERVICE CENTERS
-- ===========================================
CREATE TABLE public.service_centers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand       TEXT NOT NULL,
  name        TEXT NOT NULL,
  address     TEXT,
  city        TEXT,
  state       TEXT,
  pincode     TEXT,
  phone       TEXT,
  email       TEXT,
  latitude    DOUBLE PRECISION,
  longitude   DOUBLE PRECISION,
  map_url     TEXT
);

-- ===========================================
-- AI CHAT HISTORY
-- ===========================================
CREATE TABLE public.chat_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES public.users(id) ON DELETE CASCADE,
  role        TEXT CHECK (role IN ('user', 'assistant')),
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ===========================================
-- ROW LEVEL SECURITY
-- ===========================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warranties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users access own data" ON public.users
  FOR ALL USING (firebase_uid = auth.uid()::text);

CREATE POLICY "Users access own products" ON public.products
  FOR ALL USING (user_id = (
    SELECT id FROM public.users WHERE firebase_uid = auth.uid()::text
  ));

CREATE POLICY "Users access own warranties" ON public.warranties
  FOR ALL USING (user_id = (
    SELECT id FROM public.users WHERE firebase_uid = auth.uid()::text
  ));

CREATE POLICY "Users access own documents" ON public.documents
  FOR ALL USING (user_id = (
    SELECT id FROM public.users WHERE firebase_uid = auth.uid()::text
  ));

CREATE POLICY "Users access own claims" ON public.claims
  FOR ALL USING (user_id = (
    SELECT id FROM public.users WHERE firebase_uid = auth.uid()::text
  ));

CREATE POLICY "Users access own notifications" ON public.notifications
  FOR ALL USING (user_id = (
    SELECT id FROM public.users WHERE firebase_uid = auth.uid()::text
  ));

CREATE POLICY "Users access own chats" ON public.chat_messages
  FOR ALL USING (user_id = (
    SELECT id FROM public.users WHERE firebase_uid = auth.uid()::text
  ));

CREATE POLICY "Service centers are public" ON public.service_centers
  FOR SELECT USING (true);

-- ===========================================
-- STATUS VIEW (CURRENT_DATE not allowed in generated columns)
-- ===========================================
CREATE OR REPLACE VIEW public.warranties_with_status AS
  SELECT *,
    CASE
      WHEN end_date < CURRENT_DATE THEN 'expired'
      WHEN end_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'expiring_soon'
      ELSE 'active'
    END AS status
  FROM public.warranties;

-- ===========================================
-- INDEXES
-- ===========================================
CREATE INDEX idx_products_user ON public.products(user_id);
CREATE INDEX idx_warranties_user ON public.warranties(user_id);
CREATE INDEX idx_warranties_end_date ON public.warranties(end_date);
CREATE INDEX idx_documents_product ON public.documents(product_id);
CREATE INDEX idx_claims_warranty ON public.claims(warranty_id);
CREATE INDEX idx_notifications_user ON public.notifications(user_id, is_read);
CREATE INDEX idx_service_centers_brand ON public.service_centers(brand);
CREATE INDEX idx_service_centers_city ON public.service_centers(city);
