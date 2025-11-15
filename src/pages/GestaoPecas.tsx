import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, Plus, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function GestaoPecas() {
  // Mock data - substituir com dados reais do Supabase
  const pecas = [
    {
      id: '1',
      part_code: 'FILT-001',
      part_name: 'Filtro de Ar',
      quantity: 5,
      min_quantity: 10,
      unit_price: 45.00,
    },
    {
      id: '2',
      part_code: 'COMP-001',
      part_name: 'Compressor 12000 BTUs',
      quantity: 2,
      min_quantity: 3,
      unit_price: 850.00,
    },
  ];

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestão de Peças</h1>
            <p className="text-muted-foreground mt-1">
              Controle de estoque e peças de reposição
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nova Peça
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Estoque de Peças
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pecas.map((peca) => (
                <div key={peca.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <Package className="h-8 w-8 text-primary" />
                    <div>
                      <p className="font-semibold">{peca.part_name}</p>
                      <p className="text-sm text-muted-foreground">Código: {peca.part_code}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Quantidade</p>
                      <div className="flex items-center gap-2">
                        <p className="text-lg font-bold">{peca.quantity}</p>
                        {peca.quantity < peca.min_quantity && (
                          <Badge variant="destructive">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Baixo
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Valor Unit.</p>
                      <p className="text-lg font-bold">R$ {peca.unit_price.toFixed(2)}</p>
                    </div>
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
