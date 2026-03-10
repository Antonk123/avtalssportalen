
ALTER TABLE public.audit_log DROP CONSTRAINT audit_log_contract_id_fkey;
ALTER TABLE public.audit_log ADD CONSTRAINT audit_log_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.contracts(id) ON DELETE CASCADE;
