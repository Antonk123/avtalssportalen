
-- Contract approvals table
CREATE TABLE public.contract_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  decided_by UUID,
  decided_at TIMESTAMPTZ,
  comment TEXT DEFAULT '',
  UNIQUE(contract_id, status)
);

-- Enable RLS
ALTER TABLE public.contract_approvals ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read approvals
CREATE POLICY "Authenticated users can read approvals"
  ON public.contract_approvals FOR SELECT TO authenticated
  USING (true);

-- Users with user/admin role can request approval
CREATE POLICY "Users can request approval"
  ON public.contract_approvals FOR INSERT TO authenticated
  WITH CHECK (public.has_role_level(auth.uid(), 'user'));

-- Only admins can approve/reject
CREATE POLICY "Admins can update approvals"
  ON public.contract_approvals FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.contract_approvals;
