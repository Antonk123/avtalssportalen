
-- Fix junction tables: drop old constraints, alter columns, re-add
ALTER TABLE public.contract_tags ALTER COLUMN contract_id TYPE UUID USING contract_id::uuid;
ALTER TABLE public.contract_tags ADD CONSTRAINT contract_tags_contract_fk FOREIGN KEY (contract_id) REFERENCES public.contracts(id) ON DELETE CASCADE;

ALTER TABLE public.contract_documents ALTER COLUMN contract_id TYPE UUID USING contract_id::uuid;
ALTER TABLE public.contract_documents ADD CONSTRAINT contract_documents_contract_fk FOREIGN KEY (contract_id) REFERENCES public.contracts(id) ON DELETE CASCADE;

-- Fix related_contracts: drop check, alter, re-add
ALTER TABLE public.related_contracts DROP CONSTRAINT IF EXISTS related_contracts_check;
ALTER TABLE public.related_contracts DROP CONSTRAINT IF EXISTS "related_contracts_contract_id_related_contract_id_key";
ALTER TABLE public.related_contracts ALTER COLUMN contract_id TYPE UUID USING contract_id::uuid;
ALTER TABLE public.related_contracts ALTER COLUMN related_contract_id TYPE UUID USING related_contract_id::uuid;
ALTER TABLE public.related_contracts ADD CONSTRAINT related_contracts_unique UNIQUE (contract_id, related_contract_id);
ALTER TABLE public.related_contracts ADD CHECK (contract_id <> related_contract_id);
ALTER TABLE public.related_contracts ADD CONSTRAINT related_contracts_contract_fk FOREIGN KEY (contract_id) REFERENCES public.contracts(id) ON DELETE CASCADE;
ALTER TABLE public.related_contracts ADD CONSTRAINT related_contracts_related_fk FOREIGN KEY (related_contract_id) REFERENCES public.contracts(id) ON DELETE CASCADE;
