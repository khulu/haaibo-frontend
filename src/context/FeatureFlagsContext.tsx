import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import useFeatureFlagsApi, { type FeatureFlags } from "../hooks/api/useFeatureFlagsApi";
import { isSuperAdminRole, normalizeRole } from "../utils/roles";

type FeatureFlagsContextType = {
  flags: FeatureFlags;
  loading: boolean;
};

const defaultFlags: FeatureFlags = {
  assetTracking: false,
  deskBooking: false,
  integration: false,
};

const FeatureFlagsContext = createContext<FeatureFlagsContextType>({
  flags: defaultFlags,
  loading: true,
});

export const FeatureFlagsProvider = ({ children }: { children: ReactNode }) => {
  const { getFeatureFlags } = useFeatureFlagsApi();
  const [flags, setFlags] = useState<FeatureFlags>(defaultFlags);
  const [loading, setLoading] = useState(true);
  const [authVersion, setAuthVersion] = useState(0);

  useEffect(() => {
    const handleAuthChanged = () => setAuthVersion((v) => v + 1);
    window.addEventListener("auth-changed", handleAuthChanged);
    return () => window.removeEventListener("auth-changed", handleAuthChanged);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const fetchFlags = async () => {
      try {
        const data = await getFeatureFlags();
        if (!cancelled) {
          setFlags(data);
        }
      } catch {
        // On error, enable all features so the app doesn't break
        if (!cancelled) {
          setFlags({ assetTracking: true, deskBooking: true, integration: true });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    // Skip fetching for super admins — they always get all features enabled
    let isSuperAdmin = false;
    try {
      const raw = localStorage.getItem("user");
      if (raw) {
        const user = JSON.parse(raw);
        const role = normalizeRole(user?.role);
        isSuperAdmin = isSuperAdminRole(role);
      }
    } catch {
      // ignore parse errors
    }

    // Only fetch if user is authenticated and not a super admin
    const token = localStorage.getItem("token");
    if (token && !isSuperAdmin) {
      fetchFlags();
    } else {
      if (isSuperAdmin) {
        setFlags({ assetTracking: true, deskBooking: true, integration: true });
      } else {
        setFlags(defaultFlags);
      }
      setLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [authVersion, getFeatureFlags]);

  return (
    <FeatureFlagsContext.Provider value={{ flags, loading }}>
      {children}
    </FeatureFlagsContext.Provider>
  );
};

export const useFeatureFlagsContext = () => useContext(FeatureFlagsContext);

export default FeatureFlagsContext;
