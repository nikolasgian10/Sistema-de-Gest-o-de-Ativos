import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { seedDatabase } from "@/lib/seed-data";

const Index = () => {
  const [status, setStatus] = useState<string>("Preparando ambiente...");

  useEffect(() => {
    const run = async () => {
      try {
        // Verifica se já existe plano sistemático para 2026
        setStatus("Verificando dados existentes...");
        const { count, error } = await supabase
          .from("maintenance_schedule")
          .select("*", { count: "exact", head: true })
          .gte("next_maintenance", "2026-01-01")
          .lte("next_maintenance", "2026-12-31");

        if (error) throw error;

        if (!count || count === 0) {
          setStatus("Carregando ativos e plano sistemático 2026...");
          const result = await seedDatabase();
          if (!(result as any)?.success) throw (result as any)?.error || new Error("Falha no seed");
          setStatus("Dados carregados com sucesso. Redirecionando...");
        } else {
          setStatus("Dados já existentes. Redirecionando...");
        }

        // Redireciona para a tela de planejamento
        window.location.href = "/planning";
      } catch (e) {
        console.error(e);
        setStatus("Erro ao preparar dados. Verifique as credenciais do banco.");
      }
    };
    run();
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="mb-4 text-3xl font-bold">Inicializando o Sistema</h1>
        <p className="text-base text-muted-foreground">{status}</p>
      </div>
    </div>
  );
};

export default Index;
