
-- Add delivery settings columns to vendors table
ALTER TABLE public.vendors
  ADD COLUMN IF NOT EXISTS delivery_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS pickup_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS custom_delivery_fee numeric NOT NULL DEFAULT 5;
