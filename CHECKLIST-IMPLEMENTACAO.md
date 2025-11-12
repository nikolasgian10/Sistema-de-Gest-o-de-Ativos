# 📋 Checklist de Implementação - Sistema GAC

## ✅ O QUE JÁ ESTÁ PRONTO

### Frontend
- ✅ Interface React completa com todas as telas
- ✅ Autenticação de usuários
- ✅ CRUD de Ativos/Equipamentos
- ✅ CRUD de Ordens de Serviço
- ✅ Planejamento Sistemático de Manutenção
- ✅ Modo Técnico Mobile
- ✅ Inventário Rápido
- ✅ Gestão de Peças
- ✅ Relatórios e Dashboard
- ✅ Sistema de checklists
- ✅ QR Code Scanner (com fallback para localStorage)

### Banco de Dados (Estrutura)
- ✅ Migrações SQL criadas
- ✅ Tabelas definidas:
  - `profiles` (perfis de usuário)
  - `assets` (equipamentos)
  - `work_orders` (ordens de serviço)
  - `asset_history` (histórico)
  - `maintenance_schedule` (agendamento)
  - `parts_inventory` (peças)
  - `user_roles` (roles)
  - `notifications` (notificações)
  - `asset_checklists` (checklists)
  - `programacao_manutencao` (programação)
- ✅ RLS (Row Level Security) configurado
- ✅ Triggers e funções SQL criadas

---

## ❌ O QUE FALTA PARA SER TOTALMENTE FUNCIONAL

### 🔴 1. CONFIGURAÇÃO DO SUPABASE (CRÍTICO)

#### 1.1 Criar Projeto no Supabase
- [ ] Criar conta em https://supabase.com
- [ ] Criar novo projeto
- [ ] Anotar `Project URL` e `anon/public key`

#### 1.2 Configurar Variáveis de Ambiente
Criar arquivo `.env` na raiz do projeto:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua-chave-anon-key-aqui
```

**⚠️ IMPORTANTE:** 
- O arquivo `.env` não deve ser commitado no Git (já deve estar no `.gitignore`)
- Use `.env.example` como template (criar se não existir)

#### 1.3 Executar Migrações no Supabase
**Opção A - Via Supabase Studio (Recomendado para iniciantes):**
1. Acesse https://app.supabase.com → Seu Projeto → SQL Editor
2. Execute as migrações na ordem:
   - `20251027171255_1bbd555f-e04e-4825-8bc6-4377eed76d18.sql`
   - `20251027220740_123553a6-24bb-473f-a46c-3e1d4f429403.sql`
   - `20250101000000_create_asset_checklists.sql`
   - `20250101000001_create_programacao_manutencao.sql`

**Opção B - Via Supabase CLI:**
```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login

# Linkar projeto
supabase link --project-ref seu-project-ref

# Aplicar migrações
supabase db push
```

#### 1.4 Configurar Storage (para fotos)
- [ ] Criar bucket `photos` no Supabase Storage
- [ ] Configurar políticas RLS para o bucket
- [ ] Permitir upload para usuários autenticados

**SQL para criar bucket:**
```sql
-- Criar bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', true);

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

---

### 🟡 2. CONFIGURAÇÃO DE AUTENTICAÇÃO

#### 2.1 Configurar Email Auth no Supabase
- [ ] Habilitar "Email" em Authentication → Providers
- [ ] Configurar SMTP (opcional, para emails de confirmação)
- [ ] Ou usar emails mágicos (magic links)

#### 2.2 Criar Primeiro Usuário Admin
Após criar o primeiro usuário via interface:

```sql
-- Substituir 'USER_ID_AQUI' pelo ID do usuário criado
INSERT INTO public.user_roles (user_id, role)
VALUES ('USER_ID_AQUI', 'admin')
ON CONFLICT DO NOTHING;
```

**Como pegar o USER_ID:**
1. Faça login no sistema
2. Abra o console do navegador (F12)
3. Execute: `(await supabase.auth.getUser()).data.user.id`
4. Copie o ID e use no SQL acima

---

### 🟡 3. FUNCIONALIDADES BACKEND PENDENTES

#### 3.1 Sistema de Notificações
- [ ] Criar Edge Function ou Trigger para notificações automáticas
- [ ] Notificar quando OS está próxima do vencimento
- [ ] Notificar quando peça está abaixo do estoque mínimo

**Exemplo de Trigger para notificações:**
```sql
-- Trigger para notificar quando OS é criada
CREATE OR REPLACE FUNCTION notify_new_work_order()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type, link)
  SELECT 
    NEW.assigned_to,
    'Nova Ordem de Serviço',
    'Nova OS: ' || NEW.order_number,
    'work_order',
    '/work-orders/' || NEW.id
  WHERE NEW.assigned_to IS NOT NULL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_work_order_created
AFTER INSERT ON public.work_orders
FOR EACH ROW EXECUTE FUNCTION notify_new_work_order();
```

#### 3.2 Geração Automática de OS
- [ ] Criar função/cron job para gerar OSs baseado em `maintenance_schedule`
- [ ] Executar diariamente para criar OSs futuras

