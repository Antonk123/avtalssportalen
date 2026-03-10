
-- Replace permissive policies on data tables with role-based ones

-- CUSTOMERS
DROP POLICY IF EXISTS "Allow all on customers" ON public.customers;
CREATE POLICY "Authenticated users can read customers" ON public.customers
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users and admins can insert customers" ON public.customers
  FOR INSERT TO authenticated WITH CHECK (public.has_role_level(auth.uid(), 'user'));
CREATE POLICY "Users and admins can update customers" ON public.customers
  FOR UPDATE TO authenticated USING (public.has_role_level(auth.uid(), 'user'));
CREATE POLICY "Admins can delete customers" ON public.customers
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- CONTACTS
DROP POLICY IF EXISTS "Allow all on contacts" ON public.contacts;
CREATE POLICY "Authenticated users can read contacts" ON public.contacts
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users and admins can insert contacts" ON public.contacts
  FOR INSERT TO authenticated WITH CHECK (public.has_role_level(auth.uid(), 'user'));
CREATE POLICY "Users and admins can update contacts" ON public.contacts
  FOR UPDATE TO authenticated USING (public.has_role_level(auth.uid(), 'user'));
CREATE POLICY "Admins can delete contacts" ON public.contacts
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- CONTRACTS
DROP POLICY IF EXISTS "Allow all on contracts" ON public.contracts;
CREATE POLICY "Authenticated users can read contracts" ON public.contracts
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users and admins can insert contracts" ON public.contracts
  FOR INSERT TO authenticated WITH CHECK (public.has_role_level(auth.uid(), 'user'));
CREATE POLICY "Users and admins can update contracts" ON public.contracts
  FOR UPDATE TO authenticated USING (public.has_role_level(auth.uid(), 'user'));
CREATE POLICY "Admins can delete contracts" ON public.contracts
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- REMINDER_LOG
DROP POLICY IF EXISTS "Allow all on reminder_log" ON public.reminder_log;
CREATE POLICY "Authenticated users can read reminder_log" ON public.reminder_log
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users and admins can insert reminder_log" ON public.reminder_log
  FOR INSERT TO authenticated WITH CHECK (public.has_role_level(auth.uid(), 'user'));

-- SETTINGS
DROP POLICY IF EXISTS "Allow all on settings" ON public.settings;
CREATE POLICY "Authenticated users can read settings" ON public.settings
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage settings" ON public.settings
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- TAGS
DROP POLICY IF EXISTS "Allow all on tags" ON public.tags;
CREATE POLICY "Authenticated users can read tags" ON public.tags
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users and admins can manage tags" ON public.tags
  FOR ALL TO authenticated USING (public.has_role_level(auth.uid(), 'user'))
  WITH CHECK (public.has_role_level(auth.uid(), 'user'));

-- CONTRACT_TAGS
DROP POLICY IF EXISTS "Allow all on contract_tags" ON public.contract_tags;
CREATE POLICY "Authenticated users can read contract_tags" ON public.contract_tags
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users and admins can manage contract_tags" ON public.contract_tags
  FOR ALL TO authenticated USING (public.has_role_level(auth.uid(), 'user'))
  WITH CHECK (public.has_role_level(auth.uid(), 'user'));

-- CONTRACT_DOCUMENTS
DROP POLICY IF EXISTS "Allow all on contract_documents" ON public.contract_documents;
CREATE POLICY "Authenticated users can read contract_documents" ON public.contract_documents
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users and admins can manage contract_documents" ON public.contract_documents
  FOR ALL TO authenticated USING (public.has_role_level(auth.uid(), 'user'))
  WITH CHECK (public.has_role_level(auth.uid(), 'user'));

-- RELATED_CONTRACTS
DROP POLICY IF EXISTS "Allow all on related_contracts" ON public.related_contracts;
CREATE POLICY "Authenticated users can read related_contracts" ON public.related_contracts
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users and admins can manage related_contracts" ON public.related_contracts
  FOR ALL TO authenticated USING (public.has_role_level(auth.uid(), 'user'))
  WITH CHECK (public.has_role_level(auth.uid(), 'user'));

-- STORAGE: update to require authentication
DROP POLICY IF EXISTS "Allow public read on contract-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow public insert on contract-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow public delete on contract-documents" ON storage.objects;

CREATE POLICY "Authenticated read on contract-documents" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'contract-documents');
CREATE POLICY "Users can upload to contract-documents" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'contract-documents');
CREATE POLICY "Users can delete from contract-documents" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'contract-documents');
