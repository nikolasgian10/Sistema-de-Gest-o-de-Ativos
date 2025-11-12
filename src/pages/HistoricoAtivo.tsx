import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { History, Calendar, User, Wrench, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function HistoricoAtivo() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [historico, setHistorico] = useState<any[]>([]);
  const [assetCode, setAssetCode] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const [assetRes, histRes, osRes] = await Promise.all([
          supabase.from("assets").select("asset_code").eq("id", id).single(),
          supabase
            .from("asset_history")
            .select("id, action_type, description, created_at, technician_id, work_order_id")
            .eq("asset_id", id)
            .order("created_at", { ascending: false }),
          supabase
            .from("work_orders")
            .select("id, order_number, completed_date, created_at, assigned_to")
            .eq("asset_id", id),
        ]);

        setAssetCode(assetRes.data?.asset_code || "");

        const osMap = new Map((osRes.data || []).map((o: any) => [o.id, o]));

        const items = (histRes.data || []).map((h: any) => ({
          id: h.id,
          action_type: h.action_type,
          description: h.description || (h.work_order_id ? `OS ${osMap.get(h.work_order_id)?.order_number || ''}` : ''),
          created_at: h.created_at,
        }));

        // fallback: also include concluded work orders as history entries
        const osItems = (osRes.data || [])
          .filter((o: any) => o.completed_date)
          .map((o: any) => ({
            id: `os-${o.id}`,
            action_type: "ordem_servico",
            description: `Ordem ${o.order_number} concluída`,
            created_at: o.completed_date || o.created_at,
          }));

        const merged = [...items, ...osItems].sort((a, b) => (new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
        setHistorico(merged);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <button onClick={() => navigate(-1)} className="text-sm text-muted-foreground flex items-center gap-2 mb-2">
              <ArrowLeft className="w-4 h-4" /> Voltar
            </button>
            <h1 className="text-3xl font-bold">Histórico do Ativo {assetCode}</h1>
            <p className="text-muted-foreground mt-1">Manutenções e alterações recentes</p>
          </div>
          <div className="w-64">
            <Input
              placeholder="Buscar na descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" /> Histórico de Ações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading && <p className="text-sm text-muted-foreground">Carregando...</p>}
              {historico
                .filter((h) => h.description?.toLowerCase().includes(searchTerm.toLowerCase()))
                .map((item) => (
                <div key={item.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <Badge>{item.action_type.replace(/_/g, ' ')}</Badge>
                      <p className="text-sm font-medium">{item.description}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(item.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </div>
                      </div>
                    </div>
                    <Wrench className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
