const fs = require('fs');
const path = require('path');

// Ler o CSV
const csvPath = 'c:/Users/nikgi/Downloads/Sistema/PMOC_2026_plano_manutencao.csv';
const csvContent = fs.readFileSync(csvPath, 'utf8');
const lines = csvContent.split('\n').filter(line => line.trim());

// Processar cabeçalho
const headers = lines[0].split(';').map(h => h.trim());
const getIndex = (name) => headers.findIndex(h => h.trim() === name);

const itemIdx = getIndex('ITEM');
const bpIdx = getIndex('BP DA MÁQUINA');
const bpSapIdx = getIndex('BP GERADA SAP');
const predioIdx = getIndex('PRÉDIO');
const localIdx = getIndex('DESCRIÇÃO DO LOCAL');
const atividadeIdx = getIndex('TIPO DE ATIVIDADE');
const condensadoraIdx = getIndex('CONDENSADORA');
const modeloIdx = getIndex('MODELO');
const evaporadoraIdx = getIndex('EVAPORADORA');
const modeloEvapIdx = getIndex('MODELO.1');
const tipoIdx = getIndex('TIPO');
const potenciaIdx = getIndex('POTÊNCIA EM BTU\'S');
const tensaoIdx = getIndex('TENSÃO');
const fluidoIdx = getIndex('FLUÍDO REFRIGERANTE');
const obsIdx = getIndex('Observação');

const meses = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const monthDateIndices = meses.map(m => getIndex(`${m}_date`));
const monthTypeIndices = meses.map(m => getIndex(`${m}_type`));

const assets = [];
const workOrders = [];
let orderCounter = 1;
const assetCodeMap = new Map(); // Para evitar duplicatas

function getValue(values, idx) {
  return (values[idx] || '').trim().replace(/"/g, '');
}

function normalizeAssetType(tipo) {
  const t = tipo.toLowerCase();
  if (t.includes('mecalor') || t.includes('self')) return 'mecalor';
  if (t.includes('maquina') || t.includes('máquina')) return 'ar_maquina';
  return 'ar_condicionado';
}

// Processar linhas (pular cabeçalho)
for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;
  
  const values = line.split(';');
  if (values.length < headers.length) continue;
  
  // Determinar código do ativo
  let assetCode = getValue(values, bpIdx) || getValue(values, bpSapIdx);
  
  // Se não tem código, gerar baseado no item
  if (!assetCode) {
    const item = getValue(values, itemIdx);
    assetCode = `ASSET-${item || i}`;
  }
  
  // Verificar se já existe (evitar duplicatas)
  if (assetCodeMap.has(assetCode)) {
    assetCode = `${assetCode}-${i}`; // Adicionar sufixo
  }
  assetCodeMap.set(assetCode, true);
  
  // Mapear tipo
  const tipo = getValue(values, tipoIdx);
  const assetType = normalizeAssetType(tipo);
  
  // Criar localização
  const predio = getValue(values, predioIdx);
  const local = getValue(values, localIdx);
  let location = predio;
  if (local && local.trim()) {
    location = `${predio} - ${local}`.trim();
  }
  if (!location || location.trim() === '') {
    location = 'Não especificado';
  }
  
  // Criar asset
  const brand = getValue(values, condensadoraIdx) || null;
  const model = getValue(values, modeloIdx) || null;
  const capacity = getValue(values, potenciaIdx) || null;
  const sector = predio || getValue(values, localIdx) || null;
  const notes = getValue(values, obsIdx) || null;
  
  assets.push({
    asset_code: assetCode,
    asset_type: assetType,
    brand: brand || null,
    model: model || null,
    serial_number: getValue(values, bpIdx) || null,
    location: location,
    sector: sector || null,
    capacity: capacity || null,
    operational_status: 'operacional',
    notes: notes || null,
  });
  
  // Processar manutenções de cada mês
  meses.forEach((mes, mesIdx) => {
    const date = getValue(values, monthDateIndices[mesIdx]);
    const maintType = getValue(values, monthTypeIndices[mesIdx]);
    
    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      workOrders.push({
        asset_code: assetCode,
        order_number: `OS-2026-${String(orderCounter++).padStart(5, '0')}`,
        order_type: 'preventiva',
        priority: 'normal',
        status: 'pendente',
        scheduled_date: date,
        description: `Manutenção ${maintType || 'preventiva'} - ${mes} 2026`,
      });
    }
  });
}

