import { Navigate } from "react-router-dom";
import { ReactNode } from "react";

type Role = number | string;

type RoleRouteProps = {
  children: ReactNode;
  allowed: Role[]; // e.g., [0, "SuperAdmin"], [1, "Admin"], [2, "Employee"]
};

export default function RoleRoute({ children, allowed }: RoleRouteProps) {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/signin" replace />;

  let userRole: Role | null = null;
  try {
    const raw = localStorage.getItem("user");
    if (raw) {
      const parsed = JSON.parse(raw);
      userRole = parsed?.role ?? null;
    }
  } catch {
    userRole = null;
  }

  const isAllowed = userRole !== null && allowed.includes(userRole);
  return isAllowed ? children : <Navigate to="/unauthorized" replace />;
}
