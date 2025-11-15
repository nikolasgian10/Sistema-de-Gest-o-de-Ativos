import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function AdminUsers() {
  const [pending, setPending] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      // Profiles without a role are considered pending approval
      const { data: pendingProfiles } = await supabase.from("profiles").select("id, full_name, created_at").is("role", null);
      setPending(pendingProfiles || []);

      const { data: profiles } = await supabase.from("profiles").select("id, full_name, role, created_at").order("created_at", { ascending: false });
      setAllUsers(profiles || []);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar usuários");
    } finally {
      setLoading(false);
    }
  };

  const approve = async (id: string, role: "gestor" | "tecnico") => {
    try {
      await supabase.from("profiles").update({ role }).eq("id", id);
      // keep a record in user_roles for compatibility
      await supabase.from("user_roles").insert({ user_id: id, role });
      toast.success("Usuário aprovado com sucesso");
      await load();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao aprovar usuário");
    }
  };

  const reject = async (id: string) => {
    try {
      // Option: remove profile or mark rejected — we'll remove the profile to keep things simple
      await supabase.from("profiles").delete().eq("id", id);
      // also revoke auth user (best-effort)
      try {
        await supabase.auth.admin.deleteUser(id);
      } catch (e) {
        // ignore if admin API not available in client
      }
      toast.success("Solicitação rejeitada e usuário removido");
      await load();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao rejeitar usuário");
    }
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Gerenciamento de Usuários</h1>
          <p className="text-sm text-muted-foreground">Aprovar novos cadastros e atribuir papéis</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Solicitações Pendentes</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p>Carregando...</p>
              ) : pending.length === 0 ? (
                <p className="text-muted-foreground">Nenhuma solicitação pendente</p>
              ) : (
                <div className="space-y-3">
                  {pending.map((p) => (
                    <div key={p.id} className="p-3 border rounded-lg flex justify-between items-center">
                      <div>
                        <div className="font-medium">{p.full_name}</div>
                        <div className="text-xs text-muted-foreground">ID: {p.id}</div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" onClick={() => approve(p.id, "tecnico")}>Aprovar Técnico</Button>
                        <Button variant="outline" onClick={() => approve(p.id, "gestor")}>Aprovar Gestor</Button>
                        <Button variant="destructive" onClick={() => reject(p.id)}>Rejeitar</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Todos os Usuários</CardTitle>
            </CardHeader>
            <CardContent>
              {allUsers.length === 0 ? (
                <p className="text-muted-foreground">Nenhum usuário encontrado</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {allUsers.map((u) => (
                    <div key={u.id} className="p-2 border rounded flex items-center justify-between">
                      <div>
                        <div className="font-medium">{u.full_name}</div>
                        <div className="text-xs text-muted-foreground">ID: {u.id}</div>
                      </div>
                      <div className="text-sm">{u.role || "Pendente"}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
