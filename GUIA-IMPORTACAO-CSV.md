# 📋 Guia de Importação de Ativos via CSV

## 📝 Formato do CSV

### Formato Básico:
```
Código;Tipo;Marca;Modelo;Localização;Setor;Status
```

### Separador:
- Use **ponto e vírgula (`;`)** ou **vírgula (`,`)** como separador
- O sistema aceita ambos os formatos

---

## ✅ Campos Obrigatórios

Estes campos **DEVEM** estar preenchidos:

1. **Código** - Código único do ativo (ex: `AC-001`)
2. **Tipo** - Tipo do equipamento (ex: `ar_condicionado`)
3. **Localização** - Onde o equipamento está instalado (ex: `Sala 101`)

---

## 🔄 Campos Opcionais

Estes campos **PODEM** ficar vazios (mas mantenha o separador):

4. **Marca** - Marca do equipamento (ex: `LG`)
5. **Modelo** - Modelo do equipamento (ex: `Split 12k`)
6. **Setor** - Setor da empresa (ex: `Administração`)
7. **Status** - Status operacional (ex: `operacional`)

---

## 📊 Exemplos Práticos

### Exemplo 1: Completos (todos os campos)
```
AC-001;ar_condicionado;LG;Split 12k;Sala 101;Administração;operacional
AC-002;mecalor;York;Chiller 50TR;Sala 102;TI;operacional
AC-003;ar_maquina;Carrier;RTU 30TR;Sala 103;Produção;operacional
```

### Exemplo 2: Mínimos (apenas obrigatórios)
```
AC-001;ar_condicionado;;;Sala 101;;
AC-002;mecalor;;;Sala 102;;
AC-003;ar_maquina;;;Sala 103;;
```

### Exemplo 3: Parciais (alguns campos preenchidos)
```
AC-001;ar_condicionado;LG;Split 12k;Sala 101;Administração;
AC-002;mecalor;York;;Sala 102;TI;operacional
AC-003;ar_maquina;;RTU 30TR;Sala 103;;manutencao
```

---

## 🎯 Valores Válidos

### Tipos de Ativo (`asset_type`):
- `ar_condicionado` - Ar condicionado
- `mecalor` - Mecalor
- `ar_maquina` - Ar máquina

**⚠️ Nota:** Se você usar `chiller`, `split` ou `outro`, será automaticamente convertido para `ar_condicionado`.

### Status Operacional (`operational_status`):
- `operacional` - Equipamento funcionando
- `manutencao` - Em manutenção
- `quebrado` - Quebrado
- `desativado` - Desativado

**⚠️ Nota:** Se você usar `inativo`, será automaticamente convertido para `desativado`. Se deixar vazio, o padrão é `operacional`.

---

## 📝 Como Preencher Campos Vazios

### Opção 1: Deixar vazio (recomendado)
```
AC-001;ar_condicionado;;;Sala 101;;
```
- Use dois separadores consecutivos (`;;`) para campos vazios

### Opção 2: Usar espaço (também funciona)
```
AC-001;ar_condicionado; ; ;Sala 101; ;
```
- O sistema remove espaços automaticamente

### Opção 3: Usar "N/A" ou "-" (não recomendado, mas funciona)
```
AC-001;ar_condicionado;N/A;N/A;Sala 101;N/A;operacional
```

---

## 💡 Exemplos Completos

### Exemplo Real 1: Ar Condicionado Completo
```
AC-001;ar_condicionado;LG;Split 12.000 BTU;Sala 101;Administração;operacional
AC-002;ar_condicionado;Samsung;Split 18.000 BTU;Sala 102;TI;operacional
AC-003;ar_condicionado;Daikin;Split 24.000 BTU;Sala 103;Produção;manutencao
```

### Exemplo Real 2: Mecalor Completo
```
MC-001;mecalor;York;Chiller 50TR;Sala 201;Produção;operacional
MC-002;mecalor;Carrier;Chiller 100TR;Sala 202;Produção;operacional
```

### Exemplo Real 3: Ar Máquina Completo
```
AM-001;ar_maquina;Trane;RTU 30TR;Sala 301;Administração;operacional
AM-002;ar_maquina;Lennox;RTU 60TR;Sala 302;Produção;operacional
```

