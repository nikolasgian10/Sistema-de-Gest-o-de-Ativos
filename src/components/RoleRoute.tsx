import { Navigate } from "react-router-dom";
import { useUserRole, UserRole } from "@/hooks/useUserRole";

interface RoleRouteProps {
  children: React.ReactNode;
  requiredRoles: UserRole[];
}

export function RoleRoute({ children, requiredRoles }: RoleRouteProps) {
  const { role, loading } = useUserRole();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!requiredRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
