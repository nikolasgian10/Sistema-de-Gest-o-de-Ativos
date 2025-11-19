-- Migration: adicionar coluna last_maintenance à tabela assets e renomear bem_matrimonial → bem_patrimonial (se existir)

ALTER TABLE public.assets
ADD COLUMN IF NOT EXISTS last_maintenance DATE;

DO $do$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'assets' AND column_name = 'bem_matrimonial'
  ) THEN
    EXECUTE 'ALTER TABLE public.assets RENAME COLUMN bem_matrimonial TO bem_patrimonial';
  END IF;
END
$do$ LANGUAGE plpgsql;
