import { useMemo } from "react";
import { CHART_COLORS } from "./ChartConfig";

interface HeatmapData {
  dia: string;
  tecnico: string;
  horas: number;
}

interface HeatmapAvailabilityProps {
  data: HeatmapData[];
  height?: number;
}

const getColorByHours = (hours: number): string => {
  if (hours >= 8) return CHART_COLORS.green;
  if (hours >= 4) return CHART_COLORS.blue;
  if (hours > 0) return CHART_COLORS.orange;
  return CHART_COLORS.gray;
};

const getTechnicians = (data: HeatmapData[]): string[] => [...new Set(data.map((d) => d.tecnico))];
const getDays = (data: HeatmapData[]): string[] => [...new Set(data.map((d) => d.dia))];

export function HeatmapAvailabilityChart({ data, height = 300 }: HeatmapAvailabilityProps) {
  const technicians = useMemo(() => getTechnicians(data), [data]);
  const days = useMemo(() => getDays(data), [data]);

  const cellSize = 60;
  const labelWidth = 120;
  const cellHeight = 40;

  return (
    <div className="w-full overflow-auto">
      <svg width={labelWidth + days.length * cellSize + 40} height={technicians.length * cellHeight + 60}>
        {/* Title */}
        <text x={labelWidth} y={20} className="text-sm font-bold" fill="#1f2937">
          Horas Trabalhadas
        </text>

        {/* Day headers */}
        {days.map((day, i) => (
          <g key={`day-${i}`}>
            <text
              x={labelWidth + i * cellSize + cellSize / 2}
              y={40}
              textAnchor="middle"
              className="text-xs font-semibold"
              fill="#6b7280"
            >
              {day}
            </text>
          </g>
        ))}

        {/* Heatmap cells */}
        {technicians.map((tech, techIndex) => (
          <g key={`tech-${techIndex}`}>
            {/* Technician label */}
            <text
              x={5}
              y={60 + techIndex * cellHeight + cellHeight / 2}
              textAnchor="start"
              dominantBaseline="middle"
              className="text-xs font-semibold"
              fill="#1f2937"
            >
              {tech.substring(0, 12)}
            </text>

            {/* Cells */}
            {days.map((day, dayIndex) => {
              const cellData = data.find((d) => d.dia === day && d.tecnico === tech);
              const hours = cellData?.horas || 0;
              const color = getColorByHours(hours);

              return (
                <g key={`cell-${techIndex}-${dayIndex}`}>
                  <rect
                    x={labelWidth + dayIndex * cellSize}
                    y={60 + techIndex * cellHeight}
                    width={cellSize - 2}
                    height={cellHeight - 2}
                    fill={color}
                    opacity={0.8}
                    rx={4}
                    className="hover:opacity-100 cursor-pointer"
                  />
                  <text
                    x={labelWidth + dayIndex * cellSize + cellSize / 2}
                    y={60 + techIndex * cellHeight + cellHeight / 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-xs font-bold"
                    fill="white"
                  >
                    {hours}h
                  </text>
                </g>
              );
            })}
          </g>
        ))}

        {/* Legend */}
        <g>
          <text x={labelWidth} y={technicians.length * cellHeight + 60 + 20} className="text-xs font-semibold" fill="#1f2937">
            Legenda:
          </text>
          <rect x={labelWidth + 65} y={technicians.length * cellHeight + 60 + 10} width={12} height={12} fill={CHART_COLORS.green} rx={2} />
          <text x={labelWidth + 80} y={technicians.length * cellHeight + 60 + 18} className="text-xs" fill="#1f2937">
            8h+
          </text>
          <rect x={labelWidth + 115} y={technicians.length * cellHeight + 60 + 10} width={12} height={12} fill={CHART_COLORS.blue} rx={2} />
          <text x={labelWidth + 130} y={technicians.length * cellHeight + 60 + 18} className="text-xs" fill="#1f2937">
            4-8h
          </text>
          <rect x={labelWidth + 170} y={technicians.length * cellHeight + 60 + 10} width={12} height={12} fill={CHART_COLORS.orange} rx={2} />
          <text x={labelWidth + 185} y={technicians.length * cellHeight + 60 + 18} className="text-xs" fill="#1f2937">
            &lt;4h
          </text>
        </g>
      </svg>
    </div>
  );
}
