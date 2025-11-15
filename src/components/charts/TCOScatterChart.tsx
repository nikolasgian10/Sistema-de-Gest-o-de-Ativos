import { useMemo } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { CHART_COLORS, formatCurrency } from "./ChartConfig";

interface TCOData {
  name: string;
  idade: number;
  tco: number;
  status: "ok" | "critico";
}

interface TCOScatterProps {
  data: TCOData[];
  height?: number;
}

export function TCOScatterChart({ data, height = 300 }: TCOScatterProps) {
  const customTooltip = (props: any) => {
    const { active, payload } = props;
    if (active && payload && payload.length) {
      const item = payload[0].payload;
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
          <p className="text-sm font-semibold">{item.name}</p>
          <p className="text-xs">Idade: {item.idade} anos</p>
          <p className="text-xs">TCO: {formatCurrency(item.tco)}</p>
          <p className="text-xs text-gray-300">Status: {item.status === "ok" ? "OK" : "CRÍTICO"}</p>
        </div>
      );
    }
    return null;
  };

  const dataOk = useMemo(() => data.filter((d) => d.status === "ok"), [data]);
  const dataCritico = useMemo(() => data.filter((d) => d.status === "critico"), [data]);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="idade" name="Idade (anos)" stroke="#6b7280" label={{ value: "Idade (anos)", position: "insideBottomRight", offset: -10 }} />
        <YAxis dataKey="tco" name="TCO (R$)" stroke="#6b7280" label={{ value: "TCO (R$)", angle: -90, position: "insideLeft" }} />
        <Tooltip content={customTooltip} />
        <Legend />
        <Scatter name="Saudável (OK)" data={dataOk} fill={CHART_COLORS.green} />
        <Scatter name="Crítico (Substituir)" data={dataCritico} fill={CHART_COLORS.red} />
      </ScatterChart>
    </ResponsiveContainer>
  );
}
