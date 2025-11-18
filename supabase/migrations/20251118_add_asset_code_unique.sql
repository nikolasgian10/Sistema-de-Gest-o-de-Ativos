-- Migration: criar índice único em asset_code para garantir unicidade

-- Atenção: verifique se não existem códigos duplicados antes de aplicar esta migration.
CREATE UNIQUE INDEX IF NOT EXISTS idx_assets_asset_code_unique ON public.assets (asset_code);
