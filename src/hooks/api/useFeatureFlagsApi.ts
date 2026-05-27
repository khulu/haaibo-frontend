import useAxios from './useAxios';
import getAuth from './useAuthApi';

const baseURL = import.meta.env.VITE_API_BASE_URL;

export interface FeatureFlags {
  assetTracking: boolean;
  deskBooking: boolean;
  integration: boolean;
}

const useFeatureFlagsApi = () => {
  const { request } = useAxios();
  const auth = getAuth();
  const token = auth.getToken();

  const getFeatureFlags = async (): Promise<FeatureFlags> => {
    const response = await request({
      baseURL,
      url: '/api/features',
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return response.data;
  };

  return { getFeatureFlags };
};

export default useFeatureFlagsApi;
