# 🚀 Guia Completo de Deploy - Supabase + Vercel

Este guia detalha passo a passo como fazer o deploy completo do sistema no Supabase (backend) e Vercel (frontend).

---

## 📋 ÍNDICE

1. [Configuração do Supabase](#1-configuração-do-supabase)
2. [Configuração Local](#2-configuração-local)
3. [Deploy no Vercel](#3-deploy-no-vercel)
4. [Configuração Final](#4-configuração-final)
5. [Testes e Validação](#5-testes-e-validação)
6. [Troubleshooting](#6-troubleshooting)

---

## 1️⃣ CONFIGURAÇÃO DO SUPABASE

### Passo 1.1: Criar Conta e Projeto

1. **Acesse o Supabase:**
   - Vá para: https://supabase.com
   - Clique em **"Start your project"** ou **"Sign Up"**

2. **Criar Conta:**
   - Escolha uma das opções:
     - **GitHub** (recomendado - mais rápido)
     - **Email** (crie conta com email e senha)
   - Complete o cadastro

3. **Criar Novo Projeto:**
   - No dashboard, clique em **"New Project"**
   - Preencha os dados:
     - **Name:** `climate-wise-dash` (ou outro nome de sua escolha)
     - **Database Password:** 
       - ⚠️ **IMPORTANTE:** Anote esta senha! Você precisará dela depois
       - Use uma senha forte (mínimo 12 caracteres, com letras, números e símbolos)
       - Exemplo: `MinhaSenh@Forte123!`
     - **Region:** Escolha a região mais próxima:
       - **South America (São Paulo)** - Recomendado para Brasil
       - **US East** - Se preferir
     - **Pricing Plan:** Escolha **Free** (plano gratuito é suficiente para começar)

4. **Aguardar Criação:**
   - O processo leva 2-3 minutos
   - Aguarde até aparecer a mensagem "Project is ready"

### Passo 1.2: Obter Credenciais da API

1. **No Dashboard do Supabase:**
   - No menu lateral esquerdo, clique em **"Settings"** (ícone de engrenagem)
   - Clique em **"API"**

2. **Copiar Credenciais:**
   - **Project URL:**
     - Localize o campo **"Project URL"**
     - Exemplo: `https://abcdefghijklmnop.supabase.co`
     - Clique no ícone de copiar ao lado
     - ⚠️ **Anote em um lugar seguro!**

   - **anon public key:**
     - Localize o campo **"anon public"** (ou **"anon public key"**)
     - É uma chave longa (começa com `eyJ...`)
     - Clique no ícone de copiar ao lado
     - ⚠️ **Anote em um lugar seguro!**

   - **service_role key:**
     - ⚠️ **NÃO copie esta chave!** Ela é secreta e não deve ser usada no frontend
     - Mantenha segura e nunca exponha no código do cliente

### Passo 1.3: Executar Migrações do Banco de Dados

As migrações criam todas as tabelas, relacionamentos e políticas de segurança necessárias.

1. **Abrir SQL Editor:**
   - No menu lateral, clique em **"SQL Editor"**
   - Clique em **"New query"**

2. **Executar Migração 1:**
   - Abra o arquivo: `supabase/migrations/20251027171255_1bbd555f-e04e-4825-8bc6-4377eed76d18.sql`
   - Copie **TODO** o conteúdo do arquivo (Ctrl+A, Ctrl+C)
   - Cole no SQL Editor do Supabase
   - Clique em **"Run"** (ou pressione Ctrl+Enter)
   - ✅ Aguarde a mensagem de sucesso: "Success. No rows returned"

3. **Executar Migração 2:**
   - Abra o arquivo: `supabase/migrations/20251027220740_123553a6-24bb-473f-a46c-3e1d4f429403.sql`
   - Repita o processo: copiar, colar, executar
   - ✅ Aguarde sucesso

4. **Executar Migração 3:**
   - Abra o arquivo: `supabase/migrations/20250101000000_create_asset_checklists.sql`
   - Repita o processo
   - ✅ Aguarde sucesso

5. **Executar Migração 4:**
   - Abra o arquivo: `supabase/migrations/20250101000001_create_programacao_manutencao.sql`
   - Repita o processo
   - ✅ Aguarde sucesso

6. **Verificar Tabelas Criadas:**
   - No menu lateral, clique em **"Table Editor"**
   - Você deve ver as seguintes tabelas:
     - ✅ `profiles`
     - ✅ `assets`
     - ✅ `work_orders`
     - ✅ `asset_history`
     - ✅ `maintenance_schedule`
     - ✅ `parts_inventory`
     - ✅ `user_roles`
     - ✅ `notifications`
     - ✅ `asset_checklists`
     - ✅ `programacao_manutencao`

### Passo 1.4: Configurar Storage para Fotos

1. **Criar Bucket:**
   - No menu lateral, clique em **"Storage"**
   - Clique em **"New bucket"**
   - Preencha:
     - **Name:** `photos`
     - **Public bucket:** ✅ **Marque esta opção** (permite acesso público às fotos)
   - Clique em **"Create bucket"**

2. **Configurar Políticas de Acesso:**
   - No menu lateral, clique em **"SQL Editor"**
   - Clique em **"New query"**
   - Cole e execute o seguinte SQL:

```sql
-- Política para permitir upload de fotos por usuários autenticados
CREATE POLICY "Authenticated users can upload photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'photos');

-- Política para permitir visualização pública de fotos
CREATE POLICY "Public can view photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'photos');

-- Política para permitir atualização de fotos por usuários autenticados
CREATE POLICY "Authenticated users can update photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'photos');

-- Política para permitir exclusão de fotos por usuários autenticados
CREATE POLICY "Authenticated users can delete photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'photos');
```

   - Clique em **"Run"**
   - ✅ Aguarde sucesso

### Passo 1.5: Configurar Autenticação

1. **Habilitar Email Auth:**
   - No menu lateral, clique em **"Authentication"**
   - Clique em **"Providers"**
   - Certifique-se de que **"Email"** está habilitado (deve estar por padrão)
   - Se não estiver, clique no toggle para habilitar

2. **Configurar Email (Opcional - para produção):**
   - Para desenvolvimento, o Supabase envia emails de confirmação automaticamente
   - Para produção, você pode configurar seu próprio SMTP:
     - Vá em **"Settings" → "Auth"**
     - Role até **"SMTP Settings"**
     - Configure com suas credenciais SMTP (Gmail, SendGrid, etc.)

---

## 2️⃣ CONFIGURAÇÃO LOCAL

### Passo 2.1: Instalar Dependências

1. **Abrir Terminal:**
   - Abra o terminal/PowerShell na pasta do projeto
   - Navegue até a pasta do projeto:
     ```powershell
     cd "climate-wise-dash-main (1)\climate-wise-dash-main"
     ```

2. **Instalar Dependências:**
   ```powershell
   npm install
   ```
   - Aguarde a instalação (pode levar alguns minutos)

### Passo 2.2: Configurar Variáveis de Ambiente

1. **Criar Arquivo .env:**
   - Na raiz do projeto, crie um arquivo chamado `.env`
   - ⚠️ **IMPORTANTE:** O arquivo `.env` já está no `.gitignore`, então não será commitado no Git

2. **Adicionar Variáveis:**
   - Abra o arquivo `.env` e adicione:
   ```env
   VITE_SUPABASE_URL=https://seu-projeto-id.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sua-chave-anon-key-aqui
   ```
   - ⚠️ **Substitua pelos valores reais:**
     - `https://seu-projeto-id.supabase.co` → Cole o **Project URL** que você copiou
     - `sua-chave-anon-key-aqui` → Cole o **anon public key** que você copiou

3. **Exemplo Real:**
   ```env
   VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.ExemploDeChaveLongaAqui
   ```

### Passo 2.3: Testar Localmente

1. **Iniciar Servidor de Desenvolvimento:**
   ```powershell
   npm run dev
   ```

2. **Acessar o Sistema:**
   - Abra o navegador em: `http://localhost:8080`
   - Você deve ver a tela de login

3. **Criar Primeiro Usuário:**
   - Clique em **"Sign Up"** ou **"Registrar"**
   - Preencha:
     - **Email:** Seu email (ex: `admin@empresa.com`)
     - **Senha:** Uma senha forte
   - Clique em **"Sign Up"**
   - ⚠️ **Anote o email usado!**

4. **Tornar Usuário Admin:**
   - No Supabase Dashboard, vá em **"SQL Editor"**
   - Execute o seguinte SQL (substitua o email):
   ```sql
   -- Substitua 'admin@empresa.com' pelo email que você usou
   -- Primeiro, atualizar o perfil
   UPDATE public.profiles
   SET role = 'admin'
   WHERE id IN (
     SELECT id FROM auth.users WHERE email = 'admin@empresa.com'
   );
   
   -- Depois, adicionar na tabela user_roles
   -- A constraint é UNIQUE(user_id, role), então usamos ON CONFLICT corretamente
   INSERT INTO public.user_roles (user_id, role)
   SELECT id, 'admin'::app_role
   FROM auth.users
   WHERE email = 'admin@empresa.com'
   ON CONFLICT (user_id, role) DO NOTHING;
   ```
   - ⚠️ **IMPORTANTE:** Substitua `'admin@empresa.com'` pelo email que você usou para criar a conta
   - Clique em **"Run"**

5. **Testar Login:**
   - Faça logout e login novamente
   - Você deve ter acesso completo ao sistema

6. **Testar Funcionalidades:**
   - ✅ Criar um ativo
   - ✅ Criar uma ordem de serviço
   - ✅ Testar o dashboard
   - ✅ Testar o modo técnico mobile

---

## 3️⃣ DEPLOY NO VERCEL

### Passo 3.1: Preparar o Código para Deploy

1. **Verificar Build:**
   - No terminal, execute:
   ```powershell
   npm run build
   ```
   - ✅ Se executar sem erros, está pronto para deploy
   - Se houver erros, corrija antes de continuar

2. **Criar Repositório Git (se ainda não tiver):**
   - Crie uma conta no GitHub (se não tiver): https://github.com
   - Crie um novo repositório:
     - Nome: `climate-wise-dash` (ou outro)
     - Público ou Privado (sua escolha)
   - No terminal, execute:
   ```powershell
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/seu-usuario/climate-wise-dash.git
   git push -u origin main
   ```
   - ⚠️ Substitua `seu-usuario/climate-wise-dash` pelo seu repositório

### Passo 3.2: Criar Conta no Vercel

1. **Acessar Vercel:**
   - Vá para: https://vercel.com
   - Clique em **"Sign Up"**

2. **Fazer Login:**
   - Escolha uma das opções:
     - **GitHub** (recomendado - mais fácil)
     - **GitLab**
     - **Bitbucket**
     - **Email**

3. **Autorizar Acesso:**
   - Se escolher GitHub, autorize o Vercel a acessar seus repositórios
   - Você pode escolher "All repositories" ou apenas o repositório específico

### Passo 3.3: Fazer Deploy do Projeto

1. **Importar Projeto:**
   - No dashboard do Vercel, clique em **"Add New..." → "Project"**
   - Você verá uma lista dos seus repositórios Git
   - Clique em **"Import"** ao lado do repositório `climate-wise-dash`

2. **Configurar Projeto:**
   - **Project Name:** `climate-wise-dash` (ou outro nome)
   - **Framework Preset:** Vercel detecta automaticamente como **Vite**
   - **Root Directory:** Deixe vazio (ou `./` se o projeto estiver em subpasta)
   - **Build Command:** `npm run build` (já preenchido)
   - **Output Directory:** `dist` (já preenchido)
   - **Install Command:** `npm install` (já preenchido)

3. **Configurar Variáveis de Ambiente:**
   - Role até a seção **"Environment Variables"**
   - Clique em **"Add"** para cada variável:
   
   **Variável 1:**
   - **Name:** `VITE_SUPABASE_URL`
   - **Value:** Cole o **Project URL** do Supabase (ex: `https://abcdefghijklmnop.supabase.co`)
   - **Environments:** Marque todas as opções:
     - ✅ Production
     - ✅ Preview
     - ✅ Development
   - Clique em **"Add"**
   
   **Variável 2:**
   - **Name:** `VITE_SUPABASE_PUBLISHABLE_KEY`
   - **Value:** Cole o **anon public key** do Supabase
   - **Environments:** Marque todas as opções:
     - ✅ Production
     - ✅ Preview
     - ✅ Development
   - Clique em **"Add"**

4. **Fazer Deploy:**
   - Clique em **"Deploy"**
   - Aguarde o processo (2-5 minutos)
   - Você verá o progresso em tempo real

5. **Aguardar Conclusão:**
   - Quando concluir, você verá:
     - ✅ **"Building"** → **"Deploying"** → **"Ready"**
   - Uma URL será gerada: `https://climate-wise-dash.vercel.app` (ou similar)

### Passo 3.4: Verificar Deploy

1. **Acessar URL:**
   - Clique na URL fornecida ou copie e cole no navegador
   - Você deve ver a tela de login do sistema

2. **Testar Funcionalidades:**
   - Faça login com o usuário admin criado anteriormente
   - Teste as principais funcionalidades:
     - ✅ Dashboard carrega
     - ✅ Criar ativo funciona
     - ✅ Criar OS funciona
     - ✅ Navegação entre páginas funciona

---

## 4️⃣ CONFIGURAÇÃO FINAL

### Passo 4.1: Configurar Domínio Customizado (Opcional)

1. **No Vercel Dashboard:**
   - Vá em **"Settings" → "Domains"**
   - Clique em **"Add Domain"**

2. **Adicionar Domínio:**
   - Digite seu domínio (ex: `sistema.empresa.com.br`)
   - Clique em **"Add"**

3. **Configurar DNS:**
   - O Vercel fornecerá instruções específicas
   - Geralmente você precisa adicionar um registro CNAME no seu provedor de DNS:
     - **Tipo:** CNAME
     - **Nome:** `sistema` (ou `@` para domínio raiz)
     - **Valor:** `cname.vercel-dns.com` (ou o valor fornecido pelo Vercel)

4. **Aguardar Propagação:**
   - Pode levar de alguns minutos a 24 horas
   - O Vercel mostrará quando estiver ativo

### Passo 4.2: Configurar URLs no Supabase (Importante)

1. **No Supabase Dashboard:**
   - Vá em **"Settings" → "Auth"**
   - Role até **"Site URL"**

2. **Configurar URLs:**
   - **Site URL:** Cole a URL do Vercel (ex: `https://climate-wise-dash.vercel.app`)
   - **Redirect URLs:** Adicione:
     - `https://climate-wise-dash.vercel.app/**`
     - `https://seu-dominio.com.br/**` (se tiver domínio customizado)
   - Clique em **"Save"**

### Passo 4.3: Configurar CORS (se necessário)

1. **No Supabase Dashboard:**
   - Vá em **"Settings" → "API"**
   - Role até **"CORS"**

2. **Adicionar URLs Permitidas:**
   - Adicione a URL do Vercel:
     - `https://climate-wise-dash.vercel.app`
   - Se tiver domínio customizado, adicione também
   - Clique em **"Save"**

---

## 5️⃣ TESTES E VALIDAÇÃO

### Checklist de Testes

Execute os seguintes testes para garantir que tudo está funcionando:

#### ✅ Testes Básicos:
- [ ] Acessar URL do Vercel
- [ ] Tela de login aparece corretamente
- [ ] Fazer login com usuário admin
- [ ] Dashboard carrega sem erros
- [ ] Navegação entre páginas funciona

#### ✅ Testes de Funcionalidades:
- [ ] Criar um novo ativo
- [ ] Editar um ativo existente
- [ ] Criar uma ordem de serviço
- [ ] Visualizar histórico de um ativo
- [ ] Criar um checklist
- [ ] Testar modo técnico mobile
- [ ] Fazer upload de foto (se configurado)

#### ✅ Testes de Segurança:
- [ ] Usuário não autenticado não acessa páginas protegidas
- [ ] Logout funciona corretamente
- [ ] Dados são salvos no Supabase

#### ✅ Testes de Performance:
- [ ] Páginas carregam em tempo razoável (< 3 segundos)
- [ ] Imagens carregam corretamente
- [ ] Sem erros no console do navegador (F12)

---

## 6️⃣ TROUBLESHOOTING

### Problema: "Invalid API key" no Vercel

**Solução:**
1. Verifique se as variáveis de ambiente estão configuradas corretamente no Vercel
2. Vá em **"Settings" → "Environment Variables"**
3. Verifique se `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` estão corretas
4. Faça um novo deploy após corrigir

### Problema: "Could not find table" no Vercel

**Solução:**
1. Verifique se todas as migrações foram executadas no Supabase
2. Vá em **"Table Editor"** no Supabase e confirme que todas as tabelas existem
3. Se faltar alguma, execute a migração correspondente

### Problema: Login não funciona no Vercel

**Solução:**
1. Verifique se a **Site URL** está configurada no Supabase
2. Vá em **"Settings" → "Auth" → "Site URL"**
3. Adicione a URL do Vercel
4. Adicione também nas **Redirect URLs**

### Problema: Fotos não carregam

**Solução:**
1. Verifique se o bucket `photos` foi criado no Supabase Storage
2. Verifique se as políticas de acesso foram configuradas
3. Verifique se o bucket está marcado como público

### Problema: Build falha no Vercel

**Solução:**
1. Verifique os logs de build no Vercel
2. Teste o build localmente: `npm run build`
3. Corrija os erros encontrados
4. Faça commit e push das correções

### Problema: Página em branco no Vercel

**Solução:**
1. Verifique o arquivo `vercel.json` (já está configurado)
2. Verifique se o `outputDirectory` está correto (`dist`)
3. Verifique os logs do Vercel para erros específicos

### Problema: Erro de CORS

**Solução:**
1. Configure as URLs permitidas no Supabase
2. Vá em **"Settings" → "API" → "CORS"**
3. Adicione a URL do Vercel

---

## 📞 SUPORTE E RECURSOS

### Documentação Oficial:
- **Supabase:** https://supabase.com/docs
- **Vercel:** https://vercel.com/docs

### Arquivos de Referência no Projeto:
- `CONFIGURACAO-RAPIDA.md` - Configuração básica
- `CHECKLIST-IMPLEMENTACAO.md` - Checklist completo
- `DEPLOY-PRODUCAO.md` - Informações sobre deploy

---

## ✅ RESUMO FINAL

Após seguir este guia, você terá:

1. ✅ **Supabase configurado** com todas as tabelas e políticas
2. ✅ **Sistema rodando localmente** para testes
3. ✅ **Sistema publicado no Vercel** e acessível publicamente
4. ✅ **Domínio configurado** (opcional)
5. ✅ **Sistema totalmente funcional** e pronto para uso

**Tempo total estimado:** 1-2 horas (primeira vez)

**Dificuldade:** ⭐⭐⭐ (Médio - mas seguindo o guia passo a passo fica fácil!)

---

**Última atualização:** Janeiro 2025
**Versão:** 1.0

