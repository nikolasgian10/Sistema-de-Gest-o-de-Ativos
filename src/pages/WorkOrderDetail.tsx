import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function WorkOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("work_orders")
          .select(`*, assets (asset_code, asset_type, location)`)
          .eq("id", id)
          .single();
        if (error) throw error;
        setOrder(data);
      } catch (err) {
        console.error("Error fetching work order:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <Layout>
        <div className="p-6">Carregando...</div>
      </Layout>
    );
  }

  if (!order) {
    return (
      <Layout>
        <div className="p-6">Ordem não encontrada.</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Detalhes da Ordem</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate(-1)}>
              Voltar
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{order.order_number}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              <div>
                <strong>Tipo:</strong> {order.order_type}
              </div>
              <div>
                <strong>Status:</strong> <Badge>{order.status}</Badge>
              </div>
              <div>
                <strong>Prioridade:</strong> {order.priority}
              </div>
              <div>
                <strong>Agendada para:</strong>{" "}
                {order.scheduled_date ? format(new Date(order.scheduled_date), "dd 'de' MMMM, yyyy", { locale: ptBR }) : "-"}
              </div>
              <div>
                <strong>Ativo:</strong> {order.assets?.asset_code} — {order.assets?.asset_type}
              </div>
              <div>
                <strong>Local:</strong> {order.assets?.location}
              </div>
              {order.description && (
                <div>
                  <strong>Descrição:</strong>
                  <div className="mt-2 text-sm text-muted-foreground">{order.description}</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
