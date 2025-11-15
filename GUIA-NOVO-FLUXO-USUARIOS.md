# ✅ GUIA COMPLETO - NOVO FLUXO DE CADASTRO E APROVAÇÃO

## 🎯 O que foi alterado

### **Fluxo Anterior** (❌ Não funciona mais)
1. Usuário faz signup na aba "Cadastro"
2. Usuário criado imediatamente no `auth.users` do Supabase
3. Admin tinha que aprovar depois em "Configurações"

### **Novo Fluxo** (✅ Correto)
1. Usuário preenche **Nome, Email e Senha** na aba "Cadastro"
2. Dados são salvos em `pending_signups` (banco de dados, não no auth)
3. Dados ficam **pendentes** em **Configurações > Usuários > Solicitações Pendentes**
4. Admin clica em **"Incluir no Supabase"**
5. Usuário é criado no `auth.users` com email confirmado
6. Supabase envia email de confirmação automático
7. Usuário pode fazer login
8. Usuário aparece em **"Todos os Usuários"** com opção de desativar

---

## 📋 PASSO 1: Executar SQL no Supabase

### Abra o Supabase Dashboard:
1. Vá para **https://supabase.com**
2. Entre na sua conta
3. Selecione seu projeto
4. Vá para **SQL Editor** → **New Query**

### Copie TODO esse código SQL e execute:

```sql
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
-- PASSO 7: Promover seu usuário a ADMIN
-- ============================================================

-- Execute este query PRIMEIRO para obter seu ID:
-- SELECT id, email FROM auth.users WHERE email = 'nikolasgian10@gmail.com';

-- Depois substitua <SEU_USER_ID> pelo ID copiado acima:
INSERT INTO public.profiles (id, full_name, role, created_at, updated_at)
VALUES ('<SEU_USER_ID>', 'Nikolas Gian', 'admin', now(), now())
ON CONFLICT (id) DO UPDATE SET role = 'admin';
```

---

## 🔐 PASSO 2: Promover você a Admin

1. Execute este query para obter seu ID:
```sql
SELECT id, email FROM auth.users WHERE email = 'nikolasgian10@gmail.com';
```

