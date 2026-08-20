import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import useFeatureFlagsApi, { type FeatureFlags } from "../hooks/api/useFeatureFlagsApi";

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

  useEffect(() => {
    let cancelled = false;

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
        const role = user?.role;
        isSuperAdmin = role === 0 || role === "0" || role === "SuperAdmin";
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
      }
      setLoading(false);
    }

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <FeatureFlagsContext.Provider value={{ flags, loading }}>
      {children}
    </FeatureFlagsContext.Provider>
  );
};

export const useFeatureFlagsContext = () => useContext(FeatureFlagsContext);

export default FeatureFlagsContext;
