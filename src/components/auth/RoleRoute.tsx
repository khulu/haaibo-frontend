import { Navigate } from "react-router-dom";
import { ReactNode } from "react";
import { normalizeRole } from "../../utils/roles";

type RoleRouteProps = {
  children: ReactNode;
  allowed: number[];
  redirectTo?: string; // custom redirect when role is not allowed
};

export default function RoleRoute({ children, allowed, redirectTo }: RoleRouteProps) {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/signin" replace />;

  let userRole: number | null = null;
  try {
    const raw = localStorage.getItem("user");
    if (raw) {
      const parsed = JSON.parse(raw);
      userRole = normalizeRole(parsed?.role);
    }
  } catch {
    userRole = null;
  }

  const isAllowed = userRole !== null && allowed.includes(userRole);
  return isAllowed ? children : <Navigate to={redirectTo || "/unauthorized"} replace />;
}