**Exemplo de Função:**
```sql
CREATE OR REPLACE FUNCTION generate_maintenance_work_orders()
RETURNS void AS $$
BEGIN
  INSERT INTO public.work_orders (
    order_number,
    asset_id,
    order_type,
    status,
    priority,
    scheduled_date,
    description
  )
  SELECT
    'OS-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(ROW_NUMBER() OVER ()::TEXT, 5, '0'),
    asset_id,
    'preventiva',
    'pendente',
    CASE 
      WHEN schedule_type = 'semestral' THEN 'alta'
      ELSE 'normal'
    END,
    next_maintenance,
    'Manutenção ' || schedule_type || ' - Gerada automaticamente'
  FROM public.maintenance_schedule
  WHERE next_maintenance BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
    AND NOT EXISTS (
      SELECT 1 FROM public.work_orders
      WHERE asset_id = maintenance_schedule.asset_id
        AND scheduled_date = maintenance_schedule.next_maintenance
        AND order_type = 'preventiva'
    );
END;
$$ LANGUAGE plpgsql;
```

#### 3.3 Atualização Automática de `next_maintenance`
- [ ] Criar trigger para atualizar `next_maintenance` após OS concluída

```sql
CREATE OR REPLACE FUNCTION update_next_maintenance()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'concluida' AND OLD.status != 'concluida' THEN
    UPDATE public.maintenance_schedule
    SET 
      last_maintenance = NEW.completed_date::DATE,
      next_maintenance = (NEW.completed_date::DATE + (frequency_months || ' months')::INTERVAL)::DATE
    WHERE asset_id = NEW.asset_id
      AND schedule_type IN ('mensal', 'semestral', 'anual');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_work_order_completed
AFTER UPDATE ON public.work_orders
FOR EACH ROW
WHEN (NEW.status = 'concluida' AND OLD.status != 'concluida')
EXECUTE FUNCTION update_next_maintenance();
```

---

### 🟡 4. CONFIGURAÇÃO DO SERVIDOR

#### 4.1 Servidor de Desenvolvimento (Já funciona)
- ✅ Vite configurado para rede local
- ✅ HTTPS com certificados auto-assinados
- ⚠️ Firewall precisa permitir porta 8080

#### 4.2 Servidor de Produção (Falta)
- [ ] Escolher plataforma de deploy:
  - **Opção 1:** Vercel/Netlify (mais fácil)
  - **Opção 2:** VPS próprio (mais controle)
  - **Opção 3:** Supabase Hosting (se disponível)

- [ ] Configurar build de produção:
```bash
npm run build
```

- [ ] Configurar variáveis de ambiente no servidor
- [ ] Configurar domínio customizado (opcional)
- [ ] Configurar SSL/HTTPS (certificado Let's Encrypt)

---

### 🟡 5. FUNCIONALIDADES OPCIONAIS (Melhorias)

#### 5.1 Integração com QR Code Real
- [ ] Implementar biblioteca de leitura de QR Code (ex: `html5-qrcode`)
- [ ] Processar QR codes escaneados na câmera

#### 5.2 Relatórios Avançados
- [ ] Exportar relatórios em PDF
- [ ] Gráficos de performance
- [ ] Análise de custos

#### 5.3 Backup Automático
- [ ] Configurar backup diário do banco Supabase
- [ ] Ou usar Supabase Backup automático (plano pago)

#### 5.4 Sistema de Logs
- [ ] Implementar logging de ações importantes
- [ ] Auditoria de mudanças

---

## 📝 CHECKLIST RÁPIDO PARA COMEÇAR

### Passo a Passo Mínimo:

1. **Criar projeto Supabase** (15 min)
   - [ ] Criar conta
   - [ ] Criar projeto
   - [ ] Copiar URL e chave

2. **Configurar .env** (2 min)
   - [ ] Criar arquivo `.env`
   - [ ] Adicionar variáveis

3. **Executar migrações** (10 min)
   - [ ] Abrir SQL Editor no Supabase
   - [ ] Executar 4 arquivos de migração na ordem

4. **Criar primeiro usuário** (5 min)
   - [ ] Registrar via interface
   - [ ] Tornar admin via SQL

5. **Testar sistema** (10 min)
   - [ ] Fazer login
   - [ ] Criar um ativo
   - [ ] Criar uma OS
   - [ ] Testar programação

**Tempo total estimado: ~45 minutos**

---

## 🚨 PROBLEMAS CONHECIDOS E SOLUÇÕES

### Problema: "Could not find table in schema cache"
**Solução:** 
- Executar migrações no Supabase
- Ou usar fallback localStorage (já implementado)

### Problema: Câmera não funciona
**Solução:**
- Usar HTTPS (certificados já configurados)
- Permitir permissões no navegador
- Verificar firewall

### Problema: Fotos não salvam
**Solução:**
- Criar bucket `photos` no Storage
- Configurar políticas RLS

---

## 📚 RECURSOS ÚTEIS

- [Documentação Supabase](https://supabase.com/docs)
- [Guia de RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Storage](https://supabase.com/docs/guides/storage)

---

## ✅ PRÓXIMOS PASSOS RECOMENDADOS

1. **Imediato:** Configurar Supabase e executar migrações
2. **Curto prazo:** Implementar notificações automáticas
3. **Médio prazo:** Deploy em produção
4. **Longo prazo:** Melhorias e otimizações

---

**Última atualização:** 2025-01-XX
**Status:** Sistema funcional com configuração mínima pendente

