import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { CHART_COLORS, TOOLTIP_CONFIG, formatCurrency } from "./ChartConfig";

interface CostDistributionData {
  name: string;
  value: number;
}

interface CostDistributionProps {
  data: CostDistributionData[];
  height?: number;
}

const colors = [CHART_COLORS.green, CHART_COLORS.orange, CHART_COLORS.blue];

export function CostDistributionChart({ data, height = 300 }: CostDistributionProps) {
  const total = useMemo(() => data.reduce((sum, item) => sum + item.value, 0), [data]);

  const customTooltip = (props: any) => {
    const { active, payload } = props;
    if (active && payload && payload.length) {
      const { name, value } = payload[0];
      const percentage = ((value / total) * 100).toFixed(1);
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
          <p className="text-sm font-semibold">{name}</p>
          <p className="text-xs">{formatCurrency(value)}</p>
          <p className="text-xs text-gray-300">{percentage}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip content={customTooltip} />
        <Legend
          formatter={(value, entry: any) => {
            const item = data.find((d) => d.name === value);
            return item ? `${value}: ${formatCurrency(item.value)}` : value;
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
