-- Migration: adicionar colunas sigla_local, bem_patrimonial, altura_option à tabela assets

ALTER TABLE public.assets
ADD COLUMN IF NOT EXISTS sigla_local TEXT;

ALTER TABLE public.assets
ADD COLUMN IF NOT EXISTS bem_patrimonial TEXT;

ALTER TABLE public.assets
ADD COLUMN IF NOT EXISTS altura_option TEXT;
