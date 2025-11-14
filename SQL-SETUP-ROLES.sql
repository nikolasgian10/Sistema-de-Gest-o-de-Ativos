-- ============================================================
-- SQL SETUP: SISTEMA DE ROLES E APROVAÇÃO DE USUÁRIOS
-- Execute este script no SQL Editor do Supabase
-- ============================================================

-- 1. Verificar se a tabela 'profiles' existe (deve existir)
-- A tabela já deve estar criada. Se não estiver, crie com:
/*
CREATE TABLE public.profiles (
  id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  role text, -- NULL (pendente), 'admin', 'gestor', 'tecnico', 'banido'
  avatar_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);
*/

-- 2. Verificar se a tabela 'user_roles' existe
-- Se não existir, crie com:
/*
CREATE TABLE public.user_roles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL, -- 'admin', 'gestor', 'tecnico'
  created_at timestamp with time zone DEFAULT now()
);
*/

-- 3. Verificar se o enum 'app_role' existe
-- Se não existir no Supabase, você pode ignorar ou usar a abordagem text
-- Supabase geralmente não cria enums automaticamente via SQL editor

-- ============================================================
-- PASSO 1: Promover sua conta (nikolasgian10@gmail.com) a ADMIN
-- ============================================================

-- Obtenha o ID do usuário (execute este query primeiro e copie o ID)
SELECT id, email FROM auth.users WHERE email = 'nikolasgian10@gmail.com';

-- Substitua <SEU_USER_ID> pelo ID obtido acima
-- Opção A: Se o profile não existe
INSERT INTO public.profiles (id, full_name, role, created_at, updated_at)
VALUES ('<SEU_USER_ID>', 'Nikolas Gian', 'admin', now(), now())
ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- Opção B: Se o profile já existe, apenas atualize o role
UPDATE public.profiles SET role = 'admin' WHERE id = '<SEU_USER_ID>';

-- ============================================================
-- PASSO 2: Inserir na tabela user_roles (para compatibilidade)
-- ============================================================

INSERT INTO public.user_roles (user_id, role)
VALUES ('<SEU_USER_ID>', 'admin')
ON CONFLICT DO NOTHING;

-- ============================================================
-- PASSO 3: Configurar RLS (Row Level Security) nas tabelas
-- ============================================================

-- Enable RLS na tabela profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles:
-- 1. Todos podem ver seus próprios profiles
CREATE POLICY "Usuários podem ver seu próprio profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- 2. Admins podem ver todos os profiles
CREATE POLICY "Admins podem ver todos os profiles"
  ON public.profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 3. Admins podem atualizar profiles
CREATE POLICY "Admins podem atualizar profiles"
  ON public.profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 4. Admins podem deletar profiles
CREATE POLICY "Admins podem deletar profiles"
  ON public.profiles
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Enable RLS na tabela user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Políticas para user_roles:
CREATE POLICY "Admins podem gerenciar user_roles"
  ON public.user_roles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- PASSO 4: Criar função para verificar role
-- ============================================================

-- Função has_role (se não existir)
CREATE OR REPLACE FUNCTION public.has_role(_role text, _user_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _user_id AND role = _role
  )
$$ LANGUAGE SQL;

-- ============================================================
-- TESTE: Verificar dados
-- ============================================================

-- Verificar profiles
SELECT id, full_name, role, created_at FROM public.profiles ORDER BY created_at DESC;

-- Verificar user_roles
SELECT user_id, role, created_at FROM public.user_roles ORDER BY created_at DESC;

-- Verificar seu usuário específico
SELECT id, email, created_at FROM auth.users WHERE email = 'nikolasgian10@gmail.com';

-- ============================================================
-- NOTAS IMPORTANTES:
-- ============================================================
-- 1. Sempre substitua <SEU_USER_ID> pelo ID real obtido do SELECT anterior
-- 2. As RLS policies garantem que:
--    - Cada usuário vê apenas seu próprio profile
--    - Admins veem e editam todos os profiles
-- 3. O fluxo de cadastro é:
--    - Usuário faz signup em /auth → Auth.tsx cria profile com role = NULL
--    - Admin vê em Configurações > Usuários → Solicitações Pendentes
--    - Admin clica em "Aprova Técnico" ou "Aprova Gestor"
--    - Sistema atualiza profile.role = 'tecnico' ou 'gestor'
-- 4. Para banir: role = 'banido' (bloqueia acesso)
-- 5. Para rejeitar: DELETE do profile (remove completamente)

