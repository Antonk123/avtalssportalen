-- Create departments table
CREATE TABLE public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT DEFAULT '',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read departments"
  ON public.departments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage departments"
  ON public.departments FOR ALL
  TO authenticated
  USING (true);

-- Seed default departments
INSERT INTO public.departments (name, description, is_default) VALUES
  ('IT', 'IT-avdelningen', true),
  ('Ekonomi', 'Ekonomiavdelningen', true),
  ('Marknad', 'Marknadsavdelningen', true),
  ('HR', 'HR-avdelningen', true),
  ('Försäljning', 'Försäljningsavdelningen', true),
  ('Fastighet', 'Fastighetsavdelningen', true);

-- Add department_id to contracts table
ALTER TABLE public.contracts
  ADD COLUMN department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL;

-- Create index for faster filtering
CREATE INDEX idx_contracts_department_id ON public.contracts(department_id);
