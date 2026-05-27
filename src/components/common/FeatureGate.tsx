import type { ReactNode } from "react";
import useFeatureFlags from "../../hooks/useFeatureFlags";
import type { FeatureFlags } from "../../hooks/api/useFeatureFlagsApi";

interface FeatureGateProps {
  feature: keyof FeatureFlags;
  children: ReactNode;
  fallback?: ReactNode;
}

const FeatureGate = ({ feature, children, fallback = null }: FeatureGateProps) => {
  const flags = useFeatureFlags();

  if (flags[feature]) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};

export default FeatureGate;
