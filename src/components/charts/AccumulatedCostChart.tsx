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
import { CHART_COLORS, formatCurrency, TOOLTIP_CONFIG } from "./ChartConfig";

interface AccumulatedCostData {
  mes: string;
  custo: number;
}

interface AccumulatedCostProps {
  data: AccumulatedCostData[];
  height?: number;
}

export function AccumulatedCostChart({ data, height = 300 }: AccumulatedCostProps) {
  const processedData = useMemo(() => {
    let accumulated = 0;
    return data.map((item) => {
      accumulated += item.custo;
      return {
        ...item,
        acumulado: accumulated,
      };
    });
  }, [data]);

  const customTooltip = (props: any) => {
    const { active, payload } = props;
    if (active && payload && payload.length) {
      const { mes, acumulado } = payload[0].payload;
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
          <p className="text-xs font-semibold">{mes}</p>
          <p className="text-xs text-purple-300">Total Acumulado: {formatCurrency(acumulado)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={processedData}>
        <defs>
          <linearGradient id="colorAccumulated" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={CHART_COLORS.purple} stopOpacity={0.8} />
            <stop offset="95%" stopColor={CHART_COLORS.purple} stopOpacity={0.1} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="mes" stroke="#6b7280" />
        <YAxis stroke="#6b7280" />
        <Tooltip content={customTooltip} />
        <Legend />
        <Area
          type="monotone"
          dataKey="acumulado"
          stroke={CHART_COLORS.purple}
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorAccumulated)"
          name="Custo Acumulado"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
