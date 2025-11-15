import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { CHART_COLORS, TOOLTIP_CONFIG, formatCurrency } from "./ChartConfig";

interface CostEvolutionData {
  month: string;
  pecas: number;
  maoDeObra: number;
}

interface CostEvolutionProps {
  data: CostEvolutionData[];
  height?: number;
}

export function CostEvolutionChart({ data, height = 300 }: CostEvolutionProps) {
  const processedData = useMemo(() => {
    return data.map((item) => ({
      ...item,
      total: item.pecas + item.maoDeObra,
    }));
  }, [data]);

  const customTooltip = (props: any) => {
    const { active, payload } = props;
    if (active && payload && payload.length) {
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
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-xs">
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={processedData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="month" stroke="#6b7280" />
        <YAxis stroke="#6b7280" />
        <Tooltip content={customTooltip} />
        <Legend />
        <Line
          type="monotone"
          dataKey="pecas"
          stroke={CHART_COLORS.green}
          strokeWidth={2}
          name="Peças"
          dot={{ fill: CHART_COLORS.green, r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="maoDeObra"
          stroke={CHART_COLORS.orange}
          strokeWidth={2}
          name="Mão de Obra"
          dot={{ fill: CHART_COLORS.orange, r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="total"
          stroke={CHART_COLORS.purple}
          strokeWidth={3}
          name="Total"
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
