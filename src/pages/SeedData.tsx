import { useState } from "react";
import { seedDatabase } from "@/lib/seed-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle, Database } from "lucide-react";
import { toast } from "sonner";
import { Layout } from "@/components/Layout";

export default function SeedData() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; assetsCount?: number; ordersCount?: number; error?: any } | null>(null);

  const handleSeed = async () => {
    setIsLoading(true);
    setResult(null);
    
    try {
      const seedResult = await seedDatabase();
      setResult(seedResult);
      
      if (seedResult.success) {
        toast.success(
          `Dados inseridos com sucesso! ${seedResult.assetsCount} ativos e ${seedResult.ordersCount} ordens de serviço.`
        );
      } else {
        toast.error("Erro ao inserir dados: " + (seedResult.error?.message || "Erro desconhecido"));
      }
    } catch (error: any) {
      setResult({ success: false, error });
      toast.error("Erro ao executar seed: " + (error?.message || "Erro desconhecido"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Inserir Dados do CSV
          </CardTitle>
          <CardDescription>
            Esta página insere os dados do PMOC_2026_plano_manutencao.csv no banco de dados.
            <br />
            <strong>321 ativos</strong> e <strong>3.852 ordens de serviço</strong> serão criados.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {result && (
            <div className={`p-4 rounded-lg border ${
              result.success 
                ? "bg-green-50 border-green-200 text-green-900" 
                : "bg-red-50 border-red-200 text-red-900"
            }`}>
              <div className="flex items-start gap-3">
                {result.success ? (
                  <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
                ) : (
                  <XCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1">
                  {result.success ? (
                    <div>
                      <p className="font-semibold mb-1">Inserção concluída com sucesso!</p>
                      <ul className="text-sm space-y-1">
                        <li>✅ {result.assetsCount} ativos inseridos</li>
                        <li>✅ {result.ordersCount} ordens de serviço inseridas</li>
                      </ul>
                    </div>
                  ) : (
                    <div>
                      <p className="font-semibold mb-1">Erro ao inserir dados:</p>
                      <pre className="text-xs mt-2 overflow-auto">
                        {JSON.stringify(result.error, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-900">
              <strong>⚠️ Atenção:</strong> Esta operação irá inserir muitos registros no banco de dados.
              Certifique-se de que você deseja prosseguir. O processo pode levar alguns minutos.
            </p>
          </div>

          <Button
            onClick={handleSeed}
            disabled={isLoading}
            size="lg"
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Inserindo dados...
              </>
            ) : (
              <>
                <Database className="mr-2 h-4 w-4" />
                Executar Inserção de Dados
              </>
            )}
          </Button>

          {isLoading && (
            <p className="text-sm text-center text-muted-foreground">
              Por favor, aguarde. Este processo pode levar alguns minutos...
            </p>
          )}
        </CardContent>
      </Card>
      </div>
    </Layout>
  );
}

