import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Package, CheckCircle, DollarSign, Clock } from "lucide-react";
import { Layout } from "@/components/Layout";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export default function Dashboard() {
  const [totalAssets, setTotalAssets] = useState<number>(0);
  const [operationalAssets, setOperationalAssets] = useState<number>(0);
  const [ordersTotal, setOrdersTotal] = useState<number>(0);
  const [ordersCompleted, setOrdersCompleted] = useState<number>(0);
  const [totalCost, setTotalCost] = useState<number>(0);
  const [upcomingThisMonth, setUpcomingThisMonth] = useState<Array<{ date: string; asset_code: string }>>([]);
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

      // Calendar (maintenance_schedule by selected month)
      const start = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const end = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
      const { data: sched } = await supabase
        .from("maintenance_schedule")
        .select("next_maintenance, assets(asset_code)")
        .gte("next_maintenance", format(start, "yyyy-MM-dd"))
        .lte("next_maintenance", format(end, "yyyy-MM-dd"))
        .order("next_maintenance", { ascending: true });
      setUpcomingThisMonth(
        (sched || []).map((s: any) => ({ date: s.next_maintenance, asset_code: s.assets?.asset_code }))
      );

      // Overdues (pending in the past)
      const { data: pend } = await supabase
        .from("work_orders")
        .select("scheduled_date, assets(asset_code)")
        .eq("status", "pendente");
      const now = new Date();
      const overdue = (pend || [])
        .filter((p: any) => new Date(p.scheduled_date) < now)
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
                  const label = upcomingThisMonth.find((u) => new Date(u.date).getDate() === day)?.asset_code;
                  return (
                    <div key={day} className="border rounded-lg h-12 flex flex-col items-center justify-center">
                      <span className="text-xs text-muted-foreground">{day}</span>
                      {label && (
                        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded mt-1 text-xs font-medium">
                          {label}
                        </span>
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
                <div className="flex justify-between text-sm">
                  <span>AC-001</span>
                  <span>0 dias</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
