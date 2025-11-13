import { useMemo } from "react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { CHART_COLORS, TOOLTIP_CONFIG } from "./ChartConfig";

interface SkillsData {
  skill: string;
  value: number;
}

interface RadarSkillsProps {
  data: SkillsData[];
  height?: number;
}

export function RadarSkillsChart({ data, height = 300 }: RadarSkillsProps) {
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
          <p className="text-xs font-semibold">{payload[0].payload.skill}</p>
          <p className="text-xs text-blue-300">{payload[0].value.toFixed(1)}/100</p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={data}>
        <PolarGrid stroke="#e5e7eb" />
        <PolarAngleAxis dataKey="skill" stroke="#6b7280" />
        <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#6b7280" />
        <Radar name="Competência" dataKey="value" stroke={CHART_COLORS.blue} fill={CHART_COLORS.blue} fillOpacity={0.6} />
        <Tooltip content={customTooltip} />
        <Legend />
      </RadarChart>
    </ResponsiveContainer>
  );
}
