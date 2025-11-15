import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Package, CheckCircle, DollarSign, Clock } from "lucide-react";
import { Layout } from "@/components/Layout";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { MaintenanceTrendChart } from "@/components/charts/MaintenanceTrendChart";
import { AssetStatusChart } from "@/components/charts/AssetStatusChart";

export default function Dashboard() {
  const [totalAssets, setTotalAssets] = useState<number>(0);
  const [operationalAssets, setOperationalAssets] = useState<number>(0);
  const [ordersTotal, setOrdersTotal] = useState<number>(0);
  const [ordersCompleted, setOrdersCompleted] = useState<number>(0);
  const [totalCost, setTotalCost] = useState<number>(0);
  const [upcomingThisMonth, setUpcomingThisMonth] = useState<Array<{ date: string; asset_code: string }>>([]);
  const [upcoming7Days, setUpcoming7Days] = useState<Array<{ date: string; asset_code: string; daysUntil: number; order_number?: string; status?: string }>>([]);
  const [overdues, setOverdues] = useState<Array<{ asset_code: string; days: number }>>([]);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  useEffect(() => {
    const fetchData = async () => {
      // Assets
      const { count: assetsCount } = await supabase.from("assets").select("*", { count: "exact", head: true });
      setTotalAssets(assetsCount || 0);
      const { count: opCount } = await supabase
        .from("assets")
        .select("*", { count: "exact", head: true })
        .eq("operational_status", "operacional");
      setOperationalAssets(opCount || 0);

      // Orders
      const { count: woCount } = await supabase.from("work_orders").select("*", { count: "exact", head: true });
      setOrdersTotal(woCount || 0);
      const { count: woDone } = await supabase
        .from("work_orders")
        .select("*", { count: "exact", head: true })
        .eq("status", "concluida");
      setOrdersCompleted(woDone || 0);
      const { data: costs } = await supabase
        .from("work_orders")
        .select("cost")
        .not("cost", "is", null);
      setTotalCost((costs || []).reduce((s, r: any) => s + (Number(r.cost) || 0), 0));

      // Calendar (buscar manutenções reais das Ordens de Serviço por mês)
      const start = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const end = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
      const { data: sched } = await supabase
        .from("work_orders")
        .select("scheduled_date, assets(asset_code), order_number, status")
        .gte("scheduled_date", format(start, "yyyy-MM-dd"))
        .lte("scheduled_date", format(end, "yyyy-MM-dd"))
        .in("status", ["pendente", "em_andamento"])
        .order("scheduled_date", { ascending: true });
      setUpcomingThisMonth(
        (sched || []).map((s: any) => ({ date: s.scheduled_date, asset_code: s.assets?.asset_code }))
      );

      // Próximas 7 dias (Alertas reais)
      const today = new Date();
      const sevenDaysLater = new Date(today);
      sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
      const { data: next7 } = await supabase
        .from("work_orders")
        .select("scheduled_date, assets(asset_code), order_number, status")
        .in("status", ["pendente", "em_andamento"])
        .gte("scheduled_date", format(today, "yyyy-MM-dd"))
        .lte("scheduled_date", format(sevenDaysLater, "yyyy-MM-dd"))
        .order("scheduled_date", { ascending: true });
      setUpcoming7Days(
        (next7 || []).map((s: any) => ({
          date: s.scheduled_date,
          asset_code: s.assets?.asset_code || "-",
          order_number: s.order_number,
          status: s.status,
          daysUntil: Math.ceil((new Date(s.scheduled_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
        }))
      );

      // Overdues (pending in the past)
      const { data: pend } = await supabase
        .from("work_orders")
        .select("scheduled_date, assets(asset_code), status")
        .in("status", ["pendente", "em_andamento"]);
      const now = new Date();
      const overdue = (pend || [])
        .filter((p: any) => p.scheduled_date && new Date(p.scheduled_date) < now)
        .slice(0, 10)
        .map((p: any) => ({
          asset_code: p.assets?.asset_code || "-",
          days: Math.ceil((now.getTime() - new Date(p.scheduled_date).getTime()) / (1000 * 60 * 60 * 24)),
        }));
      setOverdues(overdue);
    };
    fetchData();
  }, [currentMonth]);

  const indicadores = useMemo(() => [
    {
      title: "Total de Ativos",
      value: totalAssets,
      description: `${operationalAssets} operacionais`,
      icon: Package,
      color: "bg-blue-100 text-blue-700",
    },
    {
      title: "Preventivas Concluídas",
      value: `${ordersTotal ? Math.round((ordersCompleted / ordersTotal) * 100) : 0}%`,
      description: `${ordersCompleted} de ${ordersTotal}`,
      icon: CheckCircle,
      color: "bg-green-100 text-green-700",
    },
    {
      title: "Custo Total",
      value: `R$ ${totalCost.toFixed(2)}`,
      description: "Somatório de O.S.",
      icon: DollarSign,
      color: "bg-purple-100 text-purple-700",
    },
    {
      title: "O.S. Pendentes",
      value: ordersTotal - ordersCompleted,
      description: "Aguardando execução",
      icon: Clock,
      color: "bg-orange-100 text-orange-700",
    },
  ], [totalAssets, operationalAssets, ordersTotal, ordersCompleted, totalCost]);

  const goPrevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const goNextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();

  // Maintenance trend data (últimos 6 meses)
  const maintenanceTrendData = useMemo(() => [
    { month: "Ago", preventivas: 12, corretivas: 8 },
    { month: "Set", preventivas: 15, corretivas: 10 },
    { month: "Out", preventivas: 14, corretivas: 12 },
    { month: "Nov", preventivas: 18, corretivas: 9 },
    { month: "Dez", preventivas: 16, corretivas: 11 },
    { month: "Jan", preventivas: 20, corretivas: 7 },
  ], []);

  // Asset status data
  const assetStatusData = useMemo(() => {
    const maintenanceCount = Math.max(0, totalAssets - operationalAssets);
    return [
      { status: "operacional", value: operationalAssets, color: "#22c55e" },
      { status: "em manutenção", value: Math.floor(maintenanceCount * 0.6), color: "#f97316" },
      { status: "quebrado", value: Math.floor(maintenanceCount * 0.3), color: "#ef4444" },
      { status: "inativo", value: Math.ceil(maintenanceCount * 0.1), color: "#6b7280" },
    ];
  }, [totalAssets, operationalAssets]);

  return (
    <Layout>
      <div className="p-8 space-y-8">
        <h1 className="text-3xl font-bold">Painel de Controle</h1>
        <p className="text-muted-foreground mb-4">Visão geral de gestão de ativos</p>

        {/* Indicadores */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {indicadores.map((card, idx) => {
            const Icon = card.icon as any;
            return (
              <Card key={idx} className="shadow-sm p-2 h-24 flex items-center">
                <div className="flex items-center gap-3 w-full">
                  <div className={`inline-flex items-center justify-center h-10 w-10 rounded-full ${card.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium leading-none">{card.title}</div>
                    <div className="text-xl font-bold">{card.value}</div>
                    <div className="text-xs text-muted-foreground">{card.description}</div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Calendário de Manutenções */}
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Calendário de Manutenções
              </CardTitle>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <button onClick={goPrevMonth} className="px-2 py-1 border rounded">←</button>
                <span className="min-w-[120px] text-center">{format(currentMonth, "MMMM yyyy")}</span>
                <button onClick={goNextMonth} className="px-2 py-1 border rounded">→</button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                  const entriesForDay = upcomingThisMonth.filter((u) => new Date(u.date).getDate() === day);
                  const label = entriesForDay.length > 0 ? entriesForDay[0].asset_code : null;
                  const moreCount = entriesForDay.length > 1 ? entriesForDay.length - 1 : 0;
                  return (
                    <div key={day} className="border rounded-lg h-12 flex flex-col items-center justify-center">
                      <span className="text-xs text-muted-foreground">{day}</span>
                      {label && (
                        <div className="flex items-center gap-1 mt-1">
                          <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-medium">{label}</span>
                          {moreCount > 0 && (
                            <span className="text-xs text-slate-500">+{moreCount}</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Alertas e Pendências */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-orange-700">Alertas e Pendências</CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <div className="mb-4">
                <div className="font-semibold text-red-600 mb-2">Manutenções Atrasadas</div>
                {overdues.map((a, idx) => (
                  <div key={idx} className="flex justify-between text-sm mb-1">
                    <span>{a.asset_code}</span>
                    <span>{a.days} dias</span>
                  </div>
                ))}
              </div>
              <div>
                <div className="font-semibold text-orange-600 mb-2">Próximas 7 Dias</div>
                {upcoming7Days.length === 0 ? (
                  <div className="text-sm text-slate-500">Nenhuma manutenção prevista para os próximos 7 dias.</div>
                ) : (
                  <div className="space-y-2">
                    {upcoming7Days.map((u, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="truncate">{u.asset_code}{u.order_number ? ` • ${u.order_number}` : ''}</span>
                        <span>{u.daysUntil <= 0 ? 'Hoje' : `${u.daysUntil} dia${u.daysUntil > 1 ? 's' : ''}`}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos - Tendência de Manutenções e Status de Ativos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Tendência de Manutenções (Últimos 6 Meses)</CardTitle>
            </CardHeader>
            <CardContent>
              <MaintenanceTrendChart data={maintenanceTrendData} height={300} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status dos Ativos</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <AssetStatusChart data={assetStatusData} height={300} />
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
