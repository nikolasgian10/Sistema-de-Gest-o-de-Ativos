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
import { CHART_COLORS, TOOLTIP_CONFIG } from "./ChartConfig";

interface MaintenanceTrendData {
  month: string;
  preventivas: number;
  corretivas: number;
}

interface MaintenanceTrendProps {
  data: MaintenanceTrendData[];
  height?: number;
}

export function MaintenanceTrendChart({ data, height = 300 }: MaintenanceTrendProps) {
  const processedData = useMemo(() => {
    return data.map((item) => ({
      ...item,
      total: item.preventivas + item.corretivas,
    }));
  }, [data]);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={processedData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="month" stroke="#6b7280" />
        <YAxis stroke="#6b7280" />
        <Tooltip {...TOOLTIP_CONFIG} />
        <Legend />
        <Line
          type="monotone"
          dataKey="preventivas"
          stroke={CHART_COLORS.green}
          strokeWidth={2}
          name="Preventivas"
          dot={{ fill: CHART_COLORS.green, r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="corretivas"
          stroke={CHART_COLORS.orange}
          strokeWidth={2}
          name="Corretivas"
          dot={{ fill: CHART_COLORS.orange, r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="total"
          stroke={CHART_COLORS.blue}
          strokeWidth={2}
          strokeDasharray="5 5"
          name="Total"
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
