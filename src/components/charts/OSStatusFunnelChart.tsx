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
  Cell,
} from "recharts";
import { CHART_COLORS, TOOLTIP_CONFIG } from "./ChartConfig";

interface OSStatusData {
  status: string;
  quantidade: number;
  color: string;
}

interface OSStatusFunnelProps {
  data: OSStatusData[];
  height?: number;
}

const statusColors = {
  abertas: CHART_COLORS.orange,
  "em andamento": CHART_COLORS.blue,
  concluidas: CHART_COLORS.green,
  canceladas: CHART_COLORS.red,
};

export function OSStatusFunnelChart({ data, height = 300 }: OSStatusFunnelProps) {
  const sortedData = useMemo(() => [...data].sort((a, b) => b.quantidade - a.quantidade), [data]);

  const customTooltip = (props: any) => {
    const { active, payload } = props;
    if (active && payload && payload.length) {
      const { status, quantidade } = payload[0].payload;
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
          <p className="text-sm font-semibold">{status}</p>
          <p className="text-xs">{quantidade} OSs</p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={sortedData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="status" stroke="#6b7280" />
        <YAxis stroke="#6b7280" />
        <Tooltip content={customTooltip} />
        <Bar dataKey="quantidade" name="Quantidade" radius={[8, 8, 0, 0]}>
          {sortedData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={statusColors[entry.status.toLowerCase() as keyof typeof statusColors]}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
