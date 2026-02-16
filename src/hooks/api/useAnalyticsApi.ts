import useAxios from './useAxios';
import getAuth from './useAuthApi';
import type { HeatmapResponse } from '../../types/analytics';

const baseURL = import.meta.env.VITE_API_BASE_URL;

export type GetHeatmapParams = {
  companyId?: string;
  from?: string; // YYYY-MM-DD
  to?: string;   // YYYY-MM-DD
  normalize?: boolean;
};

const useAnalyticsApi = () => {
  const { request } = useAxios();
  const token = getAuth().getToken();

  const getHeatmap = async (params: GetHeatmapParams = {}): Promise<HeatmapResponse> => {
    const { companyId, from, to, normalize } = params;
    const query: Record<string, string> = {};
    if (companyId) query.companyId = companyId;
    if (from) query.from = from;
    if (to) query.to = to;
    if (typeof normalize === 'boolean') query.normalize = String(normalize);

    const search = new URLSearchParams(query).toString();

    const res = await request({
      baseURL,
      url: `/analytics/heatmap${search ? `?${search}` : ''}`,
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return res.data as HeatmapResponse;
  };

  return { getHeatmap };
};

export default useAnalyticsApi;
