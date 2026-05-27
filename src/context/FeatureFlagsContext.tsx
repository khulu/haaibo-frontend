import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import useFeatureFlagsApi, { type FeatureFlags } from "../hooks/api/useFeatureFlagsApi";

type FeatureFlagsContextType = {
  flags: FeatureFlags;
  loading: boolean;
};

const defaultFlags: FeatureFlags = {
  assetTracking: true,
  deskBooking: true,
  integration: true,
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
        // On error, keep defaults (all features enabled) so the app doesn't break
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    // Only fetch if user is authenticated
    const token = localStorage.getItem("token");
    if (token) {
      fetchFlags();
    } else {
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
