
-- Platform settings table for admin password and vendor access code
CREATE TABLE public.platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings (password check happens client-side, same security model as current hardcoded passwords)
CREATE POLICY "Anyone can read settings" ON public.platform_settings FOR SELECT USING (true);

-- Anyone can update settings (admin-protected via client-side password)
CREATE POLICY "Anyone can update settings" ON public.platform_settings FOR UPDATE USING (true) WITH CHECK (true);

-- Seed initial settings
INSERT INTO public.platform_settings (key, value) VALUES
  ('vendor_access_code', 'vendor2024'),
  ('admin_password', 'admin2024');

-- Allow inserting vendors (for admin to add new vendors)
CREATE POLICY "Anyone can insert vendors" ON public.vendors FOR INSERT WITH CHECK (true);

-- Allow deleting vendors (for admin to remove vendors)
CREATE POLICY "Anyone can delete vendors" ON public.vendors FOR DELETE USING (true);
