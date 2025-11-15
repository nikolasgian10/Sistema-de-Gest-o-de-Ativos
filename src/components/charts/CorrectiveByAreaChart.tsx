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

interface CorrectiveByAreaData {
  setor: string;
  preventiva: number;
  corretiva: number;
}

interface CorrectiveByAreaProps {
  data: CorrectiveByAreaData[];
  height?: number;
}

export function CorrectiveByAreaChart({ data, height = 300 }: CorrectiveByAreaProps) {
  const sortedData = useMemo(
    () => [...data].sort((a, b) => b.corretiva - a.corretiva).slice(0, 8),
    [data]
  );

  const customTooltip = (props: any) => {
    const { active, payload } = props;
    if (active && payload && payload.length) {
      const { setor, preventiva, corretiva } = payload[0].payload;
      const total = preventiva + corretiva;
      const percentualCorretiva = total > 0 ? ((corretiva / total) * 100).toFixed(1) : 0;
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
          <p className="text-sm font-semibold">{setor}</p>
          <p className="text-xs text-green-300">Preventiva: {preventiva}</p>
          <p className="text-xs text-orange-300">Corretiva: {corretiva}</p>
          <p className="text-xs text-gray-300">{percentualCorretiva}% Corretiva</p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={sortedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="setor" stroke="#6b7280" />
        <YAxis stroke="#6b7280" />
        <Tooltip content={customTooltip} />
        <Legend />
        <Bar dataKey="preventiva" stackId="a" fill={CHART_COLORS.green} name="Preventivas" radius={[0, 0, 0, 0]} />
        <Bar dataKey="corretiva" stackId="a" fill={CHART_COLORS.orange} name="Corretivas" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
