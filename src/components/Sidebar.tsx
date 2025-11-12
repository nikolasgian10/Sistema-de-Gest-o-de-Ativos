import { 
  LayoutDashboard, 
  Package, 
  FileText, 
  Calendar, 
  BarChart3,
  Settings,
  LogOut,
  Menu,
  ScanBarcode,
  Users,
  Smartphone,
  History,
  Wrench,
  Bell,
  User
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Sidebar as SidebarUI,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

const menuItems = [
  { title: "Painel de Controle", url: "/", icon: LayoutDashboard },
  { title: "Ativos", url: "/ativos", icon: Package },
  { title: "Ordens de Serviço", url: "/ordens", icon: FileText },
  { title: "Planejamento Sistemático", url: "/planejamento", icon: Calendar },
  { title: "Inventário Rápido", url: "/inventario", icon: ScanBarcode },
  { title: "Relatórios Financeiros", url: "/relatorios", icon: BarChart3 },
  { title: "Desempenho Técnicos", url: "/desempenho", icon: Users },
  { title: "Técnico Mobile", url: "/tecnico-mobile", icon: Smartphone },
  { title: "Configurações", url: "/configuracoes", icon: Settings },
];

export function Sidebar() {
  const { state } = useSidebar();
  const navigate = useNavigate();
  const isCollapsed = state === "collapsed";

  // Buscar alertas e pendências reais (igual ao Dashboard)
  const { data: alertsData, isLoading: isLoadingPending } = useQuery({
    queryKey: ['alerts-and-pending'],
    queryFn: async () => {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const sevenDaysLater = new Date(today);
        sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
        
        // Buscar manutenções atrasadas (scheduled_date < hoje e status pendente/em_andamento)
        const { data: delayedOrders, error: delayedError } = await supabase
          .from("work_orders")
          .select("id, scheduled_date, assets!inner(asset_code)")
          .in("status", ["pendente", "em_andamento"])
          .lt("scheduled_date", today.toISOString().split('T')[0]);
        
        if (delayedError) {
          console.error("Error fetching delayed orders:", delayedError);
        }
        
        // Buscar OS pendentes/em andamento (sem considerar data)
        const { data: pendingOrders, error: pendingError } = await supabase
          .from("work_orders")
          .select("id, status")
          .in("status", ["pendente", "em_andamento"]);
        
        if (pendingError) {
          console.error("Error fetching pending orders:", pendingError);
        }
        
        // Buscar próximas 7 dias
        const { data: upcomingOrders, error: upcomingError } = await supabase
          .from("work_orders")
          .select("id, scheduled_date")
          .in("status", ["pendente", "em_andamento"])
          .gte("scheduled_date", today.toISOString().split('T')[0])
          .lte("scheduled_date", sevenDaysLater.toISOString().split('T')[0]);
        
        if (upcomingError) {
          console.error("Error fetching upcoming orders:", upcomingError);
        }
        
        return {
          delayed: delayedOrders || [],
          pending: pendingOrders || [],
          upcoming: upcomingOrders || []
        };
      } catch (err) {
        console.error("Error in query function:", err);
        return { delayed: [], pending: [], upcoming: [] };
      }
    },
    refetchInterval: 30000, // Atualiza a cada 30 segundos
    retry: 2,
  });

  const delayedCount = alertsData?.delayed?.length || 0;
  const pendingCount = alertsData?.pending?.length || 0;
  const upcomingCount = alertsData?.upcoming?.length || 0;
  const totalAlerts = delayedCount + pendingCount;

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Erro ao sair");
      return;
    }
    toast.success("Logout realizado com sucesso");
    navigate("/auth");
  };

  return (
    <SidebarUI className={`${isCollapsed ? "w-14" : "w-64 h-full"}`} collapsible="icon">
      <SidebarHeader className="flex flex-col gap-2 border-b border-slate-200 p-6 bg-white">
        {!isCollapsed ? (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center shadow-lg">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-lg">GAC</h2>
              <p className="text-xs text-slate-500">Gestão de Ativos</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center shadow-lg">
              <Package className="w-6 h-6 text-white" />
            </div>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="flex flex-col min-h-0 flex-1 gap-2 overflow-auto group-data-[collapsible=icon]:overflow-hidden p-3 bg-white">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-2">
            Navegação
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SidebarMenuButton asChild>
                          <NavLink
                            to={item.url}
                            end
                            className={({ isActive }) =>
                              isActive
                                ? "flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-50 text-blue-700 font-medium transition-all duration-200 mb-1 whitespace-normal"
                                : "flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 text-slate-700 mb-1 whitespace-normal"
                            }
                          >
                            <item.icon className="h-5 w-5 flex-shrink-0" />
                            {!isCollapsed && <span className="font-medium whitespace-normal">{item.title}</span>}
                          </NavLink>
                        </SidebarMenuButton>
                      </TooltipTrigger>
                      {isCollapsed && (
                        <TooltipContent side="right">
                          <p>{item.title}</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {!isCollapsed && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-2">
              Notificações
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="px-3 py-2 space-y-2">
                {isLoadingPending ? (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-slate-400 animate-pulse" />
                      <span className="text-sm font-medium text-slate-500">Carregando...</span>
                    </div>
                  </div>
                ) : (
                  <>
                    {delayedCount > 0 && (
                      <NavLink to="/ordens">
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors cursor-pointer">
                          <div className="flex items-center gap-2">
                            <Bell className="w-4 h-4 text-red-600" />
                            <div className="flex-1">
                              <span className="text-sm font-medium text-red-900 block">
                                {delayedCount} {delayedCount === 1 ? "Manutenção Atrasada" : "Manutenções Atrasadas"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </NavLink>
                    )}
                    {pendingCount > 0 && (
                      <NavLink to="/ordens">
                        <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors cursor-pointer">
                          <div className="flex items-center gap-2">
                            <Bell className="w-4 h-4 text-orange-600" />
                            <div className="flex-1">
                              <span className="text-sm font-medium text-orange-900 block">
                                {pendingCount} {pendingCount === 1 ? "OS Pendente" : "OS Pendentes"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </NavLink>
                    )}
                    {upcomingCount > 0 && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Bell className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-900">
                            {upcomingCount} {upcomingCount === 1 ? "OS Próximos 7 dias" : "OS Próximos 7 dias"}
                          </span>
                        </div>
                      </div>
                    )}
                    {totalAlerts === 0 && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Bell className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium text-green-900">Nenhuma OS Pendente</span>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="flex flex-col gap-2 border-t border-slate-200 p-4 bg-white">
        {!isCollapsed ? (
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-slate-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-slate-900 text-sm truncate">nikolas souza</p>
              <p className="text-xs text-slate-500 truncate">nikolasgian10@gmail.com</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <div className="w-10 h-10 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-slate-600" />
            </div>
          </div>
        )}
      </SidebarFooter>
    </SidebarUI>
  );
}
