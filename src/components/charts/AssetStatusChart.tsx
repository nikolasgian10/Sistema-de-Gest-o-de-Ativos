import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { CHART_COLORS, TOOLTIP_CONFIG } from "./ChartConfig";

interface AssetStatusData {
  status: string;
  value: number;
  color: string;
}

interface AssetStatusChartProps {
  data: AssetStatusData[];
  height?: number;
}

const statusColors = {
  operacional: CHART_COLORS.green,
  "em manutenção": CHART_COLORS.orange,
  quebrado: CHART_COLORS.red,
  inativo: CHART_COLORS.gray,
};

export function AssetStatusChart({ data, height = 300 }: AssetStatusChartProps) {
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
          <p className="text-xs">{value} ativos</p>
          <p className="text-xs text-gray-300">{percentage}%</p>
        </div>
      );
    }
    return null;
  };

  const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos((midAngle * Math.PI) / 180);
    const y = cy + radius * Math.sin((midAngle * Math.PI) / 180);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        className="text-xs font-bold"
      >
        {`${((data[0].value / total) * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderLabel}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color || statusColors[entry.status as keyof typeof statusColors]} />
          ))}
        </Pie>
        <Tooltip content={customTooltip} />
        <Legend
          formatter={(value, entry: any) => {
            const item = data.find((d) => d.status === value);
            const percentage = item ? ((item.value / total) * 100).toFixed(1) : 0;
            return `${value}: ${item?.value || 0} (${percentage}%)`;
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
