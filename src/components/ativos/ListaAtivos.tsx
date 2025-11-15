import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, MapPin, Edit, QrCode, Download } from "lucide-react";

interface Ativo {
  id: string;
  asset_code: string;
  asset_type: string;
  brand?: string;
  model?: string;
  location: string;
  operational_status: string;
}

interface ListaAtivosProps {
  ativos: Ativo[];
  onEdit: (ativo: Ativo) => void;
  onViewQR?: (ativo: Ativo) => void;
}

const statusColors = {
  operacional: "bg-success",
  manutencao: "bg-warning",
  inativo: "bg-destructive",
} as const;

const statusLabels = {
  operacional: "Operacional",
  manutencao: "Em Manutenção",
  inativo: "Inativo",
} as const;

const typeLabels = {
  ar_condicionado: "Ar Condicionado",
  mecalor: "Mecalor",
  chiller: "Chiller",
  split: "Split",
  outro: "Outro",
} as const;

export default function ListaAtivos({ ativos, onEdit, onViewQR }: ListaAtivosProps) {
  const exportarAtivos = () => {
    const csvData = [
      ['Código', 'Tipo', 'Marca', 'Modelo', 'Localização', 'Status'],
      ...ativos.map((ativo) => [
        ativo.asset_code,
        typeLabels[ativo.asset_type as keyof typeof typeLabels],
        ativo.brand || '',
        ativo.model || '',
        ativo.location,
        statusLabels[ativo.operational_status as keyof typeof statusLabels]
      ])
    ];

    const csv = csvData.map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'ativos.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Lista de Ativos</h2>
        <Button variant="outline" onClick={exportarAtivos}>
          <Download className="h-4 w-4 mr-2" />
          Exportar Lista
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ativos.map((ativo) => (
          <Card key={ativo.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">{ativo.asset_code}</h3>
                    <p className="text-sm text-muted-foreground">
                      {typeLabels[ativo.asset_type as keyof typeof typeLabels]}
                    </p>
                  </div>
                </div>
                <Badge 
                  variant="outline" 
                  className={`${statusColors[ativo.operational_status as keyof typeof statusColors]} text-background`}
                >
                  {statusLabels[ativo.operational_status as keyof typeof statusLabels]}
                </Badge>
              </div>

              <div className="space-y-3">
                {(ativo.brand || ativo.model) && (
                  <p className="text-sm">
                    <span className="font-medium">Modelo: </span>
                    {[ativo.brand, ativo.model].filter(Boolean).join(' ')}
                  </p>
                )}
                <p className="text-sm flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  {ativo.location}
                </p>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                {onViewQR && (
                  <Button variant="outline" size="sm" onClick={() => onViewQR(ativo)}>
                    <QrCode className="h-4 w-4" />
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => onEdit(ativo)}>
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}