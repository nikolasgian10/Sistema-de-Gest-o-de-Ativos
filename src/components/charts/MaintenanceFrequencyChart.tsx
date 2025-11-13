import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { CHART_COLORS, TOOLTIP_CONFIG } from "./ChartConfig";

interface MaintenanceFrequencyData {
  tipoOuFalha: string;
  quantidade: number;
}

interface MaintenanceFrequencyProps {
  data: MaintenanceFrequencyData[];
  height?: number;
}

export function MaintenanceFrequencyChart({ data, height = 300 }: MaintenanceFrequencyProps) {
  const sortedData = useMemo(() => [...data].sort((a, b) => b.quantidade - a.quantidade), [data]);

  const customTooltip = (props: any) => {
    const { active, payload } = props;
    if (active && payload && payload.length) {
      const { tipoOuFalha, quantidade } = payload[0].payload;
      return (
        <div
          style={{
            backgroundColor: "#1f2937",
            border: "1px solid #374151",
            borderRadius: "8px",
            padding: "8px",
            color: "#fff",
          }}
        >
          <p className="text-sm font-semibold">{tipoOuFalha}</p>
          <p className="text-xs text-blue-300">{quantidade} OSs</p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={sortedData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="tipoOuFalha" stroke="#6b7280" />
        <YAxis stroke="#6b7280" />
        <Tooltip content={customTooltip} />
        <Bar dataKey="quantidade" fill={CHART_COLORS.blue} name="Frequência" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
