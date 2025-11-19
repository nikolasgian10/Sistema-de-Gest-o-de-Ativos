-- Migration: criar função + trigger para gerar `asset_code` automaticamente
-- Gera asset_code usando `location`, `bem_patrimonial`, `sigla_local` e `altura_option`.
-- Evita colisões usando um sufixo numérico quando necessário.

BEGIN;

CREATE OR REPLACE FUNCTION public.fn_generate_asset_code()
RETURNS trigger AS
$fn$
DECLARE
  prefix text;
  base_code text;
  candidate text;
  max_suffix int;
BEGIN
  -- Only handle insert/update
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  -- Always generate/overwrite the asset_code for consistency.

  prefix := CASE COALESCE(NEW.asset_type,'')
    WHEN 'ar_condicionado' THEN 'AC'
    WHEN 'chiller' THEN 'CHI'
    WHEN 'split' THEN 'SPT'
    WHEN 'mecalor' THEN 'MEC'
    WHEN 'ar_maquina' THEN 'AMQ'
    ELSE 'OUT' END;

  base_code := prefix
    || '-' || COALESCE(NULLIF(TRIM(NEW.bem_patrimonial),''), RIGHT(CAST(FLOOR(EXTRACT(EPOCH FROM COALESCE(NEW.created_at, now()))) AS BIGINT)::text,6))
    || '-' || COALESCE(UPPER(NULLIF(REPLACE(COALESCE(NEW.sigla_local,''),' ','-'),'')),'NO-SIG')
    || '-' || COALESCE(UPPER(NULLIF(REPLACE(COALESCE(NEW.location,''),' ','-'),'')),'NO-LOCAL')
    || (CASE WHEN NEW.altura_option IS NULL OR NEW.altura_option = '' THEN '' ELSE '-'||UPPER(NEW.altura_option) END);

  -- Prevent race conditions by taking an advisory xact lock (serializes code generation)
  PERFORM pg_advisory_xact_lock(1234567890);

  candidate := base_code;

  -- If candidate already exists for some other asset, compute numeric suffix
  IF EXISTS (SELECT 1 FROM public.assets a WHERE a.asset_code = candidate AND (TG_OP = 'INSERT' OR a.id <> NEW.id) LIMIT 1) THEN
    SELECT COALESCE(MAX( (regexp_replace(a.asset_code, '^.*-(\\d+)$','\\1'))::int ), 0)
    INTO max_suffix
    FROM public.assets a
    WHERE a.asset_code ~ (base_code || '-[0-9]+$');

    IF max_suffix IS NULL OR max_suffix = 0 THEN
      -- If there is an exact base_code but no numeric-suffixed rows, start at 1
      max_suffix := 1;
    ELSE
      max_suffix := max_suffix + 1;
    END IF;

    candidate := base_code || '-' || max_suffix::text;
  END IF;

  NEW.asset_code := candidate;
  RETURN NEW;
END;
$fn$ LANGUAGE plpgsql;

-- Create trigger (always run; function overwrites asset_code)
DROP TRIGGER IF EXISTS trg_generate_asset_code ON public.assets;
CREATE TRIGGER trg_generate_asset_code
BEFORE INSERT OR UPDATE ON public.assets
FOR EACH ROW
EXECUTE FUNCTION public.fn_generate_asset_code();

COMMIT;

-- Nota: this migration serializes asset_code generation using an advisory lock.
-- If you prefer higher parallelism, consider a different locking strategy.
