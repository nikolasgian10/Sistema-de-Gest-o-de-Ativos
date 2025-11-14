import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Filter, FileText } from "lucide-react";
import FormularioOS from "@/components/os/FormularioOS";
import { Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { startOfWeek, addDays } from "date-fns";

interface WorkOrder {
  id: string;
  order_number: string;
  order_type: string;
  status: string;
  priority: string;
  scheduled_date: string;
  asset_id: string;
  description: string;
  assets: {
    asset_code: string;
    asset_type: string;
    location: string;
  };
}

export default function WorkOrders() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assetsList, setAssetsList] = useState<any[]>([]);
  const [sectorFilter, setSectorFilter] = useState<string>("all");
  const [weekNumber, setWeekNumber] = useState<number>(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    return Math.ceil(((now.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7);
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchWorkOrders();
  }, []);

  const handleExportarOrdens = async () => {
    try {
      const filteredOrders_ = workOrders.filter((order) => {
        const matchesSearch =
          order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.assets?.asset_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.description?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === "all" || order.status === filterStatus;
        const matchesType = filterType === "all" || order.order_type === filterType;
        const matchesSector = sectorFilter === "all" || (order as any).assets?.location?.includes(sectorFilter) || (order as any).assets?.sector === sectorFilter;
        return matchesSearch && matchesStatus && matchesType && matchesSector;
      });

      const headers = ['Número da OS', 'Ativo', 'Tipo', 'Prioridade', 'Status', 'Data Agendada', 'Local'];
      const rows = filteredOrders_.map(order => [
        order.order_number,
        order.assets?.asset_code || 'N/A',
        order.order_type === 'preventiva' ? 'Preventiva' : order.order_type === 'corretiva' ? 'Corretiva' : 'Instalação',
        order.priority.charAt(0).toUpperCase() + order.priority.slice(1),
        order.status.charAt(0).toUpperCase() + order.status.slice(1),
        format(new Date(order.scheduled_date), 'dd/MM/yyyy', { locale: ptBR }),
        order.assets?.location || 'N/A'
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `ordens_servico_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Ordens exportadas com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar:', error);
      toast.error('Erro ao exportar ordens');
    }
  };

  const fetchWorkOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("work_orders")
        .select(`
          *,
          assets (
            asset_code,
            asset_type,
            location
          )
        `)
        .order("scheduled_date", { ascending: false });

      if (error) throw error;
      setWorkOrders(data || []);
    } catch (error) {
      console.error("Error fetching work orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssets = async () => {
    try {
      const { data, error } = await supabase
        .from("assets")
        .select("id, asset_code, location")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAssetsList(data || []);
    } catch (error) {
      console.error("Error fetching assets for OS form:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pendente: "outline",
      em_andamento: "default",
      concluida: "outline",
      cancelada: "destructive",
    } as const;
    
    const colors = {
      pendente: "border-yellow-500 text-yellow-700",
      em_andamento: "",
      concluida: "border-green-500 text-green-700",
      cancelada: "",
    } as Record<string, string>;

    const labels = {
      pendente: "Pendente",
      em_andamento: "Em Andamento",
      concluida: "Concluída",
      cancelada: "Cancelada",
    } as Record<string, string>;

    return (
      <Badge 
        variant={variants[status as keyof typeof variants] || "default"}
        className={colors[status] || ""}
      >
        {labels[status] || status}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      baixa: "bg-blue-100 text-blue-800",
      normal: "bg-gray-100 text-gray-800",
      alta: "bg-orange-100 text-orange-800",
      critica: "bg-red-100 text-red-800",
    } as Record<string, string>;

    const labels = {
      baixa: "Baixa",
      normal: "Normal",
      alta: "Alta",
      critica: "Crítica",
    } as Record<string, string>;

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[priority] || colors.normal}`}>
        {labels[priority] || priority}
      </span>
    );
  };

  const filteredOrders = workOrders.filter((order) => {
    const matchesSearch =
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.assets?.asset_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === "all" || order.status === filterStatus;
    const matchesType = filterType === "all" || order.order_type === filterType;
    const matchesSector = sectorFilter === "all" || (order as any).assets?.location?.includes(sectorFilter) || (order as any).assets?.sector === sectorFilter;

    return matchesSearch && matchesStatus && matchesType && matchesSector;
  });

  const generateOrdersForWeekBySector = async () => {
    try {
      const year = new Date().getFullYear();
      const weekStart = startOfWeek(new Date(year, 0, 1 + (weekNumber - 1) * 7));
      const weekEnd = addDays(weekStart, 6);

      const { data: schedules, error } = await supabase
        .from("maintenance_schedule")
        .select(`*, assets (id, asset_code, sector, location)`) 
        .gte("next_maintenance", format(weekStart, "yyyy-MM-dd"))
        .lte("next_maintenance", format(weekEnd, "yyyy-MM-dd"));
      if (error) throw error;

      const candidates = (schedules || []).filter((s: any) =>
        sectorFilter === "all" ? true : (s.assets?.sector === sectorFilter || s.assets?.location?.includes(sectorFilter))
      );

      if (candidates.length === 0) {
        toast.info("Nenhuma manutenção planejada para os filtros selecionados.");
        return;
      }

      const rows = candidates.map((s: any) => ({
        order_number: `OS-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        asset_id: s.assets?.id,
        order_type: "preventiva",
        priority: "normal",
        status: "pendente",
        scheduled_date: s.next_maintenance,
        description: null,
      }));

      const { error: insertErr } = await supabase.from("work_orders").insert(rows);
      if (insertErr) throw insertErr;
      toast.success(`Geradas ${rows.length} ordens para a semana S${weekNumber}${sectorFilter !== 'all' ? ' - ' + sectorFilter : ''}.`);
      await fetchWorkOrders();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao gerar ordens da semana.");
    }
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Ordens de Serviço</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie manutenções preventivas e corretivas
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={() => { setShowForm(true); fetchAssets(); }} className="bg-gradient-to-r from-primary to-primary-glow">
              <Plus className="h-4 w-4 mr-2" />
              Nova OS
            </Button>
            <Button variant="outline" onClick={handleExportarOrdens} className="gap-2">
              <Download className="h-4 w-4" />
              Exportar
            </Button>
            <Button variant="default" onClick={generateOrdersForWeekBySector}>
              Gerar Ordens de Manutenção
            </Button>
          </div>
        </div>

        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>Criar Nova Ordem de Serviço</CardTitle>
            </CardHeader>
            <CardContent>
              <FormularioOS
                ativos={assetsList}
                isLoading={isSubmitting}
                onSubmit={async (data) => {
                  try {
                    setIsSubmitting(true);
                    const { error } = await supabase.from('work_orders').insert([{ ...data }]);
                    if (error) throw error;
                    toast.success('Ordem criada com sucesso');
                    await fetchWorkOrders();
                    setShowForm(false);
                  } catch (err) {
                    console.error('Erro ao salvar OS', err);
                    toast.error('Erro ao salvar OS');
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
              />
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por número, ativo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="all">Todos os Status</option>
                <option value="pendente">Pendente</option>
                <option value="em_andamento">Em Andamento</option>
                <option value="concluida">Concluída</option>
                <option value="cancelada">Cancelada</option>
              </select>

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="all">Todos os Tipos</option>
                <option value="preventiva">Preventiva</option>
                <option value="corretiva">Corretiva</option>
                <option value="instalacao">Instalação</option>
              </select>

              <input
                type="number"
                min={1}
                max={54}
                value={weekNumber}
                onChange={(e) => setWeekNumber(parseInt(e.target.value || '1'))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Semana (1-54)"
              />

              <input
                type="text"
                value={sectorFilter}
                onChange={(e) => setSectorFilter(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Setor (ou 'all')"
              />

              <Button variant="outline" onClick={fetchWorkOrders}>
                Atualizar
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))
          ) : filteredOrders.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma ordem de serviço encontrada</h3>
                <p className="text-muted-foreground">
                  {searchTerm || filterStatus !== "all" || filterType !== "all"
                    ? "Tente ajustar os filtros"
                    : "Crie a primeira ordem de serviço"}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredOrders.map((order) => (
              <Card key={order.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-lg font-semibold">{order.order_number}</h3>
                        {getStatusBadge(order.status)}
                        {getPriorityBadge(order.priority)}
                        <Badge variant="outline">
                          {order.order_type === "preventiva" ? "Preventiva" : 
                           order.order_type === "corretiva" ? "Corretiva" : "Instalação"}
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>
                          <span className="font-medium">Ativo:</span>{" "}
                          {order.assets?.asset_code} - {order.assets?.asset_type}
                        </p>
                        <p>
                          <span className="font-medium">Local:</span> {order.assets?.location}
                        </p>
                        {order.description && (
                          <p>
                            <span className="font-medium">Descrição:</span> {order.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-right space-y-2">
                      <p className="text-sm font-medium">
                        Agendado para
                      </p>
                      <p className="text-lg font-bold text-primary">
                        {format(new Date(order.scheduled_date), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                      </p>
                      <Button variant="outline" size="sm">
                        Ver Detalhes
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}
