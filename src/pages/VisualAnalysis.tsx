import { useEffect, useMemo, useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

// Charts
import { MaintenanceTrendChart } from "@/components/charts/MaintenanceTrendChart";
import { ProgressByLocationChart } from "@/components/charts/ProgressByLocationChart";
import { MaintenanceEvolutionChart } from "@/components/charts/MaintenanceEvolutionChart";
import { TechnicianProductivityChart } from "@/components/charts/TechnicianProductivityChart";
import { RadarSkillsChart } from "@/components/charts/RadarSkillsChart";
import { HeatmapAvailabilityChart } from "@/components/charts/HeatmapAvailabilityChart";
import { GanttTimelineChart } from "@/components/charts/GanttTimelineChart";
import { GaugeHealthChart } from "@/components/charts/GaugeHealthChart";
import { AccumulatedCostChart } from "@/components/charts/AccumulatedCostChart";
import { MaintenanceFrequencyChart } from "@/components/charts/MaintenanceFrequencyChart";
import { OSStatusFunnelChart } from "@/components/charts/OSStatusFunnelChart";
import { AvgResolutionTimeChart } from "@/components/charts/AvgResolutionTimeChart";
import { CorrectiveByAreaChart } from "@/components/charts/CorrectiveByAreaChart";

export default function VisualAnalysis() {
  const [loading, setLoading] = useState(true);
  const [selectedTechnician, setSelectedTechnician] = useState<string>("Tech 1");
  const [selectedAsset, setSelectedAsset] = useState<string>("Asset 1");
  const [technicians, setTechnicians] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch technicians list
      const { data: techs } = await supabase
        .from("work_orders")
        .select("assigned_to")
        .not("assigned_to", "is", null)
        .limit(3);

      const techList = techs?.map((t) => t.assigned_to).filter(Boolean) || ["Tech 1", "Tech 2", "Tech 3"];
      setTechnicians([...new Set(techList)]);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    }
  };

  // Mock data for charts
  const maintenanceTrendData = useMemo(
    () => [
      { month: "Jan", preventivas: 12, corretivas: 8 },
      { month: "Fev", preventivas: 15, corretivas: 10 },
      { month: "Mar", preventivas: 14, corretivas: 12 },
      { month: "Abr", preventivas: 18, corretivas: 9 },
      { month: "Mai", preventivas: 16, corretivas: 11 },
      { month: "Jun", preventivas: 20, corretivas: 7 },
    ],
    []
  );

  const progressByLocationData = useMemo(
    () => [
      { location: "Setor A", percentage: 92 },
      { location: "Setor B", percentage: 85 },
      { location: "Setor C", percentage: 78 },
      { location: "Setor D", percentage: 65 },
      { location: "Setor E", percentage: 45 },
    ],
    []
  );

  const maintenanceEvolutionData = useMemo(
    () => [
      { week: "Sem 1", concluidas: 15, pendentes: 5 },
      { week: "Sem 2", concluidas: 18, pendentes: 3 },
      { week: "Sem 3", concluidas: 12, pendentes: 8 },
      { week: "Sem 4", concluidas: 20, pendentes: 2 },
    ],
    []
  );

  const technicianProductivityData = useMemo(
    () => [
      { month: "Jan", "Tech 1": 12, "Tech 2": 10, "Tech 3": 8 },
      { month: "Fev", "Tech 1": 14, "Tech 2": 11, "Tech 3": 9 },
      { month: "Mar", "Tech 1": 15, "Tech 2": 13, "Tech 3": 10 },
      { month: "Abr", "Tech 1": 18, "Tech 2": 14, "Tech 3": 11 },
      { month: "Mai", "Tech 1": 16, "Tech 2": 15, "Tech 3": 12 },
      { month: "Jun", "Tech 1": 20, "Tech 2": 16, "Tech 3": 13 },
    ],
    []
  );

  const skillsData = useMemo(
    () => [
      { skill: "Preventivas", value: 85 },
      { skill: "Corretivas", value: 78 },
      { skill: "Velocidade", value: 88 },
      { skill: "Qualidade", value: 92 },
      { skill: "Segurança", value: 90 },
    ],
    []
  );

  const heatmapData = useMemo(
    () => [
      { dia: "Seg", tecnico: "Tech 1", horas: 8 },
      { dia: "Seg", tecnico: "Tech 2", horas: 6 },
      { dia: "Seg", tecnico: "Tech 3", horas: 2 },
      { dia: "Ter", tecnico: "Tech 1", horas: 8 },
      { dia: "Ter", tecnico: "Tech 2", horas: 8 },
      { dia: "Ter", tecnico: "Tech 3", horas: 5 },
      { dia: "Qua", tecnico: "Tech 1", horas: 7 },
      { dia: "Qua", tecnico: "Tech 2", horas: 4 },
      { dia: "Qua", tecnico: "Tech 3", horas: 8 },
    ],
    []
  );

  const ganttTasks = useMemo(
    () => [
      {
        id: "1",
        name: "Manutenção preventiva",
        startDate: new Date(2025, 0, 1),
        endDate: new Date(2025, 0, 5),
        type: "preventiva" as const,
      },
      {
        id: "2",
        name: "Reparo de falha",
        startDate: new Date(2025, 0, 6),
        endDate: new Date(2025, 0, 8),
        type: "corretiva" as const,
      },
      {
        id: "3",
        name: "Substituição de peça",
        startDate: new Date(2025, 0, 10),
        endDate: new Date(2025, 0, 12),
        type: "preventiva" as const,
      },
    ],
    []
  );

  const assetHealthValue = useMemo(() => 75, []);

  const accumulatedCostData = useMemo(
    () => [
      { mes: "Jan", custo: 1200 },
      { mes: "Fev", custo: 1500 },
      { mes: "Mar", custo: 980 },
      { mes: "Abr", custo: 2100 },
      { mes: "Mai", custo: 1800 },
      { mes: "Jun", custo: 1600 },
    ],
    []
  );

  const maintenanceFrequencyData = useMemo(
    () => [
      { tipoOuFalha: "Coreia de correia", quantidade: 12 },
      { tipoOuFalha: "Óleo vazando", quantidade: 10 },
      { tipoOuFalha: "Superaquecimento", quantidade: 8 },
      { tipoOuFalha: "Vibração excessiva", quantidade: 6 },
      { tipoOuFalha: "Ruído anormal", quantidade: 4 },
    ],
    []
  );

  const osStatusData = useMemo(
    () => [
      { status: "Abertas", quantidade: 15, color: "#f97316" },
      { status: "Em Andamento", quantidade: 8, color: "#3b82f6" },
      { status: "Concluídas", quantidade: 42, color: "#22c55e" },
      { status: "Canceladas", quantidade: 2, color: "#ef4444" },
    ],
    []
  );

  const avgResolutionTimeData = useMemo(
    () => [
      { type: "Preventiva", tmr: 4.5, meta: 4 },
      { type: "Corretiva", tmr: 6.8, meta: 8 },
    ],
    []
  );

  const correctiveByAreaData = useMemo(
    () => [
      { setor: "Setor A", preventiva: 25, corretiva: 8 },
      { setor: "Setor B", preventiva: 18, corretiva: 12 },
      { setor: "Setor C", preventiva: 20, corretiva: 15 },
      { setor: "Setor D", preventiva: 12, corretiva: 18 },
      { setor: "Setor E", preventiva: 15, corretiva: 20 },
      { setor: "Setor F", preventiva: 10, corretiva: 16 },
      { setor: "Setor G", preventiva: 8, corretiva: 14 },
      { setor: "Setor H", preventiva: 14, corretiva: 11 },
    ],
    []
  );

  if (loading) {
    return (
      <Layout>
        <div className="p-8">
          <div className="text-center">Carregando análises visuais...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Análise Visual</h1>
          <p className="text-muted-foreground">Consolidação de toda a análise visual e comparativa do sistema</p>
        </div>

        <Tabs defaultValue="planejamento" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="planejamento">Planejamento</TabsTrigger>
            <TabsTrigger value="desempenho">Desempenho</TabsTrigger>
            <TabsTrigger value="historico">Histórico do Ativo</TabsTrigger>
            <TabsTrigger value="oss">Ordens de Serviço</TabsTrigger>
          </TabsList>

          {/* PLANEJAMENTO */}
          <TabsContent value="planejamento" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Progresso por Local</CardTitle>
              </CardHeader>
              <CardContent>
                <ProgressByLocationChart data={progressByLocationData} height={300} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Evolução de Manutenções por Semana</CardTitle>
              </CardHeader>
              <CardContent>
                <MaintenanceEvolutionChart data={maintenanceEvolutionData} height={300} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* DESEMPENHO TÉCNICOS */}
          <TabsContent value="desempenho" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Produtividade Mensal - Top 3 Técnicos</CardTitle>
              </CardHeader>
              <CardContent>
                <TechnicianProductivityChart
                  data={technicianProductivityData}
                  technicians={technicians.slice(0, 3)}
                  height={300}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Perfil de Habilidades - {selectedTechnician}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <RadarSkillsChart data={skillsData} height={300} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Disponibilidade e Horas Trabalhadas</CardTitle>
              </CardHeader>
              <CardContent>
                <HeatmapAvailabilityChart data={heatmapData} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* HISTÓRICO DO ATIVO */}
          <TabsContent value="historico" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Timeline de Manutenções - {selectedAsset}</CardTitle>
              </CardHeader>
              <CardContent>
                <GanttTimelineChart tasks={ganttTasks} height={300} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Índice de Saúde do Ativo</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center py-6">
                <GaugeHealthChart value={assetHealthValue} label={`Saúde: ${selectedAsset}`} height={250} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Custos Acumulados</CardTitle>
              </CardHeader>
              <CardContent>
                <AccumulatedCostChart data={accumulatedCostData} height={300} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Frequência de Manutenções</CardTitle>
              </CardHeader>
              <CardContent>
                <MaintenanceFrequencyChart data={maintenanceFrequencyData} height={300} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* ORDENS DE SERVIÇO */}
          <TabsContent value="oss" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Funil de Status das OSs</CardTitle>
              </CardHeader>
              <CardContent>
                <OSStatusFunnelChart data={osStatusData} height={300} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tempo Médio de Resolução vs Meta</CardTitle>
              </CardHeader>
              <CardContent>
                <AvgResolutionTimeChart data={avgResolutionTimeData} height={300} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>8 Setores Mais Problemáticos (Corretivas vs Preventivas)</CardTitle>
              </CardHeader>
              <CardContent>
                <CorrectiveByAreaChart data={correctiveByAreaData} height={400} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
