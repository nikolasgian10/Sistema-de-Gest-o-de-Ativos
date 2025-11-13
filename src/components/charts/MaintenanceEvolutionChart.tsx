import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { CHART_COLORS, TOOLTIP_CONFIG } from "./ChartConfig";

interface MaintenanceEvolutionData {
  week: string;
  concluidas: number;
  pendentes: number;
}

interface MaintenanceEvolutionProps {
  data: MaintenanceEvolutionData[];
  height?: number;
}

export function MaintenanceEvolutionChart({ data, height = 300 }: MaintenanceEvolutionProps) {
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
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="week" stroke="#6b7280" />
        <YAxis stroke="#6b7280" />
        <Tooltip content={customTooltip} />
        <Legend />
        <Area
          type="monotone"
          dataKey="concluidas"
          stackId="1"
          stroke={CHART_COLORS.green}
          fill={CHART_COLORS.green}
          name="Concluídas"
        />
        <Area
          type="monotone"
          dataKey="pendentes"
          stackId="2"
          stroke={CHART_COLORS.orange}
          fill={CHART_COLORS.orange}
          fillOpacity={0.3}
          name="Pendentes"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
