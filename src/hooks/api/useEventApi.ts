import useAuthApi from './useAuthApi';
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
    const {
    getToken,
  } = useAuthApi();

  const getEvents = async (companyId?: string): Promise<Event[]> => {
    try {
      const token = getToken();
      const response = await axios.request({
        baseURL,
        url: '/Events',
        method: 'GET',
        params: companyId ? { companyId } : undefined,
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
