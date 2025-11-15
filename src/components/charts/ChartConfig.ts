// Paleta de cores unificada
export const CHART_COLORS = {
  green: "#22c55e",    // Preventivas, Saudáveis
  orange: "#f97316",   // Corretivas, Aviso
  blue: "#3b82f6",     // Total, Informação
  purple: "#a855f7",   // Total Custos
  red: "#ef4444",      // Crítico, Quebrado
  gray: "#6b7280",     // Inativo, Neutro
  amber: "#f59e0b",    // Performance média
};

export const getColorByPerformance = (percentage: number): string => {
  if (percentage >= 90) return CHART_COLORS.green;
  if (percentage >= 70) return CHART_COLORS.blue;
  if (percentage >= 50) return CHART_COLORS.orange;
  return CHART_COLORS.red;
};

export const TOOLTIP_CONFIG = {
  contentStyle: {
    backgroundColor: "#1f2937",
    border: "1px solid #374151",
    borderRadius: "8px",
    color: "#fff",
  },
  labelStyle: { color: "#fff" },
};

export const formatCurrency = (value: number) => {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
};

export const formatPercentage = (value: number) => {
  return `${(value * 100).toFixed(1)}%`;
};
