-- ============================================================
-- NOVO FLUXO DE CADASTRO E APROVAÇÃO DE USUÁRIOS
-- Execute este script NO SQL EDITOR DO SUPABASE
-- ============================================================

-- ============================================================
-- PASSO 1: Criar tabela para pendências de cadastro
-- ============================================================

CREATE TABLE IF NOT EXISTS public.pending_signups (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  full_name text NOT NULL,
  role text DEFAULT 'tecnico', -- 'tecnico' ou 'gestor'
  status text DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at timestamp with time zone
);

-- ============================================================
-- PASSO 2: Atualizar tabela 'profiles' (se não existir)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  role text, -- 'admin', 'gestor', 'tecnico', 'banido', ou NULL (pendente)
  avatar_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

-- ============================================================
-- PASSO 3: Adicionar índices para melhor performance
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_pending_signups_status ON public.pending_signups(status);
CREATE INDEX IF NOT EXISTS idx_pending_signups_email ON public.pending_signups(email);
CREATE INDEX IF NOT EXISTS idx_pending_signups_created_at ON public.pending_signups(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- ============================================================
-- PASSO 4: Habilitar RLS (Row Level Security)
-- ============================================================

ALTER TABLE public.pending_signups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PASSO 5: Criar políticas RLS para pending_signups
-- ============================================================

-- Admin pode ver todas as solicitações pendentes
DROP POLICY IF EXISTS "Admins podem ver todos os pending_signups" ON public.pending_signups;
CREATE POLICY "Admins podem ver todos os pending_signups"
  ON public.pending_signups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admin pode atualizar status de pendências
DROP POLICY IF EXISTS "Admins podem atualizar pending_signups" ON public.pending_signups;
CREATE POLICY "Admins podem atualizar pending_signups"
  ON public.pending_signups FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Qualquer pessoa pode inserir uma solicitação de cadastro
DROP POLICY IF EXISTS "Qualquer um pode criar pending_signup" ON public.pending_signups;
CREATE POLICY "Qualquer um pode criar pending_signup"
  ON public.pending_signups FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- PASSO 6: Políticas RLS para profiles (manter as existentes)
-- ============================================================

-- Usuários podem ver seu próprio profile
DROP POLICY IF EXISTS "Usuários podem ver seu próprio profile" ON public.profiles;
CREATE POLICY "Usuários podem ver seu próprio profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Admins podem ver todos os profiles
DROP POLICY IF EXISTS "Admins podem ver todos os profiles" ON public.profiles;
CREATE POLICY "Admins podem ver todos os profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins podem atualizar profiles
DROP POLICY IF EXISTS "Admins podem atualizar profiles" ON public.profiles;
CREATE POLICY "Admins podem atualizar profiles"
  ON public.profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Usuários podem atualizar seu próprio profile
DROP POLICY IF EXISTS "Usuários podem atualizar seu perfil" ON public.profiles;
CREATE POLICY "Usuários podem atualizar seu perfil"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- ============================================================
-- PASSO 7: Funções auxiliares (IMPORTANTE)
-- ============================================================

-- Função para confirmar que a senha foi criada no auth.users
-- Esta função será chamada via API depois que o usuário for criado
CREATE OR REPLACE FUNCTION public.confirm_user_signup(
  pending_id uuid,
  auth_user_id uuid
)
RETURNS void AS $$
BEGIN
  -- Atualizar o pending_signup para 'approved'
  UPDATE public.pending_signups
  SET 
    status = 'approved',
    updated_at = now()
  WHERE id = pending_id;

  -- Criar o profile do usuário
  INSERT INTO public.profiles (id, full_name, role, created_at, updated_at)
  SELECT auth_user_id, full_name, role, now(), now()
  FROM public.pending_signups
  WHERE id = pending_id
  ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- PASSO 8: Promover seu usuário a ADMIN (SUBSTITUA O EMAIL)
-- ============================================================

-- 1. Obtenha o ID do seu usuário:
-- SELECT id, email FROM auth.users WHERE email = 'nikolasgian10@gmail.com';

-- 2. Use o ID abaixo e substitua <SEU_USER_ID>:
INSERT INTO public.profiles (id, full_name, role, created_at, updated_at)
VALUES ('<SEU_USER_ID>', 'Nikolas Gian', 'admin', now(), now())
ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- ============================================================
-- ✅ PRONTO! Agora execute os comandos acima na ordem
-- ============================================================
