import { useMemo } from "react";
import { CHART_COLORS } from "./ChartConfig";

interface GaugeHealthProps {
  value: number; // 0-100
  label?: string;
  height?: number;
}

const getHealthColor = (value: number): string => {
  if (value >= 80) return CHART_COLORS.green;
  if (value >= 50) return CHART_COLORS.orange;
  return CHART_COLORS.red;
};

const getHealthStatus = (value: number): string => {
  if (value >= 80) return "Saudável";
  if (value >= 50) return "Atenção";
  return "Crítico";
};

export function GaugeHealthChart({ value, label = "Índice de Saúde", height = 250 }: GaugeHealthProps) {
  const normalizedValue = Math.max(0, Math.min(100, value));
  const color = getHealthColor(normalizedValue);
  const status = getHealthStatus(normalizedValue);

  // SVG Gauge dimensions
  const size = 200;
  const radius = 80;
  const centerX = size / 2;
  const centerY = size / 2;

  // Draw arc from 180 to 0 degrees (semicircle)
  const startAngle = 180;
  const endAngle = 0;
  const angle = startAngle + ((normalizedValue / 100) * (endAngle - startAngle));
  const angleRad = (angle * Math.PI) / 180;

  const x = centerX + radius * Math.cos(angleRad);
  const y = centerY + radius * Math.sin(angleRad);

  // Scale values (0° = 0, 180° = 100)
  const scale1 = -90;
  const scale2 = 0;
  const scale3 = 90;
  const scale4 = 180;

  return (
    <div className="flex flex-col items-center gap-4">
      <h3 className="text-sm font-semibold text-gray-700">{label}</h3>

      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background arc (gray) */}
        <path
          d={`M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${centerX + radius} ${centerY}`}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="12"
          strokeLinecap="round"
        />

        {/* Green arc (0-50%) */}
        <path
          d={`M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${centerX} ${centerY + radius}`}
          fill="none"
          stroke={CHART_COLORS.green}
          strokeWidth="12"
          strokeLinecap="round"
        />

        {/* Orange arc (50-80%) */}
        <path
          d={`M ${centerX} ${centerY + radius} A ${radius} ${radius} 0 0 1 ${centerX + radius * 0.7} ${centerY + radius * 0.7}`}
          fill="none"
          stroke={CHART_COLORS.orange}
          strokeWidth="12"
          strokeLinecap="round"
        />

        {/* Red arc (80-100%) */}
        <path
          d={`M ${centerX + radius * 0.7} ${centerY + radius * 0.7} A ${radius} ${radius} 0 0 1 ${centerX + radius} ${centerY}`}
          fill="none"
          stroke={CHART_COLORS.red}
          strokeWidth="12"
          strokeLinecap="round"
        />

        {/* Needle */}
        <line x1={centerX} y1={centerY} x2={x} y2={y} stroke={color} strokeWidth="3" strokeLinecap="round" />

        {/* Center circle */}
        <circle cx={centerX} cy={centerY} r="8" fill={color} />

        {/* Scale labels */}
        <text x={centerX - radius - 15} y={centerY + 5} textAnchor="middle" className="text-xs font-semibold" fill="#6b7280">
          0%
        </text>
        <text x={centerX + radius + 15} y={centerY + 5} textAnchor="middle" className="text-xs font-semibold" fill="#6b7280">
          100%
        </text>

        {/* Value display */}
        <text
          x={centerX}
          y={centerY - 10}
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-2xl font-bold"
          fill={color}
        >
          {normalizedValue.toFixed(0)}%
        </text>
        <text
          x={centerX}
          y={centerY + 20}
          textAnchor="middle"
          className="text-xs font-semibold"
          fill={color}
        >
          {status}
        </text>
      </svg>

      {/* Legend */}
      <div className="flex gap-4 mt-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS.green }}></div>
          <span>≥80%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS.orange }}></div>
          <span>50-80%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS.red }}></div>
          <span>&lt;50%</span>
        </div>
      </div>
    </div>
  );
}