### Exemplo Real 4: Mínimos (sem marca/modelo)
```
AC-001;ar_condicionado;;;Sala 101;Administração;operacional
AC-002;ar_condicionado;;;Sala 102;TI;operacional
AC-003;mecalor;;;Sala 201;Produção;operacional
```

---

## 🚨 Regras Importantes

1. **Código Único:** Cada código deve ser único. Se duplicar, dará erro.

2. **Formato do Código:** Pode usar qualquer formato:
   - `AC-001`
   - `AC001`
   - `AR-COND-001`
   - `SALA-101-AC-01`

3. **Localização:** Pode ser qualquer texto:
   - `Sala 101`
   - `Prédio A - Sala 201`
   - `Área de Produção - Linha 1`

4. **Setor:** Pode ser qualquer texto:
   - `Administração`
   - `TI`
   - `Produção`
   - `Recepção`

5. **Uma linha por ativo:** Cada linha representa um ativo.

---

## 📋 Template para Copiar

```
Código;Tipo;Marca;Modelo;Localização;Setor;Status
AC-001;ar_condicionado;LG;Split 12k;Sala 101;Administração;operacional
AC-002;ar_condicionado;Samsung;Split 18k;Sala 102;TI;operacional
AC-003;mecalor;York;Chiller 50TR;Sala 201;Produção;operacional
```

**⚠️ Nota:** A primeira linha (cabeçalho) é **opcional**. O sistema ignora se começar com "Código" ou "Code".

---

## 🔧 Como Importar

1. **Abra a página de Ativos**
2. **Clique em "Importar em Massa"**
3. **Cole o CSV** no campo de texto
4. **Clique em "Importar"**
5. **Aguarde** a mensagem de sucesso

---

## ✅ Validações Automáticas

O sistema faz as seguintes validações automaticamente:

- ✅ **Código obrigatório** - Se faltar, mostra erro
- ✅ **Tipo obrigatório** - Se faltar, mostra erro
- ✅ **Localização obrigatória** - Se faltar, mostra erro
- ✅ **Tipo inválido** - Se usar tipo inválido, converte para `ar_condicionado`
- ✅ **Status inválido** - Se usar status inválido, converte para `operacional`
- ✅ **Código duplicado** - Se o código já existe, mostra erro

---

## ❌ Erros Comuns

### Erro: "Formato inválido"
**Causa:** Menos de 4 campos na linha
**Solução:** Certifique-se de ter pelo menos: Código, Tipo, Marca, Localização

### Erro: "Campos obrigatórios faltando"
**Causa:** Código, Tipo ou Localização estão vazios
**Solução:** Preencha esses campos obrigatórios

### Erro: "Código já existe"
**Causa:** Você está tentando importar um código que já existe no banco
**Solução:** Use um código diferente ou exclua o ativo existente primeiro

---

## 💾 Exemplo de Arquivo CSV Completo

Crie um arquivo `.csv` ou `.txt` com o seguinte conteúdo:

```csv
AC-001;ar_condicionado;LG;Split 12.000 BTU;Sala 101;Administração;operacional
AC-002;ar_condicionado;Samsung;Split 18.000 BTU;Sala 102;TI;operacional
AC-003;ar_condicionado;Daikin;Split 24.000 BTU;Sala 103;Produção;operacional
AC-004;ar_condicionado;Consul;Split 9.000 BTU;Sala 104;Recepção;operacional
MC-001;mecalor;York;Chiller 50TR;Sala 201;Produção;operacional
MC-002;mecalor;Carrier;Chiller 100TR;Sala 202;Produção;operacional
AM-001;ar_maquina;Trane;RTU 30TR;Sala 301;Administração;operacional
AM-002;ar_maquina;Lennox;RTU 60TR;Sala 302;Produção;operacional
```

---

## 🎯 Resumo Rápido

**Formato:** `Código;Tipo;Marca;Modelo;Localização;Setor;Status`

**Obrigatórios:** Código, Tipo, Localização

**Opcionais:** Marca, Modelo, Setor, Status

**Separador:** `;` ou `,`

**Campos vazios:** Use `;;` (dois separadores consecutivos)

**Exemplo mínimo:** `AC-001;ar_condicionado;;;Sala 101;;`

---

**Última atualização:** Janeiro 2025

