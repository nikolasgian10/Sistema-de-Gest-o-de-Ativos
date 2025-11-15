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
const schedules = [];
const workOrders = [];
let orderCounter = 1;
const assetCodeMap = new Map(); // Para evitar duplicatas

function getValue(values, idx) {
  return (values[idx] || '').trim().replace(/"/g, '');
}

function normalizeAssetType(tipo) {
  const t = (tipo || '').toLowerCase();
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
  if (!assetCode) {
    const item = getValue(values, itemIdx);
    assetCode = `ASSET-${item || i}`;
  }

  // Verificar duplicidade
  if (assetCodeMap.has(assetCode)) {
    assetCode = `${assetCode}-${i}`;
  }
  assetCodeMap.set(assetCode, true);

  // Mapear tipo
  const tipo = getValue(values, tipoIdx);
  const assetType = normalizeAssetType(tipo);

  // Localização
  const predio = getValue(values, predioIdx);
  const local = getValue(values, localIdx);
  let location = predio;
  if (local && local.trim()) location = `${predio} - ${local}`.trim();
  if (!location || location.trim() === '') location = 'Não especificado';

  // Asset
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

  // Plano + Ordens
  meses.forEach((mes, mesIdx) => {
    const date = getValue(values, monthDateIndices[mesIdx]);
    const maintType = getValue(values, monthTypeIndices[mesIdx]);
    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const schedule_type = (maintType || '').toLowerCase().includes('semestral')
        ? 'semestral'
        : (maintType || '').toLowerCase().includes('trimestral')
          ? 'trimestral'
          : 'mensal';
      const frequency_months = schedule_type === 'semestral' ? 6 : schedule_type === 'trimestral' ? 3 : 1;

      schedules.push({
        asset_code: assetCode,
        schedule_type,
        frequency_months,
        next_maintenance: date,
      });

      workOrders.push({
        asset_code: assetCode,
        order_number: `OS-2026-${String(orderCounter++).padStart(5, '0')}`,
        order_type: 'preventiva',
        priority: 'normal',
        status: 'pendente',
        scheduled_date: date,
        description: null,
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

const schedulesCode = schedules.map(sc => {
  return `  {
    asset_code: '${sc.asset_code.replace(/'/g, "\\'")}',
    schedule_type: '${sc.schedule_type}',
    frequency_months: ${sc.frequency_months},
    next_maintenance: '${sc.next_maintenance}',
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
    description: ${wo.description},
  }`;
}).join(',\n');

const output = `import { supabase } from '@/integrations/supabase/client';

const ativos = [
${assetsCode}
];

const schedulesToMap = [
${schedulesCode}
];

const workOrdersToMap = [
${workOrdersCode}
];

export async function seedDatabase() {
  try {
    console.log('Inserindo ${assets.length} ativos...');
    const { data: assetsData, error: assetsError } = await supabase
      .from('assets')
      .insert(ativos)
      .select();
    if (assetsError) throw assetsError;

    const assetMap = new Map(assetsData.map(asset => [asset.asset_code, asset.id]));

    // Plano
    const planos = schedulesToMap.map(sc => {
      const assetId = assetMap.get(sc.asset_code);
      if (!assetId) return null;
      return {
        asset_id: assetId,
        schedule_type: sc.schedule_type,
        frequency_months: sc.frequency_months,
        last_maintenance: null,
        next_maintenance: sc.next_maintenance,
      };
    }).filter(Boolean);

    // Ordens (sem notas)
    const ordens = workOrdersToMap.map(wo => {
      const assetId = assetMap.get(wo.asset_code);
      if (!assetId) return null;
      return {
        order_number: wo.order_number,
        asset_id: assetId,
        order_type: wo.order_type,
        priority: wo.priority,
        status: wo.status,
        scheduled_date: wo.scheduled_date,
        description: null,
      };
    }).filter(Boolean);

    const batchInsert = async (table, rows) => {
      const batchSize = 100;
      for (let i = 0; i < rows.length; i += batchSize) {
        const { error } = await supabase.from(table).insert(rows.slice(i, i + batchSize));
        if (error) throw error;
      }
    };

    console.log('Inserindo ' + planos.length + ' entradas do plano...');
    await batchInsert('maintenance_schedule', planos);

    console.log('Inserindo ' + ordens.length + ' ordens...');
    await batchInsert('work_orders', ordens);

    return { success: true, assetsCount: ativos.length, planCount: planos.length, ordersCount: ordens.length };
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
console.log(`   - ${schedules.length} entradas de plano geradas`);
console.log(`   - ${workOrders.length} ordens geradas (sem notas)`);
console.log(`   - Arquivo salvo em: ${outputPath}`);

