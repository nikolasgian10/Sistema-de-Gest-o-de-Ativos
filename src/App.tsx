import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Assets from "./pages/Assets";
import AssetDetail from "./pages/AssetDetail";
import WorkOrders from "./pages/WorkOrders";
import WorkOrderDetail from "./pages/WorkOrderDetail";
import Planning from "./pages/Planning";
import Inventory from "./pages/Inventory";
import Reports from "./pages/Reports";
import Performance from "./pages/Performance";
import VisualAnalysis from "./pages/VisualAnalysis";
import AdminUsers from "./pages/AdminUsers";
import TechMobile from "./pages/TechMobile";
import HistoricoAtivo from "./pages/HistoricoAtivo";
import TestPhotoUpload from "./pages/TestPhotoUpload";
import GestaoPecas from "./pages/GestaoPecas";
import Settings from "./pages/Settings";
import SeedData from "./pages/SeedData";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (session?.user) {
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single();
        setIsAdmin(profile?.role === "admin");
      }
      setLoading(false);
    })();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session?.user) {
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single();
        setIsAdmin(profile?.role === "admin");
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function AdminOrGestorRoute({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (session?.user) {
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single();
        setIsAuthorized(profile?.role === "admin" || profile?.role === "gestor");
      }
      setLoading(false);
    })();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session?.user) {
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single();
        setIsAuthorized(profile?.role === "admin" || profile?.role === "gestor");
      } else {
        setIsAuthorized(false);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  if (!isAuthorized) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ativos"
            element={
              <ProtectedRoute>
                <Assets />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ativos/:id"
            element={
              <ProtectedRoute>
                <AssetDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ordens"
            element={
              <ProtectedRoute>
                <WorkOrders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ordens/:id"
            element={
              <ProtectedRoute>
                <WorkOrderDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/planejamento"
            element={
              <ProtectedRoute>
                <Planning />
              </ProtectedRoute>
            }
          />
          <Route
            path="/relatorios"
            element={
              <ProtectedRoute>
                <Reports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analise-visual"
            element={
              <ProtectedRoute>
                <VisualAnalysis />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminOrGestorRoute>
                <AdminUsers />
              </AdminOrGestorRoute>
            }
          />
          <Route
            path="/inventario"
            element={
              <ProtectedRoute>
                <Inventory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/desempenho"
            element={
              <ProtectedRoute>
                <Performance />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tecnico-mobile"
            element={
              <ProtectedRoute>
                <TechMobile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/historico/:id"
            element={
              <ProtectedRoute>
                <HistoricoAtivo />
              </ProtectedRoute>
            }
          />
          <Route
            path="/test-photo-upload"
            element={
              <ProtectedRoute>
                <TestPhotoUpload />
              </ProtectedRoute>
            }
          />
          <Route
            path="/gestao-pecas"
            element={
              <ProtectedRoute>
                <GestaoPecas />
              </ProtectedRoute>
            }
          />
          <Route
            path="/configuracoes"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/seed"
            element={
              <ProtectedRoute>
                <SeedData />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
