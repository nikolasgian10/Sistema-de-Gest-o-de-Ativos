# Sistema de Gestão de Ativos (GAC) — Apresentação

Breve descrição
----------------

O Sistema GAC é uma aplicação web para gestão de ativos (equipamentos), ordens de serviço e programação de manutenção. Ele oferece cadastro e edição de ativos, geração de códigos automáticos, checklists, escaneamento por QR Code, inventário, relatórios e painéis de performance. Foi construído com React + TypeScript no frontend e Postgres/Supabase no backend.

Funcionalidades principais
-------------------------

- Cadastro, edição e exclusão de ativos
- Geração automática e canônica de `asset_code` (baseada em tipo, bem patrimonial, sigla_local, location e altura)
- Checklists por ativo e histórico de manutenções
- Ordens de serviço (criação manual e possibilidade de geração automática por agendamento)
- Inventário e relatórios (CSV export/import)
- Integração com Supabase: autenticação, storage (fotos) e RLS

Métricas (Resumo para acompanhamento)
------------------------------------

As métricas abaixo incluem metas imediatas (curto prazo) e metas operacionais (médio/longo prazo). Para cada métrica há uma nota sobre como medir e ações recomendadas.

### Curto Prazo (0–7 dias)

- Save Success Rate
  - Objetivo imediato: ≥ 98% (staging). Longo prazo: ≥ 99.9%.
  - Como medir: contar requests de create/update bem-sucedidos vs total (logs/APM ou tabela `api_audit`).
  - SQL exemplo (se existir `api_audit`):
    ```sql
    SELECT 100.0 * SUM(CASE WHEN success THEN 1 ELSE 0 END)::float / COUNT(*)
    FROM api_audit WHERE endpoint = 'assets.write' AND ts > now() - INTERVAL '7 days';
    ```
  - Ações: aplicar migrations pendentes, normalizar payloads no frontend (empty → NULL), validar trigger de `asset_code`.

- % Assets com `asset_code` válido
  - Objetivo: 100% após recompute; manter 99.99%.
  - Como medir:
    ```sql
    SELECT 100.0 * COUNT(*) FILTER (WHERE asset_code ~ '^[A-Z]{2,4}-.+-[A-Z0-9\-]+-.+') / COUNT(*) FROM public.assets;
    ```
  - Ações: executar recompute (com backup), ativar trigger para geração canônica.

- Parsing / Validation Errors (por 1k payloads)
  - Objetivo: <5/1k imediato; <1/1k longo prazo.
  - Como medir: eventos em Sentry ou logs que contenham `invalid input syntax`.
  - Ações: validação no cliente e server-side.

### Médio / Longo Prazo (semanas → meses)

- Duplicate `asset_code` incidents (por 10k inserts)
  - Objetivo: <1 por 10k; alvo longo prazo ≈ 0.
  - Como medir: monitorar erros SQL 23505 nos logs.
  - Ações: trigger de geração (garante unicidade), considerar lock por-hash se concorrência for alta.

- Migration Application Lag
  - Objetivo: <24h (staging) e <4h (produção via CI).
  - Como medir: comparar timestamps de commit das migrations com registros de aplicação (ou `schema_migrations`).
  - Ações: automatizar execução de migrations no pipeline de CI/CD e alertar em falhas.

- MTTR para erros de schema/migration
  - Objetivo: imediato <1h; longo prazo <30 min.
  - Como medir: tempo entre alerta (log/ticket) e deploy do fix.
  - Ações: documentar runbooks, criar testes de migrations em CI, snapshots/backup rápidos.

- P95 / P99 Latency das APIs de assets
  - Objetivo: P95 < 300ms; P99 < 1s.
  - Como medir: APM (Datadog/NewRelic) ou logs do gateway/Supabase.
  - Ações: otimizar queries e índices, reavaliar custo de locks em triggers (ex.: `pg_advisory_xact_lock`).

- Backup Recency & RPO
  - Objetivo imediato: backup diário + snapshot antes de grandes migrações (RPO = 1h). Longo prazo: RPO = 15min com WAL/PITR.
  - Ação recomendada antes de recompute:
    ```sql
    ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS old_asset_code text;
    UPDATE public.assets SET old_asset_code = asset_code;
    ```

- Test Coverage (áreas críticas)
  - Objetivo: 60–80% no médio prazo para regras críticas; longo prazo ≥80% para áreas selecionadas.
  - Ações: criar testes unitários para `generateAssetCode`, validar migrations e triggers em pipeline.

### Prioridade recomendada (curto → longo)

1. Backup imediato (`old_asset_code`) antes de recompute.
2. Rodar recompute em staging e validar integridade dos códigos.
3. Ativar/confirmar trigger de geração canônica em staging/prod.
4. Instrumentar monitoramento básico (Sentry + logs + contagem de erros 23505).
5. Incluir migrations no CI/CD e adicionar testes unitários para a lógica de geração de código.

---

Arquivo criado: `presentation.md` — você pode editar ou pedir ajustes no conteúdo ou formato (ex.: versão curta para slides ou PDF).
