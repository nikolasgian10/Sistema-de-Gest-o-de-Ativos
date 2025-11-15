import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = "admin" | "gestor" | "tecnico" | "banido" | null;

interface UserPermissions {
  role: UserRole;
  isAdmin: boolean;
  isGestor: boolean;
  isTecnico: boolean;
  canViewAssets: boolean;
  canEditAssets: boolean;
  canViewOrders: boolean;
  canCreateOrders: boolean;
  canViewPlanning: boolean;
  canEditPlanning: boolean;
  canAccessSettings: boolean;
  canAccessReports: boolean;
  canAccessInventory: boolean;
  canAccessAnalysis: boolean;
  canAccessPerformance: boolean;
  canAccessTechMobile: boolean;
}

export function useUserRole(): UserPermissions & { loading: boolean } {
  const [permissions, setPermissions] = useState<UserPermissions>({
    role: null,
    isAdmin: false,
    isGestor: false,
    isTecnico: false,
    canViewAssets: false,
    canEditAssets: false,
    canViewOrders: false,
    canCreateOrders: false,
    canViewPlanning: false,
    canEditPlanning: false,
    canAccessSettings: false,
    canAccessReports: false,
    canAccessInventory: false,
    canAccessAnalysis: false,
    canAccessPerformance: false,
    canAccessTechMobile: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        const user = data?.user;

        if (!user) {
          setLoading(false);
          return;
        }

        const { data: profile, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Error fetching user role:", error);
          setLoading(false);
          return;
        }

        const role = profile?.role as UserRole;

        console.log("🔍 DEBUG useUserRole:", { email: user?.email, role, profile });

        // Calcular permissões baseadas no role
        const perms: UserPermissions = {
          role,
          isAdmin: role === "admin",
          isGestor: role === "gestor",
          isTecnico: role === "tecnico",
          // Permissões por role
          canViewAssets: role === "admin" || role === "gestor" || role === "tecnico",
          canEditAssets: role === "admin" || role === "gestor",
          canViewOrders: role === "admin" || role === "gestor" || role === "tecnico",
          canCreateOrders: role === "admin" || role === "gestor",
          canViewPlanning: role === "admin" || role === "gestor" || role === "tecnico",
          canEditPlanning: role === "admin" || role === "gestor",
          canAccessSettings: role === "admin",
          canAccessReports: role === "admin" || role === "gestor",
          canAccessInventory: role === "admin" || role === "gestor" || role === "tecnico",
          canAccessAnalysis: role === "admin" || role === "gestor",
          canAccessPerformance: role === "admin" || role === "gestor",
          canAccessTechMobile: role === "admin" || role === "tecnico",
        };

        if (mounted) {
          setPermissions(perms);
          setLoading(false);
        }
      } catch (error) {
        console.error("Error in useUserRole:", error);
        setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return { ...permissions, loading };
}
