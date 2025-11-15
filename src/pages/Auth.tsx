import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const authSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
});

const signupSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
  fullName: z.string().min(1, "Nome não pode estar vazio"),
});

export default function Auth() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    role: "tecnico"
  });

  // 🔥🔥 USE EFFECT SUBSTITUÍDO AQUI
  useEffect(() => {
    // 1️⃣ Limpa tudo do navegador imediatamente
    localStorage.clear();
    sessionStorage.clear();

    // 2️⃣ Limpa sessão do supabase
    supabase.auth.signOut({ scope: "global" });

    // 3️⃣ Se por algum milagre ainda tiver session, limpa de novo
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        supabase.auth.signOut({ scope: "global" });
        localStorage.clear();
        sessionStorage.clear();
      }
    });

    // 4️⃣ Se logar, manda para home
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);
  // 🔥🔥 FIM DO USE EFFECT

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      authSchema.parse({ email: formData.email, password: formData.password });

      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast.error("Email ou senha incorretos");
        } else {
          toast.error(error.message);
        }
        return;
      }

      toast.success("Login realizado com sucesso!");
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      signupSchema.parse({ email: formData.email, password: formData.password, fullName: formData.fullName });

      // Verificar se o email já existe em pending_signups
      const { data: existingPending, error: existingPendingError } = await supabase
        .from("pending_signups")
        .select("id")
        .eq("email", formData.email)
        .eq("status", "pending")
        .maybeSingle();

      if (existingPendingError) {
        console.warn("Warning checking pending_signups:", existingPendingError);
      }

      if (existingPending) {
        toast.error("Este email já possui uma solicitação pendente");
        return;
      }

      // Verificar se o email já existe no auth.users (profiles)
      const { data: existingAuth, error: existingAuthError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", formData.email)
        .maybeSingle();

      if (existingAuthError) {
        console.warn("Warning checking profiles:", existingAuthError);
      }

      if (existingAuth) {
        toast.error("Este email já está cadastrado no sistema");
        return;
      }

      // Gerar hash da senha (simulado - usar bcrypt em produção)
      // Para segurança real, usar biblioteca como bcryptjs
      const passwordHash = btoa(formData.password); // Base64 para demo

      // Salvar na tabela pending_signups
      const { data: pendingData, error: pendingError } = await supabase
        .from("pending_signups")
        .insert({
          email: formData.email,
          password_hash: passwordHash,
          full_name: formData.fullName,
          role: formData.role || "tecnico",
          status: "pending",
        })
        .select();

      if (pendingError) {
        console.error("Error creating pending signup:", pendingError);
        toast.error("Erro ao criar solicitação de cadastro");
        return;
      }

      toast.success("✅ Cadastro enviado com sucesso! Aguarde aprovação do administrador.");
      
      // Limpar o formulário
      setFormData({
        email: "",
        password: "",
        fullName: "",
        role: "tecnico"
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        console.error("Signup error:", error);
        toast.error("Erro ao processar cadastro");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            GAC Sistema
          </CardTitle>
          <CardDescription className="text-center">
            Gestão de Ativos de Climatização
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={isLogin ? "login" : "signup"} onValueChange={(v) => setIsLogin(v === "login")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Cadastro</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    "Entrar"
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nome Completo</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Seu nome completo"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Senha</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Tipo de Usuário</Label>
                  <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                    <SelectTrigger id="role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tecnico">👨‍🔧 Técnico</SelectItem>
                      <SelectItem value="gestor">📊 Gestor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cadastrando...
                    </>
                  ) : (
                    "Criar Conta"
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
