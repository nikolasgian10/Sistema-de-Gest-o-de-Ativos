import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings as SettingsIcon, User, Bell, Shield, Database, ArrowRight, Users, Trash2, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Settings() {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkAdminRole();
    loadUsers();
  }, []);

  const checkAdminRole = async () => {
    try {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .single();
        setUserRole(profile?.role);
      }
    } catch (error) {
      console.error("Error checking admin role:", error);
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      // Fetch pending users (role is null)
      const { data: pending } = await supabase
        .from("profiles")
        .select("id, full_name, created_at")
        .is("role", null)
        .order("created_at", { ascending: false });

      setPendingUsers(pending || []);

      // Fetch all users
      const { data: all } = await supabase
        .from("profiles")
        .select("id, full_name, role, created_at")
        .order("created_at", { ascending: false });

      setAllUsers(all || []);
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("Erro ao carregar usuários");
    } finally {
      setLoading(false);
    }
  };

  const approveUser = async (userId: string, role: "gestor" | "tecnico") => {
    try {
      await supabase.from("profiles").update({ role }).eq("id", userId);
      await supabase.from("user_roles").insert({ user_id: userId, role });
      toast.success(`Usuário aprovado como ${role}`);
      await loadUsers();
    } catch (error) {
      console.error("Error approving user:", error);
      toast.error("Erro ao aprovar usuário");
    }
  };

  const rejectUser = async (userId: string) => {
    try {
      await supabase.from("profiles").delete().eq("id", userId);
      toast.success("Solicitação rejeitada");
      await loadUsers();
    } catch (error) {
      console.error("Error rejecting user:", error);
      toast.error("Erro ao rejeitar usuário");
    }
  };

  const banUser = async (userId: string) => {
    try {
      await supabase.from("profiles").update({ role: "banido" }).eq("id", userId);
      toast.success("Usuário banido");
      await loadUsers();
    } catch (error) {
      console.error("Error banning user:", error);
      toast.error("Erro ao banir usuário");
    }
  };
  
  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie as configurações do sistema
          </p>
        </div>

        <Tabs defaultValue="profile" className="space-y-4">
          <TabsList>
            <TabsTrigger value="profile">
              <User className="h-4 w-4 mr-2" />
              Perfil
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="h-4 w-4 mr-2" />
              Notificações
            </TabsTrigger>
            <TabsTrigger value="security">
              <Shield className="h-4 w-4 mr-2" />
              Segurança
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="h-4 w-4 mr-2" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="system">
              <Database className="h-4 w-4 mr-2" />
              Sistema
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Informações do Perfil</CardTitle>
                <CardDescription>
                  Atualize suas informações pessoais
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input id="name" placeholder="Seu nome" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="seu@email.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Função</Label>
                  <Input id="role" placeholder="Técnico, Gestor, etc." disabled />
                </div>
                <Button className="bg-gradient-to-r from-primary to-primary-glow">
                  Salvar Alterações
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Preferências de Notificação</CardTitle>
                <CardDescription>
                  Configure como deseja receber notificações
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>OSs Pendentes</Label>
                    <p className="text-sm text-muted-foreground">
                      Receber notificações sobre ordens de serviço pendentes
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Manutenções Agendadas</Label>
                    <p className="text-sm text-muted-foreground">
                      Alertas sobre manutenções próximas
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Ativos Quebrados</Label>
                    <p className="text-sm text-muted-foreground">
                      Notificações de falhas em equipamentos
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Relatórios Semanais</Label>
                    <p className="text-sm text-muted-foreground">
                      Receber resumo semanal por email
                    </p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Segurança da Conta</CardTitle>
                <CardDescription>
                  Gerencie a segurança da sua conta
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Senha Atual</Label>
                  <Input id="current-password" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">Nova Senha</Label>
                  <Input id="new-password" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
                  <Input id="confirm-password" type="password" />
                </div>
                <Button className="bg-gradient-to-r from-primary to-primary-glow">
                  Atualizar Senha
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Solicitações Pendentes */}
                <Card className="border-orange-200">
                  <CardHeader>
                    <CardTitle className="text-orange-900">Solicitações Pendentes</CardTitle>
                    <CardDescription>
                      Novos usuários aguardando aprovação ({pendingUsers.length})
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
                      </div>
                    ) : pendingUsers.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">
                        Nenhuma solicitação pendente
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {pendingUsers.map((user) => (
                          <div key={user.id} className="p-4 border rounded-lg bg-orange-50">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <p className="font-medium">{user.full_name}</p>
                                <p className="text-xs text-muted-foreground">{user.id}</p>
                              </div>
                              <Badge variant="outline" className="text-orange-700 border-orange-200">
                                Pendente
                              </Badge>
                            </div>
                            <div className="flex gap-2 flex-col">
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="default"
                                  className="flex-1"
                                  onClick={() => approveUser(user.id, "tecnico")}
                                >
                                  Aprova Técnico
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1"
                                  onClick={() => approveUser(user.id, "gestor")}
                                >
                                  Aprova Gestor
                                </Button>
                              </div>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="w-full"
                                onClick={() => rejectUser(user.id)}
                              >
                                Rejeitar
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Todos os Usuários */}
                <Card>
                  <CardHeader>
                    <CardTitle>Todos os Usuários</CardTitle>
                    <CardDescription>
                      Gerenciar todos os usuários do sistema
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {allUsers.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                          Nenhum usuário encontrado
                        </p>
                      ) : (
                        allUsers.map((user) => (
                          <div key={user.id} className="p-3 border rounded-lg flex justify-between items-center">
                            <div className="flex-1">
                              <p className="font-medium">{user.full_name}</p>
                              <p className="text-xs text-muted-foreground">{user.id}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {user.role === "admin" && (
                                <Badge className="bg-red-600">Admin</Badge>
                              )}
                              {user.role === "gestor" && (
                                <Badge className="bg-blue-600">Gestor</Badge>
                              )}
                              {user.role === "tecnico" && (
                                <Badge className="bg-green-600">Técnico</Badge>
                              )}
                              {user.role === "banido" && (
                                <Badge className="bg-gray-600">Banido</Badge>
                              )}
                              {!user.role && (
                                <Badge variant="outline" className="text-orange-700">
                                  Pendente
                                </Badge>
                              )}
                              {user.role && user.role !== "admin" && user.role !== "banido" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => banUser(user.id)}
                                  title="Banir usuário"
                                >
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

          <TabsContent value="system" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Configurações do Sistema</CardTitle>
                <CardDescription>
                  Configurações gerais do sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="backup-frequency">Frequência de Backup</Label>
                  <select
                    id="backup-frequency"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="daily">Diário</option>
                    <option value="weekly">Semanal</option>
                    <option value="monthly">Mensal</option>
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Modo Escuro</Label>
                    <p className="text-sm text-muted-foreground">
                      Ativar tema escuro
                    </p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Sincronização Automática</Label>
                    <p className="text-sm text-muted-foreground">
                      Sincronizar dados automaticamente
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-blue-600" />
                  Inserção de Dados
                </CardTitle>
                <CardDescription>
                  Insira os dados do plano de manutenção PMOC 2026 no banco de dados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Esta função irá inserir <strong>321 ativos</strong> e <strong>3.852 ordens de serviço</strong> do arquivo CSV processado.
                  </p>
                  <Button
                    onClick={() => navigate('/seed')}
                    variant="outline"
                    className="w-full"
                  >
                    Acessar Página de Inserção
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
