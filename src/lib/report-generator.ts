export interface ReportData {
  startDate: string;
  endDate: string;
  reportType: 'custos' | 'ativo' | 'tecnico';
}

export function generateReport(data: ReportData) {
  const { startDate, endDate, reportType } = data;
  const fileName = `relatorio_${reportType}_${startDate}_${endDate}.csv`;
  const headers = getReportHeaders(reportType);
  const rows = generateReportRows();
  const csv = [headers, ...rows].map(row => row.join(',')).join('\n');

  downloadCSV(csv, fileName);
}

function getReportHeaders(reportType: string): string[] {
  switch (reportType) {
    case 'custos':
      return ['Data', 'Tipo de Custo', 'Valor', 'Ativo', 'OS', 'Observações'];
    case 'ativo':
      return ['Ativo', 'Total Manutenções', 'Custo Total', 'Tempo Médio Reparo', 'Status'];
    case 'tecnico':
      return ['Técnico', 'OS Realizadas', 'Tempo Médio', 'Taxa Conclusão', 'Avaliação'];
    default:
      return [];
  }
}

function generateReportRows(): string[][] {
  // Dados fictícios para demonstração
  return [
    ['2025-09-01', 'Preventiva', '350.00', 'AC-001', 'OS-2025001', 'Manutenção trimestral'],
    ['2025-09-15', 'Corretiva', '580.00', 'CH-001', 'OS-2025003', 'Troca de componente'],
    ['2025-09-28', 'Preventiva', '350.00', 'SP-001', 'OS-2025002', 'Manutenção de rotina']
  ];
}

function downloadCSV(csv: string, fileName: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}