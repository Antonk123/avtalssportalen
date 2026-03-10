
-- Tags table
CREATE TABLE public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#2563EB',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Contract-tags junction
CREATE TABLE public.contract_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id TEXT NOT NULL,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(contract_id, tag_id)
);

-- Related contracts junction
CREATE TABLE public.related_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id TEXT NOT NULL,
  related_contract_id TEXT NOT NULL,
  relation_type TEXT NOT NULL DEFAULT 'Relaterat',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(contract_id, related_contract_id),
  CHECK (contract_id <> related_contract_id)
);

-- Contract documents table (tracks uploaded files)
CREATE TABLE public.contract_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Storage bucket for contract documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('contract-documents', 'contract-documents', true, 20971520, ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']);

-- Disable RLS for now (mock data, no auth yet)
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.related_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_documents ENABLE ROW LEVEL SECURITY;

-- Public access policies (no auth yet)
CREATE POLICY "Allow all on tags" ON public.tags FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on contract_tags" ON public.contract_tags FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on related_contracts" ON public.related_contracts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on contract_documents" ON public.contract_documents FOR ALL USING (true) WITH CHECK (true);

-- Storage policies
CREATE POLICY "Allow public read on contract-documents" ON storage.objects FOR SELECT USING (bucket_id = 'contract-documents');
CREATE POLICY "Allow public insert on contract-documents" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'contract-documents');
CREATE POLICY "Allow public delete on contract-documents" ON storage.objects FOR DELETE USING (bucket_id = 'contract-documents');

-- Seed some tags
INSERT INTO public.tags (name, color) VALUES
  ('IT', '#2563EB'),
  ('Fastighet', '#059669'),
  ('Konsult', '#D97706'),
  ('Licens', '#7C3AED'),
  ('Säkerhet', '#DC2626'),
  ('Viktigt', '#E11D48');
