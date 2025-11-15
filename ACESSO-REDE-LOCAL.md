# Como Acessar o Sistema na Rede Local

## Passo 1: Gerar Certificados SSL

Primeiro, você precisa gerar os certificados SSL para habilitar HTTPS:

```bash
npm run cert
```

Ou use o comando direto:

```bash
node create-cert.mjs
```

## Passo 2: Iniciar o Servidor

Para iniciar o servidor com HTTPS (necessário para a câmera funcionar):

```bash
npm run dev:https
```

Ou se os certificados já existirem:

```bash
npm run dev
```

## Passo 3: Descobrir o IP da sua Máquina

O servidor mostrará no terminal algo como:

```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   https://localhost:8080/
  ➜  Network: https://192.168.x.x:8080/
```

**Anote o IP que aparece em "Network"** (exemplo: `192.168.1.100`)

## Passo 4: Acessar do Celular ou Outro Dispositivo

1. **Certifique-se de que o celular está na mesma rede Wi-Fi** que o computador
2. **Abra o navegador no celular** (Chrome, Safari, etc.)
3. **Digite o endereço**: `https://192.168.x.x:8080` (substitua pelo IP que apareceu no terminal)
4. **Aceite o aviso de certificado não confiável**:
   - O navegador vai avisar que a conexão não é segura (isso é normal com certificados auto-assinados)
   - Clique em "Avançado" ou "Advanced"
   - Clique em "Prosseguir mesmo assim" ou "Proceed anyway"
   - No iOS/Safari: pode ser necessário tocar em "Mostrar detalhes" e depois "Visitar este site"

## Importante

- ⚠️ **O certificado é auto-assinado**, então o navegador sempre mostrará um aviso. Isso é normal e seguro para desenvolvimento local.
- 📱 **A câmera só funciona com HTTPS**, por isso é necessário usar HTTPS mesmo em desenvolvimento.
- 🔒 **Firewall**: Se não conseguir acessar, verifique se o firewall do Windows não está bloqueando a porta 8080.

## Solução de Problemas

### Não consegue acessar do celular?

**1. Verifique a rede:**
   - Execute: `npm run check-network` para verificar sua configuração
   - Certifique-se de que ambos os dispositivos estão na mesma rede Wi-Fi
   - Verifique se o IP mostrado no terminal corresponde ao IP da sua máquina

**2. Verifique o Firewall do Windows (MUITO IMPORTANTE):**

   **Opção A - Permitir Node.js pelo Firewall:**
   - Pressione `Win + R`, digite `wf.msc` e pressione Enter
   - Clique em "Regras de Entrada" no painel esquerdo
   - Clique em "Nova Regra..." no painel direito
   - Selecione "Porta" → Avançar
   - Selecione "TCP" e digite `8080` → Avançar
   - Selecione "Permitir a conexão" → Avançar
   - Marque todas as opções (Domínio, Privada, Pública) → Avançar
   - Nome: "Vite Dev Server" → Concluir

   **Opção B - Permitir via PowerShell (mais rápido):**
   ```powershell
   New-NetFirewallRule -DisplayName "Vite Dev Server" -Direction Inbound -LocalPort 8080 -Protocol TCP -Action Allow
   ```

   **Opção C - Desabilitar temporariamente (apenas para teste):**
   - Pressione `Win + R`, digite `firewall.cpl` e pressione Enter
   - Clique em "Ativar ou desativar o Firewall do Windows Defender"
   - Desative temporariamente para testar (NÃO RECOMENDADO para uso permanente)

**3. Verifique se o servidor está rodando:**
   - No terminal, você deve ver: `Network: https://192.168.x.x:8080/`
   - Se não aparecer "Network", o servidor não está escutando na rede
   - Reinicie o servidor: `npm run dev:https`

**4. Teste a conexão:**
   - No celular, tente acessar: `https://192.168.x.x:8080`
   - Se aparecer "Conexão recusada" ou "Não foi possível conectar", é problema de firewall
   - Se aparecer aviso de certificado, isso é normal - aceite e continue

### A câmera não funciona?

1. Certifique-se de que está acessando via HTTPS (não HTTP)
2. Aceite o certificado no navegador do celular
3. Dê permissão de câmera quando o navegador solicitar

### O IP mudou?

Se o IP da sua máquina mudar (por exemplo, ao reconectar na rede), você precisa:
1. Gerar novos certificados: `npm run cert`
2. Reiniciar o servidor: `npm run dev:https`

