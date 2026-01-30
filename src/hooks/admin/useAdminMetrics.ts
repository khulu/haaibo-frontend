import useAdminMetricsApi from '@hooks/api/useAdminMetricsApi';
import { useQuery } from '@tanstack/react-query';

const QueryKeyBase = ['admin', 'metrics'];

const useAdminMetrics = () => {
  const api = useAdminMetricsApi();

  const useMetricsOverview = (params?: { companyId?: string | null; from?: string; to?: string; limit?: number }) =>
    useQuery({
      queryKey: [...QueryKeyBase, 'overview', params?.companyId ?? 'all', params?.from ?? '', params?.to ?? ''],
      queryFn: () => api.getOverview(params ?? {}),
      staleTime: 1000 * 60 * 2, // 2 minutes
    });

  return { useMetricsOverview };
};

export default useAdminMetrics;
