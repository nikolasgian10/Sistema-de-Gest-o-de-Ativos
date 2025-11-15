import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, Download, TrendingUp, DollarSign, Package } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CostEvolutionChart } from "@/components/charts/CostEvolutionChart";
import { CostDistributionChart } from "@/components/charts/CostDistributionChart";
import { TCOScatterChart } from "@/components/charts/TCOScatterChart";
import { CostByTypeChart } from "@/components/charts/CostByTypeChart";

interface ReportData {
  totalCost: number;
  avgCostPerAsset: number;
  totalMaintenances: number;
  avgMaintenanceTime: number;
  costByType: Record<string, number>;
  costByMonth: Record<string, number>;
}

export default function Reports() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      // Fetch work orders with costs
      const { data: orders, error } = await supabase
        .from("work_orders")
        .select("cost, order_type, completed_date, created_at")
        .not("cost", "is", null);

      if (error) throw error;

      const totalCost = orders?.reduce((sum, order) => sum + (Number(order.cost) || 0), 0) || 0;
      
      // Group by type
      const costByType: Record<string, number> = {};
      orders?.forEach((order) => {
        const type = order.order_type || "outros";
        costByType[type] = (costByType[type] || 0) + (Number(order.cost) || 0);
      });

      // Fetch total assets
      const { count: totalAssets } = await supabase
        .from("assets")
        .select("*", { count: "exact", head: true });

      const avgCostPerAsset = totalAssets ? totalCost / totalAssets : 0;

      setReportData({
        totalCost,
        avgCostPerAsset,
        totalMaintenances: orders?.length || 0,
        avgMaintenanceTime: 0,
        costByType,
        costByMonth: {},
      });
    } catch (error) {
      console.error("Error fetching report data:", error);
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = () => {
    // Implementation for PDF export
    console.log("Exporting to PDF...");
  };

  const exportToCSV = () => {
    // Implementation for CSV export
    console.log("Exporting to CSV...");
  };

  // Mock data for charts
  const costEvolutionData = useMemo(
    () => [
      { month: "Jan", pecas: 1200, maoDeObra: 2500 },
      { month: "Fev", pecas: 1500, maoDeObra: 2800 },
      { month: "Mar", pecas: 980, maoDeObra: 2100 },
      { month: "Abr", pecas: 2100, maoDeObra: 3200 },
      { month: "Mai", pecas: 1800, maoDeObra: 2900 },
      { month: "Jun", pecas: 1600, maoDeObra: 2700 },
    ],
    []
  );

  const costDistributionData = useMemo(
    () => [
      { name: "Peças", value: 12000 },
      { name: "Mão de Obra", value: 18500 },
      { name: "Outros", value: 3200 },
    ],
    []
  );

  const tcoScatterData = useMemo(
    () => [
      { name: "Ativo 1", idade: 2, tco: 5000, status: "ok" },
      { name: "Ativo 2", idade: 5, tco: 12000, status: "ok" },
      { name: "Ativo 3", idade: 8, tco: 25000, status: "critico" },
      { name: "Ativo 4", idade: 3, tco: 7000, status: "ok" },
      { name: "Ativo 5", idade: 10, tco: 45000, status: "critico" },
      { name: "Ativo 6", idade: 1, tco: 1500, status: "ok" },
    ],
    []
  );

  const costByTypeData = useMemo(
    () => [
      { type: "Preventiva", custo: 8500 },
      { type: "Corretiva", custo: 14200 },
      { type: "Preditiva", custo: 3800 },
    ],
    []
  );

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Relatórios Financeiros</h1>
            <p className="text-muted-foreground mt-1">
              Análise TCO e desempenho financeiro
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
            <Button className="bg-gradient-to-r from-primary to-primary-glow" onClick={exportToPDF}>
              <Download className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-[100px]" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-[80px]" />
                </CardContent>
              </Card>
            ))
          ) : (
            <>
              <Card className="relative overflow-hidden group hover:shadow-lg transition-shadow">
                <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary-glow opacity-5 group-hover:opacity-10 transition-opacity" />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Custo Total</CardTitle>
                  <div className="p-2 rounded-md bg-gradient-to-br from-primary to-primary-glow">
                    <DollarSign className="h-4 w-4 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    R$ {reportData?.totalCost.toFixed(2) || "0.00"}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Total acumulado</p>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden group hover:shadow-lg transition-shadow">
                <div className="absolute inset-0 bg-gradient-to-br from-accent to-green-500 opacity-5 group-hover:opacity-10 transition-opacity" />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Custo/Ativo</CardTitle>
                  <div className="p-2 rounded-md bg-gradient-to-br from-accent to-green-500">
                    <Package className="h-4 w-4 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    R$ {reportData?.avgCostPerAsset.toFixed(2) || "0.00"}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Média por equipamento</p>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden group hover:shadow-lg transition-shadow">
                <div className="absolute inset-0 bg-gradient-to-br from-warning to-orange-500 opacity-5 group-hover:opacity-10 transition-opacity" />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Manutenções</CardTitle>
                  <div className="p-2 rounded-md bg-gradient-to-br from-warning to-orange-500">
                    <BarChart3 className="h-4 w-4 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{reportData?.totalMaintenances || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">Serviços realizados</p>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden group hover:shadow-lg transition-shadow">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 opacity-5 group-hover:opacity-10 transition-opacity" />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">TCO Médio</CardTitle>
                  <div className="p-2 rounded-md bg-gradient-to-br from-blue-500 to-cyan-500">
                    <TrendingUp className="h-4 w-4 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    R$ {reportData?.avgCostPerAsset.toFixed(2) || "0.00"}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Total Cost of Ownership</p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        <Tabs defaultValue="costs" className="space-y-4">
          <TabsList>
            <TabsTrigger value="costs">Análise de Custos</TabsTrigger>
            <TabsTrigger value="performance">Desempenho</TabsTrigger>
            <TabsTrigger value="tco">Análise TCO</TabsTrigger>
          </TabsList>

          <TabsContent value="costs" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Evolução de Custos Mensais</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Skeleton className="h-64 w-full" />
                  ) : (
                    <CostEvolutionChart data={costEvolutionData} height={300} />
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Distribuição de Custos</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center">
                  {loading ? (
                    <Skeleton className="h-64 w-full" />
                  ) : (
                    <CostDistributionChart data={costDistributionData} height={300} />
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Custos por Tipo de Manutenção</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-64 w-full" />
                ) : (
                  <CostByTypeChart data={costByTypeData} height={300} />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recomendações</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-4 bg-accent/20 rounded-lg">
                    <p className="text-sm font-medium mb-1">Otimização de Custos</p>
                    <p className="text-xs text-muted-foreground">
                      Considere revisar contratos de manutenção preventiva para reduzir custos operacionais
                    </p>
                  </div>
                  <div className="p-4 bg-accent/20 rounded-lg">
                    <p className="text-sm font-medium mb-1">Eficiência Energética</p>
                    <p className="text-xs text-muted-foreground">
                      Ativos com mais de 10 anos podem ter TCO elevado. Avalie possível substituição
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Dashboard de Desempenho</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Visualização de métricas de desempenho dos técnicos e equipamentos
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tco" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Análise TCO (Total Cost of Ownership)</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-96 w-full" />
                ) : (
                  <TCOScatterChart data={tcoScatterData} height={350} />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Guia de Interpretação TCO</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="p-3 bg-green-50 rounded border border-green-200">
                    <p className="font-semibold text-green-900">Status OK (Verde)</p>
                    <p className="text-green-800">Ativo saudável com TCO controlado. Manutenção conforme cronograma.</p>
                  </div>
                  <div className="p-3 bg-red-50 rounded border border-red-200">
                    <p className="font-semibold text-red-900">Crítico - Substituir (Vermelho)</p>
                    <p className="text-red-800">Alto custo de manutenção. Recomenda-se substituição do equipamento.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
