-- Migration 009: Add area column and seed service center data

ALTER TABLE public.service_centers
  ADD COLUMN IF NOT EXISTS area TEXT;

-- Seed Mumbai service centers (idempotent — skip if name already exists)
INSERT INTO public.service_centers (brand, name, address, area, city, state, pincode, phone, email, latitude, longitude, map_url)
SELECT v.brand, v.name, v.address, v.area, v.city, v.state, v.pincode, v.phone, v.email, v.latitude, v.longitude, v.map_url
FROM (VALUES
  ('Samsung',   'Samsung SmartCafé – Andheri',       'Shop 4, Prem Plaza, Andheri West',       'Andheri',     'Mumbai', 'Maharashtra', '400058', '1800 5 7267864', 'support@samsung.com',   19.1313,  72.8258, NULL),
  ('Samsung',   'Samsung Service Centre – Dadar',    '22, Govardhan Society, Dadar East',      'Dadar',       'Mumbai', 'Maharashtra', '400014', '1800 5 7267864', 'support@samsung.com',   19.0178,  72.8478, NULL),
  ('Apple',     'Apple Authorised Service – Bandra', 'Ground Floor, Hill Road, Bandra West',   'Bandra',      'Mumbai', 'Maharashtra', '400050', '1800 2000 744',  'support@apple.com',     19.0544,  72.8404, NULL),
  ('Apple',     'iCare Apple Service – Powai',       'Hiranandani Gardens, Powai',             'Powai',       'Mumbai', 'Maharashtra', '400076', '022-25701234',   'icare@example.com',     19.1176,  72.9060, NULL),
  ('LG',        'LG Service Centre – Borivali',      'Shop 7, Chandavarkar Rd, Borivali West', 'Borivali',    'Mumbai', 'Maharashtra', '400092', '1800 315 9999',  'lgcare@lge.com',        19.2307,  72.8567, NULL),
  ('LG',        'LG Service Centre – Thane',         'Gokhale Road, Naupada, Thane West',      'Thane',       'Mumbai', 'Maharashtra', '400602', '1800 315 9999',  'lgcare@lge.com',        19.1972,  72.9700, NULL),
  ('Sony',      'Sony Service Centre – Malad',       'S.V. Road, Malad West',                  'Malad',       'Mumbai', 'Maharashtra', '400064', '1800 103 7799',  'sony.india@sony.com',   19.1864,  72.8481, NULL),
  ('Sony',      'Sony Authorised – Vashi',           'Plot 17, Sector 17, Vashi, Navi Mumbai', 'Vashi',       'Mumbai', 'Maharashtra', '400703', '1800 103 7799',  'sony.india@sony.com',   19.0771,  73.0071, NULL),
  ('Whirlpool', 'Whirlpool Service – Kandivali',     'Thakur Village, Kandivali East',         'Kandivali',   'Mumbai', 'Maharashtra', '400101', '1800 208 1800',  'whirlpool@support.com', 19.2041,  72.8737, NULL),
  ('Bosch',     'Bosch Home Appliance Service',      'Kurla-Andheri Road, Saki Naka',          'Saki Naka',   'Mumbai', 'Maharashtra', '400072', '1800 266 1880',  'contact@bosch.in',      19.1025,  72.8851, NULL),
  ('HP',        'HP Service Centre – Lower Parel',   'Kamala Mills Compound, Lower Parel',     'Lower Parel', 'Mumbai', 'Maharashtra', '400013', '1800 108 4747',  'hp.support@hp.com',     18.9972,  72.8310, NULL),
  ('Dell',      'Dell Exclusive Store & Service',    'Phoenix Marketcity, Kurla West',         'Kurla',       'Mumbai', 'Maharashtra', '400070', '1800 425 4051',  'dell.support@dell.com', 19.0862,  72.8793, NULL),
  ('OnePlus',   'OnePlus Service Centre – Andheri',  'Infinity Mall, Andheri West',            'Andheri',     'Mumbai', 'Maharashtra', '400053', '1800 102 8411',  'support@oneplus.com',   19.1362,  72.8296, NULL),
  ('Xiaomi',    'Mi Service Centre – Dharavi',       '90 Feet Road, Dharavi',                  'Dharavi',     'Mumbai', 'Maharashtra', '400017', '1800 103 6286',  'support@mi.com',        19.0422,  72.8553, NULL),
  ('Lenovo',    'Lenovo Authorised Service – BKC',   'G-Block, Bandra Kurla Complex',          'BKC',         'Mumbai', 'Maharashtra', '400051', '1800 3000 9990', 'lenovo@support.com',    19.0596,  72.8650, NULL)
) AS v(brand, name, address, area, city, state, pincode, phone, email, latitude, longitude, map_url)
WHERE NOT EXISTS (
  SELECT 1 FROM public.service_centers sc WHERE sc.name = v.name
);
