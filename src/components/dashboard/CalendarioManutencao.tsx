import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Manutencao {
  id: string;
  ativo_nome: string;
  data_prevista: string;
  tipo: string;
  status: string;
}

interface CalendarioManutencaoProps {
  manutencoes: Manutencao[];
}

export default function CalendarioManutencao({ manutencoes }: CalendarioManutencaoProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Próximas Manutenções
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {manutencoes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma manutenção agendada</p>
          ) : (
            manutencoes.slice(0, 5).map((manutencao) => (
              <div key={manutencao.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="text-sm font-medium">{manutencao.ativo_nome}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(manutencao.data_prevista), "dd 'de' MMMM", { locale: ptBR })}
                  </p>
                </div>
                <Badge variant={manutencao.tipo === 'preventiva' ? 'default' : 'secondary'}>
                  {manutencao.tipo}
                </Badge>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
