
-- Create contract_types table
CREATE TABLE public.contract_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contract_types ENABLE ROW LEVEL SECURITY;

-- Everyone can read
CREATE POLICY "Authenticated users can read contract_types"
  ON public.contract_types FOR SELECT
  TO authenticated USING (true);

-- Users and admins can manage
CREATE POLICY "Users and admins can manage contract_types"
  ON public.contract_types FOR ALL
  TO authenticated
  USING (has_role_level(auth.uid(), 'user'::app_role))
  WITH CHECK (has_role_level(auth.uid(), 'user'::app_role));

-- Seed default types
INSERT INTO public.contract_types (name, is_default) VALUES
  ('Serviceavtal', true),
  ('Licensavtal', true),
  ('Ramavtal', true),
  ('NDA', true),
  ('Övrigt', true);
