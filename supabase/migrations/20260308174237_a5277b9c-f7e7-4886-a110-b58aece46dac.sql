CREATE OR REPLACE FUNCTION public.log_contract_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _user_id uuid;
  _changed jsonb := '{}'::jsonb;
  _old jsonb := '{}'::jsonb;
  _new jsonb := '{}'::jsonb;
  _key text;
BEGIN
  _user_id := COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid);

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_log (contract_id, user_id, action, new_values)
    VALUES (NEW.id, _user_id, 'INSERT', to_jsonb(NEW));
    RETURN NEW;
  END IF;

  -- Skip DELETE logging to avoid FK conflicts during cascade deletes
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    FOR _key IN SELECT jsonb_object_keys(to_jsonb(NEW))
    LOOP
      IF to_jsonb(NEW) -> _key IS DISTINCT FROM to_jsonb(OLD) -> _key THEN
        _changed := _changed || jsonb_build_object(_key, to_jsonb(NEW) -> _key);
        _old := _old || jsonb_build_object(_key, to_jsonb(OLD) -> _key);
        _new := _new || jsonb_build_object(_key, to_jsonb(NEW) -> _key);
      END IF;
    END LOOP;

    IF _changed != '{}'::jsonb THEN
      INSERT INTO public.audit_log (contract_id, user_id, action, changed_fields, old_values, new_values)
      VALUES (NEW.id, _user_id, 'UPDATE', _changed, _old, _new);
    END IF;
    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$function$;