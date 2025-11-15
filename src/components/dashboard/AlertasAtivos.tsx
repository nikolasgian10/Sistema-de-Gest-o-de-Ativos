import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock } from "lucide-react";

interface Alerta {
  id: string;
  tipo: string;
  mensagem: string;
  prioridade: 'alta' | 'media' | 'baixa';
}

interface AlertasAtivosProps {
  alertas: Alerta[];
}

export default function AlertasAtivos({ alertas }: AlertasAtivosProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-warning" />
          Alertas e Pendências
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alertas.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum alerta no momento</p>
          ) : (
            alertas.map((alerta) => (
              <div key={alerta.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{alerta.mensagem}</p>
                  <Badge variant={alerta.prioridade === 'alta' ? 'destructive' : 'secondary'} className="mt-1">
                    {alerta.tipo}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
