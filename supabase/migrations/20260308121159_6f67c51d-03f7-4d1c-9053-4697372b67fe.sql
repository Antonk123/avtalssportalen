
-- Create audit_log table
CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  action text NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
  changed_fields jsonb DEFAULT '{}'::jsonb,
  old_values jsonb DEFAULT '{}'::jsonb,
  new_values jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- RLS: all authenticated can read
CREATE POLICY "Authenticated users can read audit_log"
  ON public.audit_log FOR SELECT TO authenticated
  USING (true);

-- RLS: users and admins can insert (for trigger via security definer)
CREATE POLICY "System can insert audit_log"
  ON public.audit_log FOR INSERT TO authenticated
  WITH CHECK (true);

-- Create trigger function to log contract changes
CREATE OR REPLACE FUNCTION public.log_contract_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
  _changed jsonb := '{}'::jsonb;
  _old jsonb := '{}'::jsonb;
  _new jsonb := '{}'::jsonb;
  _key text;
BEGIN
  -- Get current user from auth context
  _user_id := COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid);

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_log (contract_id, user_id, action, new_values)
    VALUES (NEW.id, _user_id, 'INSERT', to_jsonb(NEW));
    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_log (contract_id, user_id, action, old_values)
    VALUES (OLD.id, _user_id, 'DELETE', to_jsonb(OLD));
    RETURN OLD;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    -- Build changed fields diff
    FOR _key IN SELECT jsonb_object_keys(to_jsonb(NEW))
    LOOP
      IF to_jsonb(NEW) -> _key IS DISTINCT FROM to_jsonb(OLD) -> _key THEN
        _changed := _changed || jsonb_build_object(_key, to_jsonb(NEW) -> _key);
        _old := _old || jsonb_build_object(_key, to_jsonb(OLD) -> _key);
        _new := _new || jsonb_build_object(_key, to_jsonb(NEW) -> _key);
      END IF;
    END LOOP;

    -- Only log if something actually changed
    IF _changed != '{}'::jsonb THEN
      INSERT INTO public.audit_log (contract_id, user_id, action, changed_fields, old_values, new_values)
      VALUES (NEW.id, _user_id, 'UPDATE', _changed, _old, _new);
    END IF;
    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$;

-- Attach trigger to contracts table
CREATE TRIGGER contracts_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.log_contract_changes();
