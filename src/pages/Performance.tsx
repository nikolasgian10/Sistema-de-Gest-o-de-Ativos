import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CheckCircle, Clock, TrendingUp } from "lucide-react";
import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { CHART_COLORS, TOOLTIP_CONFIG } from "@/components/charts/ChartConfig";

export default function Performance() {
  // sample numbers for KPI placeholders
  const totalTechs = 12;
  const closedOs = 342;
  const avgOsPerTech = (closedOs / totalTechs).toFixed(1);
  const totalHours = 1284;

  // Mock data - Top 5 Técnicos
  const topTechniciansData = useMemo(
    () => [
      { name: "João Silva", oss: 45, horas: 180 },
      { name: "Maria Santos", oss: 42, horas: 168 },
      { name: "Pedro Oliveira", oss: 38, horas: 152 },
      { name: "Ana Costa", oss: 35, horas: 140 },
      { name: "Carlos Ferreira", oss: 32, horas: 128 },
    ],
    []
  );

  // Mock data - Distribuição de Tipos de OS
  const osDistributionData = useMemo(
    () => [
      { name: "Preventiva", value: 180, color: CHART_COLORS.green },
      { name: "Corretiva", value: 125, color: CHART_COLORS.orange },
      { name: "Preditiva", value: 37, color: CHART_COLORS.blue },
    ],
    []
  );

  // Mock data - Produtividade por Mês
  const productivityData = useMemo(
    () => [
      { month: "Janeiro", "João Silva": 38, "Maria Santos": 35, "Pedro Oliveira": 32 },
      { month: "Fevereiro", "João Silva": 42, "Maria Santos": 40, "Pedro Oliveira": 36 },
      { month: "Março", "João Silva": 45, "Maria Santos": 42, "Pedro Oliveira": 38 },
      { month: "Abril", "João Silva": 43, "Maria Santos": 41, "Pedro Oliveira": 37 },
      { month: "Maio", "João Silva": 46, "Maria Santos": 43, "Pedro Oliveira": 39 },
      { month: "Junho", "João Silva": 45, "Maria Santos": 42, "Pedro Oliveira": 38 },
    ],
    []
  );

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">Desempenho Técnicos</h1>
          <p className="text-sm text-slate-600 mt-1">Ranking, KPIs e gráficos de produtividade</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-blue-600 font-medium mb-1">Total Técnicos</p>
                  <p className="text-2xl font-bold text-slate-900">{totalTechs}</p>
                </div>
                <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 flex-shrink-0">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-green-600 font-medium mb-1">OSs Concluídas</p>
                  <p className="text-2xl font-bold text-slate-900">{closedOs}</p>
                </div>
                <div className="p-3 rounded-2xl bg-gradient-to-br from-green-50 to-green-100 flex-shrink-0">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-purple-600 font-medium mb-1">Média OS/Técnico</p>
                  <p className="text-2xl font-bold text-slate-900">{avgOsPerTech}</p>
                </div>
                <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 flex-shrink-0">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-orange-600 font-medium mb-1">Total Horas</p>
                  <p className="text-2xl font-bold text-slate-900">{totalHours}</p>
                </div>
                <div className="p-3 rounded-2xl bg-gradient-to-br from-orange-50 to-orange-100 flex-shrink-0">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Top 5 Técnicos</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topTechniciansData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip {...TOOLTIP_CONFIG} />
                  <Legend />
                  <Bar dataKey="oss" fill={CHART_COLORS.green} name="OSs Concluídas" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="horas" fill={CHART_COLORS.blue} name="Horas Trabalhadas" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Distribuição de Tipos de OS</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={osDistributionData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {osDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip {...TOOLTIP_CONFIG} formatter={(value) => `${value} OSs`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Produtividade Mensal - Top 3 Técnicos</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={productivityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" label={{ value: "OSs Concluídas", angle: -90, position: "insideLeft" }} />
                <Tooltip {...TOOLTIP_CONFIG} />
                <Legend />
                <Bar dataKey="João Silva" fill={CHART_COLORS.green} radius={[8, 8, 0, 0]} />
                <Bar dataKey="Maria Santos" fill={CHART_COLORS.blue} radius={[8, 8, 0, 0]} />
                <Bar dataKey="Pedro Oliveira" fill={CHART_COLORS.orange} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
