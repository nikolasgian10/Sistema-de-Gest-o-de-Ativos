# ⚡ Configuração Rápida - Sistema GAC

## 🚀 Setup em 5 Passos (45 minutos)

### 1️⃣ Criar Projeto Supabase (15 min)

1. Acesse https://supabase.com
2. Crie uma conta (grátis)
3. Clique em "New Project"
4. Preencha:
   - **Name:** `gac-sistema` (ou outro nome)
   - **Database Password:** Anote esta senha!
   - **Region:** Escolha a mais próxima (ex: South America)
5. Aguarde a criação (2-3 minutos)

### 2️⃣ Configurar Variáveis de Ambiente (2 min)

1. No Supabase Dashboard, vá em **Settings → API**
2. Copie:
   - **Project URL** (ex: `https://abcdefghijklmnop.supabase.co`)
   - **anon public key** (chave longa)

3. Na raiz do projeto, crie arquivo `.env`:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua-chave-anon-key-aqui
```

**⚠️ IMPORTANTE:** Substitua pelos valores reais copiados do Supabase!

### 3️⃣ Executar Migrações (10 min)

1. No Supabase Dashboard, vá em **SQL Editor**
2. Execute os arquivos SQL nesta ordem:

**Arquivo 1:** `supabase/migrations/20251027171255_1bbd555f-e04e-4825-8bc6-4377eed76d18.sql`
- Copie todo o conteúdo
- Cole no SQL Editor
- Clique em **Run**

**Arquivo 2:** `supabase/migrations/20251027220740_123553a6-24bb-473f-a46c-3e1d4f429403.sql`
- Repita o processo

**Arquivo 3:** `supabase/migrations/20250101000000_create_asset_checklists.sql`
- Repita o processo

**Arquivo 4:** `supabase/migrations/20250101000001_create_programacao_manutencao.sql`
- Repita o processo

**✅ Verificação:** Vá em **Table Editor** e confirme que as tabelas foram criadas:
- `profiles`
- `assets`
- `work_orders`
- `asset_history`
- `maintenance_schedule`
- `parts_inventory`
- `user_roles`
- `notifications`
- `asset_checklists`
- `programacao_manutencao`

### 4️⃣ Configurar Storage para Fotos (5 min)

1. No Supabase Dashboard, vá em **Storage**
2. Clique em **New bucket**
3. Configure:
   - **Name:** `photos`
   - **Public bucket:** ✅ Marque como público
4. Clique em **Create bucket**

5. Vá em **SQL Editor** e execute:

```sql
-- Política de upload
CREATE POLICY "Authenticated users can upload photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'photos');

-- Política de leitura
CREATE POLICY "Public can view photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'photos');
```

### 5️⃣ Criar Primeiro Usuário Admin (5 min)

1. Inicie o servidor:
```bash
npm run dev
```

2. Acesse http://localhost:8080
3. Clique em **Sign Up** (Registrar)
4. Crie uma conta com email e senha
5. **Anote o email usado!**

6. No Supabase Dashboard, vá em **SQL Editor** e execute:

```sql
-- Substitua 'seu-email@exemplo.com' pelo email que você usou
-- Primeiro, atualizar o perfil
UPDATE public.profiles
SET role = 'admin'
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'seu-email@exemplo.com'
);

-- Depois, adicionar na tabela user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'seu-email@exemplo.com'
ON CONFLICT (user_id, role) DO NOTHING;
```

**✅ Pronto!** Agora você tem acesso admin ao sistema.

---

## 🧪 Testar o Sistema

1. **Faça login** com o usuário criado
2. **Crie um ativo:**
   - Vá em **Ativos** → **Novo Ativo**
   - Preencha os dados
   - Salve

3. **Crie uma OS:**
   - Vá em **Ordens de Serviço** → **Nova OS**
   - Selecione o ativo criado
   - Salve

4. **Teste o Planejamento:**
   - Vá em **Planejamento**
   - Clique em **Criar Novo Plano**
   - Configure as semanas

---

## ❌ Problemas Comuns

### Erro: "Invalid API key"
**Solução:** Verifique se as variáveis no `.env` estão corretas

### Erro: "Could not find table"
**Solução:** Execute as migrações SQL no Supabase

### Câmera não funciona
**Solução:** 
- Use HTTPS: `npm run dev:https`
- Permita permissões no navegador

### Fotos não salvam
**Solução:** Crie o bucket `photos` no Storage (passo 4)

---

## 📞 Próximos Passos

Após a configuração básica, veja `CHECKLIST-IMPLEMENTACAO.md` para:
- Notificações automáticas
- Geração automática de OSs
- Deploy em produção
- Melhorias opcionais

---

**Tempo total estimado:** 45 minutos
**Dificuldade:** ⭐⭐ (Fácil)

