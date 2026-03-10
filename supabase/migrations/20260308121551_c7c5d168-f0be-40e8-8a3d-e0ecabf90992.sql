
-- 1. Contract templates table
CREATE TABLE public.contract_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  contract_type text NOT NULL DEFAULT 'Övrigt',
  binding_months integer NOT NULL DEFAULT 12,
  notice_months integer NOT NULL DEFAULT 3,
  auto_renew boolean NOT NULL DEFAULT false,
  reminder_days integer NOT NULL DEFAULT 30,
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL
);

ALTER TABLE public.contract_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read templates"
  ON public.contract_templates FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users and admins can manage templates"
  ON public.contract_templates FOR ALL TO authenticated
  USING (has_role_level(auth.uid(), 'user'::app_role))
  WITH CHECK (has_role_level(auth.uid(), 'user'::app_role));

-- 2. Contract comments table
CREATE TABLE public.contract_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contract_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read comments"
  ON public.contract_comments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users and admins can insert comments"
  ON public.contract_comments FOR INSERT TO authenticated
  WITH CHECK (has_role_level(auth.uid(), 'user'::app_role) AND user_id = auth.uid());

CREATE POLICY "Users can delete own comments"
  ON public.contract_comments FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- 3. Add version column to contract_documents
ALTER TABLE public.contract_documents ADD COLUMN version integer NOT NULL DEFAULT 1;
ALTER TABLE public.contract_documents ADD COLUMN original_name text;
