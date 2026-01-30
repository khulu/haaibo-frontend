import useAxios from './useAxios';
import getToken from './useAuthApi';

const baseURL = import.meta.env.VITE_API_BASE_URL;

export type AdminMetricsParams = {
  companyId?: string | null;
  from?: string;
  to?: string;
  limit?: number;
};

export type AdminMetricsOverview = {
  totalBookings: number;
  totalHoursBooked: number;
  totalHoursUsed: number;
  checkedInCount: number;
  cancelledCount: number;
  noShowCount: number;
  averageBookingDurationMinutes: number;
  checkinRatePercent: number;
  activeUsers?: number;
  mostUsedMarkers: Array<{ markerId: string; markerName: string; count: number }>;
  buckets: Array<{ day: number; hour: number; count: number }>;
  from?: string;
  to?: string;
  openIssues?: Array<{ id: string; description?: string; priority?: string; createdAt?: string }>;
  slaBreaches?: number;
};

const useAdminMetricsApi = () => {
  const axios = useAxios();
  const tokenApi = getToken();
  const token = tokenApi.getToken();

  const getOverview = async (params: AdminMetricsParams = {}): Promise<AdminMetricsOverview> => {
    try {
      const response = await axios.request({
        baseURL,
        url: '/admin/metrics/overview',
        method: 'GET',
        params: {
          companyId: params.companyId,
          from: params.from,
          to: params.to,
          limit: params.limit,
        },
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return response.data;
    } catch (error) {
      console.error('getAdminMetricsOverview error:', error);
      throw error;
    }
  };

  return { getOverview };
};

export default useAdminMetricsApi;
