
-- Replace permissive INSERT policy with one restricted to the trigger (service role)
DROP POLICY "System can insert audit_log" ON public.audit_log;

-- Only allow inserts via the security definer trigger function, not directly by users
CREATE POLICY "No direct inserts to audit_log"
  ON public.audit_log FOR INSERT TO authenticated
  WITH CHECK (false);
