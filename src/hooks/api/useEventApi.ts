import getToken from './useAuthApi';
import useAxios from './useAxios';

const baseURL = import.meta.env.VITE_API_BASE_URL;

export interface Event {
  id: string;
  assetId: string;
  assetTag: string;
  companyId: string;
  companyName: string;
  userId: string;
  userName: string;
  eventType: number;
  entryTime: string;
  exitTime: string | null;
  notes: string;
  createdAt: string;
}

const useEventApi = () => {
  const axios = useAxios();
  const tokenApi = getToken();
  const token = tokenApi.getToken();


  const getEvents = async (params?: { companyId?: string; userId?: string }): Promise<Event[]> => {
    try {

      const response = await axios.request({
        baseURL,
        url: '/Events',
        method: 'GET',
        params: params ? { ...(params.companyId ? { companyId: params.companyId } : {}), ...(params.userId ? { userId: params.userId } : {}) } : undefined,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return response.data;
    } catch (error) {
      console.error('getUsers error:', error);
      throw error;
    }
  };

  return {
   getEvents
  };
};

export default useEventApi;
