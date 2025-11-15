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
  ReferenceLine,
} from "recharts";
import { CHART_COLORS, TOOLTIP_CONFIG } from "./ChartConfig";

interface AvgResolutionTimeData {
  type: string;
  tmr: number;
  meta: number;
}

interface AvgResolutionTimeProps {
  data: AvgResolutionTimeData[];
  height?: number;
}

export function AvgResolutionTimeChart({ data, height = 300 }: AvgResolutionTimeProps) {
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
              {entry.name}: {entry.value.toFixed(1)}h
            </p>
          ))}
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
        <YAxis stroke="#6b7280" label={{ value: "Horas", angle: -90, position: "insideLeft" }} />
        <Tooltip content={customTooltip} />
        <Legend />
        <Bar dataKey="tmr" fill={CHART_COLORS.blue} name="TMR Real" radius={[8, 8, 0, 0]} />
        <Bar dataKey="meta" fill={CHART_COLORS.gray} name="Meta" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
