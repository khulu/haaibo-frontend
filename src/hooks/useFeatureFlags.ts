import { useFeatureFlagsContext } from "../context/FeatureFlagsContext";

const useFeatureFlags = () => {
  const { flags, loading } = useFeatureFlagsContext();
  return { ...flags, loading };
};

export default useFeatureFlags;
