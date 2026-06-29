-- Migration 010: Add warranty_label and warranty_url columns to service_centers

ALTER TABLE public.service_centers
  ADD COLUMN IF NOT EXISTS area            TEXT,
  ADD COLUMN IF NOT EXISTS warranty_label  TEXT,
  ADD COLUMN IF NOT EXISTS warranty_url    TEXT;
