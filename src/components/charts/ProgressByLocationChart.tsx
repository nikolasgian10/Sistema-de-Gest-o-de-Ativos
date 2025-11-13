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
import { CHART_COLORS, getColorByPerformance } from "./ChartConfig";

interface ProgressByLocationData {
  location: string;
  percentage: number;
}

interface ProgressByLocationProps {
  data: ProgressByLocationData[];
  height?: number;
}

export function ProgressByLocationChart({ data, height = 300 }: ProgressByLocationProps) {
  const customTooltip = (props: any) => {
    const { active, payload } = props;
    if (active && payload && payload.length) {
      const { location, percentage } = payload[0].payload;
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
          <p className="text-sm font-semibold">{location}</p>
          <p className="text-xs">{percentage.toFixed(1)}% concluído</p>
        </div>
      );
    }
    return null;
  };

  const sortedData = useMemo(() => [...data].sort((a, b) => b.percentage - a.percentage), [data]);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={sortedData} layout="vertical" margin={{ top: 5, right: 30, left: 200, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis type="number" stroke="#6b7280" domain={[0, 100]} />
        <YAxis dataKey="location" type="category" stroke="#6b7280" width={190} />
        <Tooltip content={customTooltip} />
        <Bar dataKey="percentage" fill="#8884d8" name="Taxa de Conclusão" radius={[0, 8, 8, 0]}>
          {sortedData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getColorByPerformance(entry.percentage)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
