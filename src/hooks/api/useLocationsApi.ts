import useAxios from './useAxios';
import getAuth from './useAuthApi';

const baseURL = import.meta.env.VITE_API_BASE_URL;

export type LocationDto = {
  id: string;
  name: string;
  color?: string | null;
  parentId?: string | null;
  companyId: string;
  createdAt: string;
  updatedAt: string;
  children: LocationDto[];
};

export type CreateLocationDto = {
  name: string;
  color?: string | null;
  parentId?: string | null;
  companyId: string;
};

export type UpdateLocationDto = {
  name?: string;
  color?: string | null;
  parentId?: string | null;
};

const useLocationsApi = () => {
  const axios = useAxios();
  const auth = getAuth();
  const token = auth.getToken();

  const listTree = async (companyId?: string): Promise<LocationDto[]> => {
    const response = await axios.request({
      baseURL,
      url: '/locations',
      method: 'GET',
      params: companyId ? { companyId } : undefined,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return response.data as LocationDto[];
  };

  const getSingle = async (id: string): Promise<LocationDto> => {
    const response = await axios.request({
      baseURL,
      url: `/locations/${id}`,
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return response.data as LocationDto;
  };

  const create = async (payload: CreateLocationDto): Promise<LocationDto> => {
    const response = await axios.request({
      baseURL,
      url: '/locations',
      method: 'POST',
      data: payload,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return response.data as LocationDto;
  };

  const update = async (id: string, data: UpdateLocationDto): Promise<LocationDto> => {
    const response = await axios.request({
      baseURL,
      url: `/locations/${id}`,
      method: 'PUT',
      data,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return response.data as LocationDto;
  };

  const remove = async (id: string): Promise<void> => {
    await axios.request({
      baseURL,
      url: `/locations/${id}`,
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  };

  return { listTree, getSingle, create, update, remove };
};

export default useLocationsApi;
