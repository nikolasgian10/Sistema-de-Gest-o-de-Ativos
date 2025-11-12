import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CheckCircle, Clock, TrendingUp } from "lucide-react";

export default function Performance() {
  // sample numbers for KPI placeholders
  const totalTechs = 12;
  const closedOs = 342;
  const avgOsPerTech = (closedOs / totalTechs).toFixed(1);
  const totalHours = 1284;

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
              <p className="text-sm text-muted-foreground">Gráfico de barras (placeholder) — implemente com Recharts conforme documentação.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Distribuição de Tipos de OS</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Gráfico (placeholder) — pizza/rosca com cores verde/laranja.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
