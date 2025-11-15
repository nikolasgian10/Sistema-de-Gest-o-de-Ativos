import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings as SettingsIcon, User, Bell, Shield, Database, ArrowRight, Users, Trash2, Loader2, Check, X } from "lucide-react";
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
  const [pendingSignups, setPendingSignups] = useState<any[]>([]);
  const [activeUsers, setActiveUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<{ [key: string]: string }>({});

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
        if (profile?.role !== "admin") {
          navigate("/");
        }
      }
    } catch (error) {
      console.error("Error checking admin role:", error);
      navigate("/");
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      // Carregar solicitações pendentes (não aprovadas)
      const { data: pending, error: pendingError } = await supabase
        .from("pending_signups")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (pendingError) {
        console.error("Error loading pending signups:", pendingError);
      } else {
        setPendingSignups(pending || []);
      }

      // Carregar todos os usuários ativos
      const { data: active, error: activeError } = await supabase
        .from("profiles")
        .select("id, full_name, role, created_at, updated_at")
        .neq("role", null)
        .order("created_at", { ascending: false });

      if (activeError) {
        console.error("Error loading active users:", activeError);
      } else {
        setActiveUsers(active || []);
      }
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("Erro ao carregar usuários");
    } finally {
      setLoading(false);
    }
  };

    const approveSignup = async (pendingId: string, fullName: string, email: string, password: string) => {
    // Pegar o role selecionado ou usar o padrão
    const role = selectedRoles[pendingId] || "tecnico";
    console.debug("[Settings] approveSignup called", { pendingId, role, selectedRoles });
    
    setApprovingId(pendingId);
    try {
      // 1. Tentar criar usuário no auth (pode não retornar user.id se confirmação por email for necessária)
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: email,
        password: password,
      });

      if (signUpError) {
        // Não abortar automaticamente: logar e continuar tentando garantir o profile
        console.warn("Warning creating auth user:", signUpError);
      }

      const userId = signUpData?.user?.id ?? null;

      // 2. Garantir que o profile tenha o role correto. Se tivermos userId, upsert por id; caso contrário, atualizar/insert por email
      if (userId) {
        const { error: profileError } = await supabase
          .from("profiles")
          .upsert({
            id: userId,
            full_name: fullName,
            email: email,
            role: role,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }, { onConflict: 'id' });

        if (profileError) {
          console.error("Error creating profile:", profileError);
          toast.error("Erro ao criar perfil do usuário");
          return;
        }
      } else {
        // Tentar encontrar profile existente pelo email
        const { data: existing, error: findErr } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", email)
          .maybeSingle();

        if (findErr) {
          console.error("Error finding profile by email:", findErr);
          toast.error("Erro ao criar perfil do usuário");
          return;
        }

        if (existing && existing.id) {
          const { error: updateErr } = await supabase
            .from("profiles")
            .update({
              full_name: fullName,
              role: role,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existing.id);

          if (updateErr) {
            console.error("Error updating profile:", updateErr);
            toast.error("Erro ao atualizar perfil do usuário");
            return;
          }
        } else {
          const { error: insertErr } = await supabase
            .from("profiles")
            .insert({
              full_name: fullName,
              email: email,
              role: role,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });

          if (insertErr) {
            console.error("Error inserting profile:", insertErr);
            toast.error("Erro ao criar perfil do usuário");
            return;
          }
        }
      }

      // 3. Atualizar status da solicitação de cadastro
      const { error: updateError } = await supabase
        .from("pending_signups")
        .update({
          status: "approved",
          updated_at: new Date().toISOString(),
        })
        .eq("id", pendingId);

      if (updateError) {
        console.error("Error updating pending signup:", updateError);
      }

      toast.success(`✅ Usuário ${fullName} aprovado como ${role}!`);

      // Limpar role selecionado
      const newRoles = { ...selectedRoles };
      delete newRoles[pendingId];
      setSelectedRoles(newRoles);

      await loadUsers();
    } catch (error) {
      console.error("Error approving signup:", error);
      toast.error("Erro ao aprovar cadastro");
    } finally {
      setApprovingId(null);
    }
  };

  const rejectSignup = async (pendingId: string, email: string) => {
    try {
      const { error } = await supabase
        .from("pending_signups")
        .update({
          status: "rejected",
          updated_at: new Date().toISOString(),
        })
        .eq("id", pendingId);

      if (error) {
        console.error("Error rejecting signup:", error);
        toast.error("Erro ao rejeitar solicitação");
        return;
      }

      toast.success(`❌ Solicitação de ${email} foi rejeitada`);
      await loadUsers();
    } catch (error) {
      console.error("Error rejecting signup:", error);
      toast.error("Erro ao rejeitar solicitação");
    }
  };

  const deactivateUser = async (userId: string, fullName: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          role: "banido",
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (error) {
        console.error("Error deactivating user:", error);
        toast.error("Erro ao desativar usuário");
        return;
      }

      toast.success(`❌ Usuário ${fullName} foi desativado`);
      await loadUsers();
    } catch (error) {
      console.error("Error deactivating user:", error);
      toast.error("Erro ao desativar usuário");
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
              <Card className="border-amber-200 bg-amber-50/50">
                <CardHeader>
                  <CardTitle className="text-amber-900">📝 Solicitações Pendentes</CardTitle>
                  <CardDescription>
                    Novos usuários aguardando aprovação ({pendingSignups.length})
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
                    </div>
                  ) : pendingSignups.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      ✅ Nenhuma solicitação pendente
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {pendingSignups.map((pending) => (
                        <div key={pending.id} className="p-4 border rounded-lg bg-white">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900">{pending.full_name}</p>
                              <p className="text-sm text-gray-600">{pending.email}</p>
                            </div>
                            <Badge variant="outline" className="text-amber-700 border-amber-200">
                              Pendente
                            </Badge>
                          </div>
                          <div className="space-y-3">
                            <div className="space-y-2">
                              <Label htmlFor={`role-${pending.id}`}>Selecione o tipo de usuário:</Label>
                              <Select 
                                value={selectedRoles[pending.id] || pending.role || "tecnico"}
                                onValueChange={(value) => setSelectedRoles({ ...selectedRoles, [pending.id]: value })}
                              >
                                <SelectTrigger id={`role-${pending.id}`}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="tecnico">👨‍🔧 Técnico</SelectItem>
                                  <SelectItem value="gestor">📊 Gestor</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex gap-2 flex-col">
                              <Button
                                size="sm"
                                className="w-full bg-green-600 hover:bg-green-700 text-white"
                                disabled={approvingId === pending.id}
                                onClick={() => approveSignup(
                                  pending.id,
                                  pending.full_name,
                                  pending.email,
                                  atob(pending.password_hash), // Decodificar senha
                                )}
                              >
                                {approvingId === pending.id ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Aprovando...
                                  </>
                                ) : (
                                  <>
                                    <Check className="mr-2 h-4 w-4" />
                                    Incluir no Supabase
                                  </>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="w-full"
                                disabled={approvingId === pending.id}
                                onClick={() => rejectSignup(pending.id, pending.email)}
                              >
                                <X className="mr-2 h-4 w-4" />
                                Rejeitar
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Todos os Usuários Ativos */}
              <Card className="border-blue-200 bg-blue-50/50">
                <CardHeader>
                  <CardTitle className="text-blue-900">👥 Todos os Usuários</CardTitle>
                  <CardDescription>
                    Usuários ativos no sistema ({activeUsers.length})
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {activeUsers.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">
                        Nenhum usuário ativo encontrado
                      </p>
                    ) : (
                      activeUsers.map((user) => (
                        <div key={user.id} className="p-3 border rounded-lg bg-white flex justify-between items-center">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{user.full_name}</p>
                            <p className="text-xs text-gray-500">{user.id}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {user.role === "admin" && (
                              <Badge className="bg-red-600">🔐 Admin</Badge>
                            )}
                            {user.role === "gestor" && (
                              <Badge className="bg-blue-600">📊 Gestor</Badge>
                            )}
                            {user.role === "tecnico" && (
                              <Badge className="bg-green-600">🔧 Técnico</Badge>
                            )}
                            {user.role === "banido" && (
                              <Badge className="bg-gray-600">🚫 Banido</Badge>
                            )}
                            
                            {/* Botão desativar apenas para usuários ativos que não são admin */}
                            {user.role !== "admin" && user.role !== "banido" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  if (window.confirm(`Tem certeza que quer desativar ${user.full_name}?`)) {
                                    deactivateUser(user.id, user.full_name);
                                  }
                                }}
                                title="Desativar usuário"
                                className="hover:bg-red-100"
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
