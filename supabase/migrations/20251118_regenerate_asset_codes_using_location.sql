-- Migration: regenerar asset_code para usar 'location' em vez de 'sector'
-- Esta versão evita colisões combinando o código base com um sufixo numérico
-- quando houver múltiplos ativos com o mesmo código base.

WITH computed AS (
  SELECT
    id,
    (CASE asset_type
      WHEN 'ar_condicionado' THEN 'AC'
      WHEN 'chiller' THEN 'CHI'
      WHEN 'split' THEN 'SPT'
      WHEN 'mecalor' THEN 'MEC'
      WHEN 'ar_maquina' THEN 'AMQ'
      ELSE 'OUT' END)
    || '-' || COALESCE(NULLIF(TRIM(bem_patrimonial),''), RIGHT(CAST(FLOOR(EXTRACT(EPOCH FROM created_at)) AS BIGINT)::text,6))
    || '-' || COALESCE(UPPER(NULLIF(REPLACE(sigla_local,' ','-'),'')),'NO-SIG')
    || '-' || COALESCE(UPPER(NULLIF(REPLACE(location,' ','-'),'')),'NO-LOCAL')
    || (CASE WHEN altura_option IS NULL OR altura_option = '' THEN '' ELSE '-'||UPPER(altura_option) END) AS base_code,
    created_at
  FROM public.assets
), numbered AS (
  SELECT
    id,
    base_code,
    ROW_NUMBER() OVER (PARTITION BY base_code ORDER BY created_at, id) AS rn
  FROM computed
)
UPDATE public.assets a
SET asset_code = CASE
  WHEN n.rn = 1 THEN n.base_code
  ELSE n.base_code || '-' || n.rn::text
END
FROM numbered n
WHERE a.id = n.id;

-- Observação: o resultado produz asset_code únicos. Recomendado executar em um ambiente
-- de staging e fazer backup da tabela `assets` antes de aplicar em produção.
