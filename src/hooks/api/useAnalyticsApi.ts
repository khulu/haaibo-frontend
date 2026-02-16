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

    try {
      const res = await request({
        baseURL,
        url: `/analytics/heatmap${search ? `?${search}` : ''}`,
        method: 'GET',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      return res.data as HeatmapResponse;
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as any).response === 'object'
      ) {
        const status = (error as any).response.status;
        if (status === 401) throw new Error('Unauthorized. Please log in again.');
        if (status === 404) throw new Error('Heatmap data not found.');
        if (status === 500) throw new Error('Server error. Please try again later.');
        throw new Error((error as any).response.data?.message || 'API error occurred.');
      } else if (
        typeof error === 'object' &&
        error !== null &&
        'request' in error
      ) {
        throw new Error('No response from server. Check your network connection.');
      } else if (error instanceof Error) {
        throw new Error(error.message || 'Unknown error occurred.');
      } else {
        throw new Error('Unknown error occurred.');
      }
    }
  };

  return { getHeatmap };
};

export default useAnalyticsApi;