// Gerar código TypeScript
const assetsCode = assets.map(a => {
  return `  {
    asset_code: '${a.asset_code.replace(/'/g, "\\'")}',
    asset_type: '${a.asset_type}',
    brand: ${a.brand ? `'${a.brand.replace(/'/g, "\\'")}'` : 'null'},
    model: ${a.model ? `'${a.model.replace(/'/g, "\\'")}'` : 'null'},
    serial_number: ${a.serial_number ? `'${a.serial_number.replace(/'/g, "\\'")}'` : 'null'},
    location: '${a.location.replace(/'/g, "\\'")}',
    sector: ${a.sector ? `'${a.sector.replace(/'/g, "\\'")}'` : 'null'},
    capacity: ${a.capacity ? `'${a.capacity.replace(/'/g, "\\'")}'` : 'null'},
    operational_status: '${a.operational_status}',
    notes: ${a.notes ? `'${a.notes.replace(/'/g, "\\'")}'` : 'null'},
  }`;
}).join(',\n');

const workOrdersCode = workOrders.map(wo => {
  return `  {
    asset_code: '${wo.asset_code.replace(/'/g, "\\'")}',
    order_number: '${wo.order_number}',
    order_type: '${wo.order_type}',
    priority: '${wo.priority}',
    status: '${wo.status}',
    scheduled_date: '${wo.scheduled_date}',
    description: '${wo.description.replace(/'/g, "\\'")}',
  }`;
}).join(',\n');

const output = `import { supabase } from '@/integrations/supabase/client';

const ativos = [
${assetsCode}
];

const workOrdersToMap = [
${workOrdersCode}
];

export async function seedDatabase() {
  try {
    console.log('Inserindo ${assets.length} ativos...');
    // Inserir ativos
    const { data: assetsData, error: assetsError } = await supabase
      .from('assets')
      .insert(ativos)
      .select();

    if (assetsError) throw assetsError;

    console.log('${assets.length} ativos inseridos com sucesso!');

    // Mapear IDs dos ativos inseridos
    const assetMap = new Map(
      assetsData.map(asset => [asset.asset_code, asset.id])
    );

    // Mapear work orders com asset_id
    const ordens = workOrdersToMap.map(wo => {
      const assetId = assetMap.get(wo.asset_code);
      if (!assetId) {
        console.warn('Ativo não encontrado para código:', wo.asset_code);
        return null;
      }
      return {
        order_number: wo.order_number,
        asset_id: assetId,
        order_type: wo.order_type,
        priority: wo.priority,
        status: wo.status,
        scheduled_date: wo.scheduled_date,
        description: wo.description,
      };
    }).filter(wo => wo !== null);

    console.log('Inserindo ${workOrders.length} ordens de serviço...');
    // Inserir ordens em lotes de 100
    const batchSize = 100;
    for (let i = 0; i < ordens.length; i += batchSize) {
      const batch = ordens.slice(i, i + batchSize);
      const { error: ordersError } = await supabase
        .from('work_orders')
        .insert(batch);
      
      if (ordersError) {
        console.error('Erro ao inserir lote', i, '-', i + batchSize, ':', ordersError);
        throw ordersError;
      }
    }

    console.log('${workOrders.length} ordens de serviço inseridas com sucesso!');
    return { success: true, assetsCount: ${assets.length}, ordersCount: ${workOrders.length} };
  } catch (error) {
    console.error('Erro ao inserir dados:', error);
    return { success: false, error };
  }
}
`;

// Escrever arquivo
const outputPath = path.join(__dirname, 'src/lib/seed-data.ts');
fs.writeFileSync(outputPath, output, 'utf8');

console.log(`✅ Processamento concluído!`);
console.log(`   - ${assets.length} ativos gerados`);
console.log(`   - ${workOrders.length} ordens de serviço geradas`);
console.log(`   - Arquivo salvo em: ${outputPath}`);

