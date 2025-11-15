import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wrench, MapPin, Calendar, Edit, Eye } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface OrdemServico {
  id: string;
  order_number: string;
  order_type: string;
  status: string;
  priority: string;
  scheduled_date: string;
  description?: string;
  asset_id: string;
}

interface ListaOSProps {
  ordensServico: OrdemServico[];
  ativos: any[];
  onEdit: (os: OrdemServico) => void;
  onView?: (os: OrdemServico) => void;
}

const statusColors = {
  pendente: "bg-warning",
  em_andamento: "bg-info",
  concluida: "bg-success",
  cancelada: "bg-destructive",
};

const statusLabels = {
  pendente: "Pendente",
  em_andamento: "Em Andamento",
  concluida: "Concluída",
  cancelada: "Cancelada",
};

const typeLabels = {
  preventiva: "Preventiva",
  corretiva: "Corretiva",
  preditiva: "Preditiva",
};

export default function ListaOS({ ordensServico, ativos, onEdit, onView }: ListaOSProps) {
  const getAtivoNome = (assetId: string) => {
    const ativo = ativos.find(a => a.id === assetId);
    return ativo ? `${ativo.asset_code} - ${ativo.location}` : 'N/A';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {ordensServico.map((os) => (
        <Card key={os.id} className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Wrench className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-lg">{os.order_number}</p>
                  <Badge className={statusColors[os.status as keyof typeof statusColors]}>
                    {statusLabels[os.status as keyof typeof statusLabels]}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <Wrench className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {typeLabels[os.order_type as keyof typeof typeLabels]}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{getAtivoNome(os.asset_id)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {format(new Date(os.scheduled_date), "dd/MM/yyyy", { locale: ptBR })}
                </span>
              </div>
              {os.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                  {os.description}
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => onEdit(os)} className="flex-1">
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
              {onView && (
                <Button variant="outline" size="sm" onClick={() => onView(os)}>
                  <Eye className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
