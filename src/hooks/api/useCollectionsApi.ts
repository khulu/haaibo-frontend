import useAxios from './useAxios';
import getToken from './useAuthApi';

const baseURL = import.meta.env.VITE_API_BASE_URL;

export interface Collection {
  id: string;
  name: string;
  description?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  companyId?: string | null;
}

const useCollectionsApi = () => {
  const axios = useAxios();
  const tokenApi = getToken();
  const token = tokenApi.getToken();

  const getCollections = async (companyId?: string): Promise<Collection[]> => {
    const response = await axios.request({
      baseURL,
      url: '/Collections',
      method: 'GET',
      params: companyId ? { companyId } : undefined,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return response.data;
  };

  const getCollectionById = async (id: string): Promise<Collection> => {
    const response = await axios.request({
      baseURL,
      url: `/Collections/${id}`,
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return response.data;
  };

  const createCollection = async (payload: { name: string; description?: string | null; companyId?: string | null }): Promise<Collection> => {
    const response = await axios.request({
      baseURL,
      url: '/Collections',
      method: 'POST',
      data: payload,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return response.data;
  };

  const updateCollection = async (id: string, payload: { name?: string; description?: string | null; companyId?: string | null }): Promise<Collection> => {
    const response = await axios.request({
      baseURL,
      url: `/Collections/${id}`,
      method: 'PUT',
      data: payload,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return response.data;
  };

  const deleteCollection = async (id: string): Promise<void> => {
    await axios.request({
      baseURL,
      url: `/Collections/${id}`,
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  };

  const assignAssetToCollection = async (collectionId: string, assetId: string): Promise<{ success: boolean } | unknown> => {
    const response = await axios.request({
      baseURL,
      url: `/Collections/${collectionId}/assign/${assetId}`,
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return response.data;
  };

  return { getCollections, getCollectionById, createCollection, updateCollection, deleteCollection, assignAssetToCollection };
};

export default useCollectionsApi;
