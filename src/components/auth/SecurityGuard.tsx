import { Navigate, useLocation } from "react-router-dom";
import { ReactNode } from "react";
import { isSecurityRole, normalizeRole } from "../../utils/roles";

const SECURITY_ALLOWED_PATHS = ["/asset-scan", "/unauthorized"];

/**
 * Wraps routes inside AppLayout to redirect Security role users
 * to /asset-scan unless they are on an allowed path.
 */
export default function SecurityGuard({ children }: { children: ReactNode }) {
  const location = useLocation();

  let role: number | null = null;
  try {
    const raw = localStorage.getItem("user");
    if (raw) {
      const parsed = JSON.parse(raw);
      role = normalizeRole(parsed?.role);
    }
  } catch {
    role = null;
  }

  const isSecurity = isSecurityRole(role);

  if (isSecurity && !SECURITY_ALLOWED_PATHS.includes(location.pathname)) {
    return <Navigate to="/asset-scan" replace />;
  }

  return <>{children}</>;
}