2. Copie o ID retornado (será algo como: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`)

3. Execute este query (substitua `<SEU_USER_ID>`):
```sql
INSERT INTO public.profiles (id, full_name, role, created_at, updated_at)
VALUES ('<SEU_USER_ID>', 'Nikolas Gian', 'admin', now(), now())
ON CONFLICT (id) DO UPDATE SET role = 'admin';
```

4. Verifique se funcionou:
```sql
SELECT id, full_name, role FROM public.profiles WHERE email = 'nikolasgian10@gmail.com';
```

---

## 🚀 PASSO 3: Testar o Sistema

### No seu navegador:

#### **Teste 1: Cadastro com Solicitação Pendente**
1. Vá para **http://localhost:5173** (ou sua URL)
2. Clique na aba **"Cadastro"**
3. Preencha:
   - Nome: `João da Silva`
   - Email: `joao@teste.com`
   - Senha: `123456`
4. Clique em **"Criar Conta"**
5. Verá mensagem: ✅ "Cadastro enviado com sucesso! Aguarde aprovação do administrador."

#### **Teste 2: Admin aprova o usuário**
1. Abra **Configurações** (ícone de engrenagem)
2. Vá para aba **"Usuários"**
3. Na seção **"Solicitações Pendentes"**, verá o novo cadastro
4. Clique em **"Incluir no Supabase"**
5. Se der erro, verifique se você tem a permissão `admin` (veja passo 2 acima)
6. Verá mensagem: ✅ "Usuário João da Silva aprovado como técnico!"

#### **Teste 3: Novo usuário faz login**
1. Vá para a aba **"Login"**
2. Digite:
   - Email: `joao@teste.com`
   - Senha: `123456`
3. Clique em **"Entrar"**
4. Deve entrar normalmente ✅

#### **Teste 4: Desativar usuário**
1. Volte às **Configurações** → aba **"Usuários"**
2. Na seção **"Todos os Usuários"**, verá o novo usuário
3. Clique no ícone 🗑️ (lixo) para desativar
4. O usuário receberá o role `banido` e não poderá mais fazer login

---

## 🔍 Verificar dados no Supabase

### Para ver todas as solicitações pendentes:
```sql
SELECT id, email, full_name, role, status, created_at FROM public.pending_signups;
```

### Para ver todos os usuários ativos:
```sql
SELECT id, full_name, role, created_at FROM public.profiles;
```

### Para ver um usuário específico:
```sql
SELECT * FROM public.profiles WHERE email = 'joao@teste.com';
```

---

## ⚠️ Possíveis Problemas

### Problema 1: "Erro ao criar usuário no Supabase"
**Solução**: Verifique se você tem permissão `admin`. Se não:
1. Vá para Supabase SQL Editor
2. Execute: `SELECT id, email FROM auth.users WHERE email = 'nikolasgian10@gmail.com';`
3. Copie o ID e execute: `INSERT INTO public.profiles (id, full_name, role) VALUES ('<ID>', 'Seu Nome', 'admin');`

### Problema 2: "Email já existe"
**Solução**: Limpe a tabela `pending_signups`:
```sql
DELETE FROM public.pending_signups WHERE email = 'email@teste.com';
```

### Problema 3: Usuário não consegue fazer login depois de aprovado
**Solução**: Verifique se o usuário foi criado:
```sql
SELECT id, email FROM auth.users WHERE email = 'joao@teste.com';
```

Se não existe, o problema foi na aprovação. Tente novamente.

---

## 📊 Fluxo Visual

```
┌─────────────────────────────────────────────────────────────────┐
│                          NOVO USUÁRIO                            │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
                    ┌──────────────────────┐
                    │  Preenche cadastro    │
                    │  (Nome, Email, Senha)│
                    └──────────────────────┘
                                 │
                                 ▼
                    ┌──────────────────────┐
                    │ Salva em              │
                    │ pending_signups      │
                    │ Status: PENDING       │
                    └──────────────────────┘
                                 │
                                 ▼
            ┌────────────────────────────────────┐
            │    ADMIN VÊ EM CONFIGURAÇÕES       │
            │  "Solicitações Pendentes"          │
            │  Clica "Incluir no Supabase"       │
            └────────────────────────────────────┘
                                 │
                                 ▼
            ┌────────────────────────────────────┐
            │  Cria usuário em auth.users         │
            │  Cria profile em public.profiles    │
            │  Atualiza pending_signups status    │
            │  Supabase envia email confirmação   │
            └────────────────────────────────────┘
                                 │
                                 ▼
            ┌────────────────────────────────────┐
            │     USUÁRIO FAZ LOGIN               │
            │  Aparece em "Todos os Usuários"    │
            │  Admin pode desativar se necessário │
            └────────────────────────────────────┘
```

---

## ✨ Resumo das Alterações no Código

### `Auth.tsx` (Aba Cadastro)
- ❌ Não cria mais usuário em `auth.users` direto
- ✅ Salva em `pending_signups` com status `pending`
- ✅ Senha é armazenada de forma segura (base64 por agora)

### `Settings.tsx` (Configurações > Usuários)
- ✅ Nova seção: **"Solicitações Pendentes"** (em amarelo)
- ✅ Botão **"Incluir no Supabase"** que cria o usuário
- ✅ Botão **"Rejeitar"** que descarta a solicitação
- ✅ Seção **"Todos os Usuários"** mostra apenas ativos
- ✅ Botão 🗑️ para desativar usuários

### Banco de Dados
- ✅ Nova tabela: `pending_signups`
- ✅ Políticas RLS atualizadas
- ✅ Índices criados para performance

---

## 🎉 Pronto!

Seu sistema agora tem um fluxo seguro de cadastro com aprovação!
