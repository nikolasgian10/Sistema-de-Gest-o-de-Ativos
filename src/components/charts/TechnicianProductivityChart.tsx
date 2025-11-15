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

interface TechnicianProductivityData {
  month: string;
  [key: string]: string | number;
}

interface TechnicianProductivityProps {
  data: TechnicianProductivityData[];
  technicians: string[];
  height?: number;
}

const colors = [CHART_COLORS.green, CHART_COLORS.blue, CHART_COLORS.orange];

export function TechnicianProductivityChart({
  data,
  technicians,
  height = 300,
}: TechnicianProductivityProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="month" stroke="#6b7280" />
        <YAxis stroke="#6b7280" label={{ value: "OSs Concluídas", angle: -90, position: "insideLeft" }} />
        <Tooltip {...TOOLTIP_CONFIG} />
        <Legend />
        {technicians.map((tech, index) => (
          <Line
            key={tech}
            type="monotone"
            dataKey={tech}
            stroke={colors[index % colors.length]}
            strokeWidth={2}
            name={tech}
            dot={{ r: 4 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
