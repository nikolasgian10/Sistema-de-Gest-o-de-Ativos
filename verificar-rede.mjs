// Script para verificar configuração de rede
import { networkInterfaces } from 'os';
import { createServer } from 'net';

console.log('🔍 Verificando configuração de rede...\n');

// 1. Listar IPs disponíveis
console.log('📡 Interfaces de rede encontradas:');
const interfaces = networkInterfaces();
let localIP = null;

for (const name of Object.keys(interfaces)) {
  for (const iface of interfaces[name] || []) {
    if (iface.family === 'IPv4' && !iface.internal) {
      console.log(`  ✓ ${name}: ${iface.address}`);
      if (!localIP) localIP = iface.address;
    }
  }
}

if (!localIP) {
  console.log('  ⚠️  Nenhum IP de rede local encontrado!');
  console.log('     Certifique-se de que está conectado a uma rede Wi-Fi ou Ethernet.\n');
} else {
  console.log(`\n✅ IP principal: ${localIP}\n`);
}

// 2. Verificar se a porta está disponível
console.log('🔌 Verificando porta 8080...');
const server = createServer();

server.listen(8080, '0.0.0.0', () => {
  console.log('  ✅ Porta 8080 está disponível');
  server.close(() => {
    console.log('\n📋 Instruções:');
    console.log('  1. Certifique-se de que o celular está na mesma rede Wi-Fi');
    console.log(`  2. Acesse do celular: https://${localIP || 'SEU_IP'}:8080`);
    console.log('  3. Se não funcionar, verifique o firewall do Windows\n');
    console.log('🔒 Para permitir no Firewall (PowerShell como Administrador):');
    console.log('  New-NetFirewallRule -DisplayName "Vite Dev Server" -Direction Inbound -LocalPort 8080 -Protocol TCP -Action Allow\n');
  });
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log('  ⚠️  Porta 8080 já está em uso!');
    console.log('     Pare o servidor que está usando essa porta ou mude a porta no vite.config.ts\n');
  } else {
    console.log(`  ❌ Erro: ${err.message}\n`);
  }
});

