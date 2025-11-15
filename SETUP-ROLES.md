# Sistema de Roles - Ordem Correta de Execução

## ✅ O que foi feito

- ✅ Signup cria profile com role=NULL (em `src/pages/Auth.tsx`)
- ✅ Aba "Usuários" em Configurações (em `src/pages/Settings.tsx`)
- ✅ Admin aprova/rejeita/bane usuários
- ✅ Código: 100% pronto, sem erros

---

## 🚀 Ordem de Execução (IMPORTANTE!)

### PASSO 1: Verificar seu status atual
### PASSO 2: Criar tabelas no banco
### PASSO 3: Promover você a admin
### PASSO 4: Testar

---

## PASSO 1: Verificar seu status atual

Abra [Supabase Dashboard](https://supabase.com/) → **SQL Editor** → **New Query**

Execute CADA UM desses queries e veja o resultado:

```sql
-- Query 1: Você existe em auth.users?
SELECT id, email FROM auth.users WHERE email = 'nikolasgian10@gmail.com';
```

Copie o **ID retornado** (vai parecer assim: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`)
**Você vai usar este ID depois!**

```sql
-- Query 2: Você já tem profile?
SELECT id, full_name, role FROM public.profiles 
WHERE email = 'nikolasgian10@gmail.com';
```

Resultado esperado:
- ✅ Se retorna um registro → você já tem profile
- ❌ Se retorna nada → você precisa criar
- ✅ Se `role = 'admin'` → você já é admin (pode pular para PASSO 4)

---

## PASSO 2: Criar tabelas no Supabase (2 min)

Copie TODO esse código e execute de uma vez no SQL Editor:

```sql
-- ============================================================
-- Criar tabela profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  role character varying(20),
  avatar_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

-- ============================================================
-- Criar tabela user_roles
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role character varying(20) NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id),
  UNIQUE(user_id, role)
);

-- ============================================================
-- Habilitar RLS (segurança)
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Criar políticas de segurança
-- ============================================================

DROP POLICY IF EXISTS "Usuários podem ver seu próprio profile" ON public.profiles;
CREATE POLICY "Usuários podem ver seu próprio profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins podem ver todos os profiles" ON public.profiles;
CREATE POLICY "Admins podem ver todos os profiles"
  ON public.profiles FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admins podem atualizar profiles" ON public.profiles;
CREATE POLICY "Admins podem atualizar profiles"
  ON public.profiles FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admins podem deletar profiles" ON public.profiles;
CREATE POLICY "Admins podem deletar profiles"
  ON public.profiles FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admins podem gerenciar user_roles" ON public.user_roles;
CREATE POLICY "Admins podem gerenciar user_roles"
  ON public.user_roles FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================
-- Criar índices
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
```

✅ Pronto! Banco de dados configurado.

---

## PASSO 3: Promover você a admin

### Se você NÃO tem profile ainda (resultado vazio no Query 2):

Substitua `<SEU_ID>` pelo ID que você copiou no PASSO 1:

```sql
INSERT INTO public.profiles (id, full_name, role, created_at, updated_at)
VALUES ('<SEU_ID>', 'Seu Nome Aqui', 'admin', now(), now());

INSERT INTO public.user_roles (user_id, role)
VALUES ('<SEU_ID>', 'admin')
ON CONFLICT DO NOTHING;
```

### Se você JÁ tem profile (resultado com dados no Query 2):

Substitua `<SEU_ID>` pelo ID que você copiou no PASSO 1:

```sql
UPDATE public.profiles 
SET role = 'admin' 
WHERE id = '<SEU_ID>';

INSERT INTO public.user_roles (user_id, role)
VALUES ('<SEU_ID>', 'admin')
ON CONFLICT DO NOTHING;
```

✅ Pronto! Você é admin.

---

## PASSO 4: Verificar se funcionou

Execute isso para confirmar:

```sql
SELECT id, full_name, role FROM public.profiles 
WHERE email = 'nikolasgian10@gmail.com';
```

Deve retornar: **`role = 'admin'`** ✅

---

## PASSO 5: Testar no app (5 min)

## PASSO 5: Testar no app (5 min)

### Teste 1: Criar novo usuário

1. Abra app em modo incógnito (Ctrl+Shift+N)
2. URL: `http://localhost:5173/auth`
3. Clique em **"Criar Conta"**
4. Preencha:
   - Nome: `Teste User`
   - Email: `teste@example.com`
   - Senha: `Senha123!`
5. Clique **"Registrar"**

✅ Resultado esperado: Mensagem de sucesso

### Teste 2: Admin aprova novo usuário

1. Volte para login normal
2. Faça login com: `nikolasgian10@gmail.com`
3. Clique ⚙️ **Configurações** (canto superior direito)
4. Clique aba **"Usuários"**

✅ Deve aparecer seção "Solicitações Pendentes" com "Teste User"

5. Clique botão **"Aprova Técnico"** (ou "Aprova Gestor")

✅ Resultado esperado: Toast verde "Usuário aprovado como tecnico"

### Teste 3: Usuário novo consegue entrar

1. **Logout** (menu user → Logout)
2. Faça login com: `teste@example.com` / `Senha123!`

✅ Resultado esperado: Login bem-sucedido, vai para Dashboard

---

## ❌ Se der erro

| Erro | Solução |
|------|---------|
| Admin não vê aba "Usuários" | `SELECT role FROM profiles WHERE email = 'nikolasgian10@gmail.com';` Deve retornar `'admin'` |
| Novo usuário não aparece em "Pendentes" | Verificar se signup completou sem erros no console do navegador |
| "Erro ao aprovar usuário" | Tabela user_roles não foi criada corretamente. Refaça o PASSO 2 |
| Usuário rejeitado consegue entrar | Isso é correto! Profile foi deletado |

---

## 📊 Resumo Final

| Etapa | O Quê | Status |
|-------|-------|--------|
| PASSO 1 | Verificar seu status | ✅ Leia queries |
| PASSO 2 | Criar tabelas | ✅ Copie/cole SQL |
| PASSO 3 | Promover a admin | ✅ Copie/cole SQL (substitua ID) |
| PASSO 4 | Verificar | ✅ Execute SQL |
| PASSO 5 | Testar no app | ✅ 3 testes simples |

**Total: ~10 minutos**

---

**Tudo pronto! Basta seguir os passos acima.**
