import { useMemo } from "react";
import { CHART_COLORS } from "./ChartConfig";

interface GanttTask {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  type: "preventiva" | "corretiva";
}

interface GanttTimelineProps {
  tasks: GanttTask[];
  height?: number;
}

const getTypeColor = (type: string): string => {
  return type === "preventiva" ? CHART_COLORS.green : CHART_COLORS.orange;
};

export function GanttTimelineChart({ tasks, height = 400 }: GanttTimelineProps) {
  const { minDate, maxDate, processedTasks } = useMemo(() => {
    if (tasks.length === 0) return { minDate: new Date(), maxDate: new Date(), processedTasks: [] };

    const dates = tasks.flatMap((t) => [t.startDate, t.endDate]);
    const min = new Date(Math.min(...dates.map((d) => d.getTime())));
    const max = new Date(Math.max(...dates.map((d) => d.getTime())));

    return {
      minDate: min,
      maxDate: max,
      processedTasks: tasks,
    };
  }, [tasks]);

  const dayRange = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
  const pixelsPerDay = 60 / Math.max(1, dayRange);
  const taskHeight = 30;
  const margin = { top: 60, right: 30, bottom: 30, left: 150 };

  const getTaskPosition = (date: Date) => {
    const days = (date.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24);
    return margin.left + days * pixelsPerDay;
  };

  const chartWidth = margin.left + dayRange * pixelsPerDay + margin.right;
  const chartHeight = margin.top + processedTasks.length * taskHeight + margin.bottom;

  return (
    <div className="w-full overflow-auto bg-white rounded-lg border">
      <svg width={chartWidth} height={chartHeight}>
        {/* Timeline header */}
        <g>
          <rect x="0" y="0" width={chartWidth} height={margin.top} fill="#f3f4f6" />
          <text x={margin.left / 2} y={margin.top / 2} textAnchor="middle" dominantBaseline="middle" className="text-xs font-bold" fill="#1f2937">
            Manutenção
          </text>
        </g>

        {/* Date labels on header */}
        {Array.from({ length: Math.min(dayRange + 1, 20) }).map((_, i) => {
          const date = new Date(minDate);
          date.setDate(date.getDate() + i);
          const x = margin.left + i * pixelsPerDay;
          return (
            <g key={`date-${i}`}>
              <text x={x} y={margin.top - 10} textAnchor="middle" className="text-xs fill-gray-600">
                {date.getDate()}
              </text>
              <line x1={x} y1={margin.top - 5} x2={x} y2={chartHeight} stroke="#e5e7eb" strokeWidth="1" strokeDasharray="2,2" />
            </g>
          );
        })}

        {/* Tasks */}
        {processedTasks.map((task, index) => {
          const y = margin.top + index * taskHeight;
          const startX = getTaskPosition(task.startDate);
          const endX = getTaskPosition(task.endDate);
          const width = Math.max(2, endX - startX);
          const color = getTypeColor(task.type);

          return (
            <g key={`task-${task.id}`}>
              {/* Task label */}
              <text x={margin.left - 10} y={y + taskHeight / 2} textAnchor="end" dominantBaseline="middle" className="text-xs font-semibold" fill="#1f2937">
                {task.name.substring(0, 20)}
              </text>

              {/* Task bar */}
              <rect x={startX} y={y + 5} width={width} height={20} fill={color} rx={3} opacity={0.8} className="hover:opacity-100 cursor-pointer" />

              {/* Task label on bar */}
              <text
                x={startX + width / 2}
                y={y + 15}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-xs font-semibold"
                fill="white"
                pointerEvents="none"
              >
                {task.type === "preventiva" ? "P" : "C"}
              </text>

              {/* Duration text */}
              <text x={startX + width / 2} y={y + 32} textAnchor="middle" className="text-xs fill-gray-600">
                {Math.ceil((task.endDate.getTime() - task.startDate.getTime()) / (1000 * 60 * 60 * 24))}d
              </text>
            </g>
          );
        })}

        {/* Legend */}
        <g>
          <rect x={margin.left} y={chartHeight - 25} width={15} height={15} fill={CHART_COLORS.green} rx={2} />
          <text x={margin.left + 20} y={chartHeight - 18} className="text-xs font-semibold" fill="#1f2937">
            Preventiva
          </text>

          <rect x={margin.left + 130} y={chartHeight - 25} width={15} height={15} fill={CHART_COLORS.orange} rx={2} />
          <text x={margin.left + 150} y={chartHeight - 18} className="text-xs font-semibold" fill="#1f2937">
            Corretiva
          </text>
        </g>
      </svg>
    </div>
  );
}
