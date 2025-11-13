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
import { CHART_COLORS, TOOLTIP_CONFIG, formatCurrency } from "./ChartConfig";

interface CostByTypeData {
  type: string;
  custo: number;
}

interface CostByTypeProps {
  data: CostByTypeData[];
  height?: number;
}

export function CostByTypeChart({ data, height = 300 }: CostByTypeProps) {
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
          <p className="text-xs">{payload[0].payload.type}</p>
          <p className="text-xs text-blue-300">{formatCurrency(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="type" stroke="#6b7280" />
        <YAxis stroke="#6b7280" />
        <Tooltip content={customTooltip} />
        <Bar dataKey="custo" fill={CHART_COLORS.blue} name="Custo" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
