# Atualização - Geração de Etiquetas Melhorada

## 📝 Resumo das Mudanças

Foi implementada uma versão completamente renovada do sistema de geração de etiquetas com as seguintes características:

### ✨ Melhorias Visuais das Etiquetas

1. **Fundo Cinza (#d3d3d3)**
   - Substituiu o fundo branco anterior
   - Oferece melhor contraste visual

2. **Layout Otimizado**
   - **Lado Esquerdo**: Logo MAHLE + Código do ativo (em uma única linha)
   - **Lado Direito**: QR Code
   - Layout horizontal mantendo ambos os elementos em primeiro plano

3. **Código em Linha Única**
   - Código agora aparece em uma única linha compacta
   - Evita quebra de texto
   - Utiliza ellipsis (...) se o código for muito longo

4. **Bordas Melhoradas**
   - Borda com cor #999999 (cinza mais escuro)
   - Melhor definição visual das etiquetas

### 🎯 Novas Funcionalidades

#### Filtro por Setor ao Gerar Etiquetas
- Novo dialog permite selecionar o setor antes de gerar as etiquetas em massa
- Opções disponíveis:
  - **Todos os Ativos**: Gera etiquetas para todos os ativos filtrados
  - **Setores Específicos**: Lista dinâmica de todos os setores cadastrados
  
- Contador de ativos mostra quantos serão incluídos na geração

#### Interface Melhorada
- O botão "Gerar Etiquetas" agora abre um dialog com filtros
- Seleção de setor via componente Select com dropdown
- Feedback visual do número de etiquetas que serão geradas

## 📁 Arquivos Modificados

### 1. `src/lib/label-generator.ts`
- **`generateSingleLabel()`**: Atualizada para usar fundo cinza e layout otimizado
- **`generateMultipleLabels()`**: Atualizada para gerar múltiplas etiquetas com novo design

Mudanças técnicas:
```typescript
// Fundo alterado de #ffffff para #d3d3d3
container.style.backgroundColor = '#d3d3d3';

// Layout ajustado para linha única de código
codeLine.style.whiteSpace = 'nowrap';
codeLine.style.overflow = 'hidden';
codeLine.style.textOverflow = 'ellipsis';

// Alinhamento centralizado
container.style.alignItems = 'center';
```

### 2. `src/pages/Assets.tsx`
- Adicionado estado `showLabelFilterDialog` para controlar o dialog
- Adicionado estado `selectedSectorForLabels` para armazenar setor selecionado
- Importado componente `Select` do shadcn/ui
- Atualizado tipo `Asset` com campo `sector?: string | null`
- Modificada função `gerarEtiquetasEmMassa()` para filtrar por setor
- Adicionado novo Dialog para seleção de setor
- Atualizado onClick do botão para abrir dialog ao invés de gerar direto

## 🚀 Como Usar

### Gerando Etiquetas com Filtro por Setor

1. Na página de Ativos, clique no botão **"Gerar Etiquetas"**
2. O dialog será aberto mostrando:
   - Dropdown com opção "Todos os Ativos"
   - Dropndown com lista de setores cadastrados
   - Contador de ativos que serão incluídos

3. Selecione o setor desejado (ou deixe "Todos os Ativos")
4. Clique em **"Gerar Etiquetas"**
5. Um PDF será baixado com as etiquetas formatadas

## 📊 Estrutura das Etiquetas

### Dimensões
- Largura: 80mm
- Altura: 40mm
- Orientação: Landscape
- Formato de página: A4

### Composição de Cada Etiqueta
```
┌─────────────────────────────────────────┐
│ MAHLE                        [QR CODE]   │
│ ATR-AR-P1-001                (28x28)    │
└─────────────────────────────────────────┘
```

- Fundo: Cinza (#d3d3d3)
- Logo MAHLE: Azul (#003d7a), tamanho 8px
- Código: Preto, 7px, peso 700
- QR Code: 28x28px com borda

## ✅ Verificação

Compilação realizada com sucesso:
- ✓ Sem erros TypeScript
- ✓ Sem avisos de compilação
- ✓ Build produção executado com sucesso

## 🔄 Compatibilidade

- Compatível com todas as versões anteriores
- Mantém mesmos padrões de geração de PDF
- Utiliza mesma biblioteca (html2canvas + jsPDF)

## 📝 Notas

- Os setores são extraídos dinamicamente da lista de ativos filtrados
- O filtro respeita buscas de texto já aplicadas na página
- As etiquetas mantêm a qualidade visual mesmo em impressão

