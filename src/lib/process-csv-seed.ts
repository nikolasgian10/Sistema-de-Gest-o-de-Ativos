// Script para processar CSV e gerar dados de seed
// Execute este script para processar o CSV e adicionar ao seed-data.ts

export function processCSVToSeedData() {
  // Como o CSV está anexado, vou criar uma função que processa linha por linha
  // Você pode executar isso via Node.js ou incluir diretamente

  const csvData = `ITEM;BP DA MÁQUINA;BP GERADA SAP;PRÉDIO;DESCRIÇÃO DO LOCAL;TIPO DE ATIVIDADE;CONDENSADORA;MODELO;EVAPORADORA;MODELO.1;TIPO;POTÊNCIA EM BTU'S;TENSÃO;FLUÍDO REFRIGERANTE;Mensal;semestral;Trimestral;Observação;Jan_date;Jan_type;Feb_date;Feb_type;Mar_date;Mar_type;Apr_date;Apr_type;May_date;May_type;Jun_date;Jun_type;Jul_date;Jul_type;Aug_date;Aug_type;Sep_date;Sep_type;Oct_date;Oct_type;Nov_date;Nov_type;Dec_date;Dec_type
1;910443;;Usinagem; ;Administrativa;Springer;38KCX09S5;Springer;42MACA09S5;Hi-Wall;9000 BTU's;220 V;R410A;;;;INCLUIR NO PLANO PREVENTIVO;2026-01-05;Mensal;2026-02-02;Mensal;2026-03-02;Mensal;2026-04-06;Mensal;2026-05-04;Mensal;2026-06-03;Semestral;2026-07-06;Mensal;2026-08-03;Mensal;2026-09-07;Mensal;2026-10-05;Mensal;2026-11-02;Mensal;2026-12-02;Semestral`;

  const lines = csvData.split('\n');
  const headers = lines[0].split(';');
  
  // Encontrar índices das colunas
  const getIndex = (name: string) => headers.findIndex(h => h.trim() === name);
  
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
  
  // Meses
  const meses = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const assets: any[] = [];
  const workOrders: any[] = [];
  let orderCounter = 1;
  
  // Processar linhas (pular cabeçalho)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = line.split(';');
    if (values.length < headers.length) continue;
    
    const getValue = (idx: number) => (values[idx] || '').trim();
    
    // Determinar código do ativo
    let assetCode = getValue(bpIdx) || getValue(bpSapIdx) || `ASSET-${i}`;
    
    // Mapear tipo
    const tipo = getValue(tipoIdx).toLowerCase();
    let assetType = 'ar_condicionado'; // padrão
    if (tipo.includes('mecalor') || tipo.includes('self mecalor')) {
      assetType = 'mecalor';
    } else if (tipo.includes('acj') || tipo.includes('ar condicionado')) {
      assetType = 'ar_condicionado';
    } else if (tipo.includes('máquina') || tipo.includes('maquina')) {
      assetType = 'ar_maquina';
    }
    
    // Criar localização
    const predio = getValue(predioIdx);
    const local = getValue(localIdx);
    const location = `${predio}${local ? ' - ' + local : ''}`.trim() || 'Não especificado';
    
    // Criar asset
    const asset = {
      asset_code: assetCode,
      asset_type: assetType,
      brand: getValue(condensadoraIdx) || null,
      model: getValue(modeloIdx) || null,
      serial_number: getValue(bpIdx) || null,
      location: location,
      sector: predio || getValue(localIdx) || null,
      capacity: getValue(potenciaIdx) || null,
      operational_status: 'operacional' as const,
      notes: getValue(obsIdx) || null,
    };
    
    assets.push(asset);
    
    // Processar manutenções de cada mês
    meses.forEach((mes, mesIdx) => {
      const dateIdx = getIndex(`${mes}_date`);
      const typeIdx = getIndex(`${mes}_type`);
      
      if (dateIdx >= 0 && typeIdx >= 0) {
        const date = getValue(dateIdx);
        const maintType = getValue(typeIdx);
        
        if (date && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
          workOrders.push({
            asset_code: assetCode, // para mapear depois
            order_number: `OS-2026-${String(orderCounter++).padStart(5, '0')}`,
            order_type: maintType?.toLowerCase().includes('semestral') ? 'preventiva' : 'preventiva',
            priority: 'normal',
            status: 'pendente',
            scheduled_date: date,
            description: `Manutenção ${maintType || 'preventiva'} - ${mes} 2026`,
          });
        }
      }
    });
  }
  
  return { assets, workOrders };
}

