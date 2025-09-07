import useAxios from './useAxios';
import getToken from './useAuthApi';

const baseURL = import.meta.env.VITE_API_BASE_URL;

export interface Asset {
  id: string;
  make: string | null;
  model: string | null;
  serialNumber: string | null;
  assetId: string | null;
  laptopTagNumber: string | null;
  assignedUserId: string | null;
  assignedUserName: string | null;
  condition: string | null;
  status: number;
  statusName: string | null;
  purchaseDate: string | null;
  warrantyExpiryDate: string | null;
  companyId: string;
  companyName: string | null;
  createdAt: string;
  updatedAt: string;
}

export type CreateLaptopInput = Omit<Asset, 'id' | 'createdAt' | 'updatedAt' | 'statusName' | 'companyName' | 'assignedUserName'>;

export interface AssetHistory {
  id: string;
  action: string;
  performedBy: string;
  performedAt: string;
  details: string;
}

const useAssetApi = () => {
  const axios = useAxios();
  const tokenApi = getToken();
  const token = tokenApi.getToken();

  // Fetch all assets for a company
  const getAssetsByCompany = async (companyId?: string): Promise<Asset[]> => {
    try {

      const url = companyId ? `/Assets/${companyId}` : '/Assets';
      const response = await axios.request({
        baseURL,
        url,
        method: 'GET',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return response.data;
    } catch (error) {
      console.error('getLaptopsByCompany error:', error);
      throw error;
    }
  };

  // Fetch a single laptop by ID
  const getAssetById = async (id: string): Promise<Asset> => {
    try {
      const response = await axios.request({
        baseURL,
        url: `/Assets/single/${id}`,
        method: 'GET',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return response.data;
    } catch (error) {
      console.error('getLaptopById error:', error);
      throw error;
    }
  };

  // Create a new laptop
  const createAsset = async (laptop: CreateLaptopInput): Promise<Asset> => {
    try {
      const response = await axios.request({
        baseURL,
        url: '/Assets',
        method: 'POST',
        data: laptop,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return response.data;
    } catch (error) {
      console.error('createLaptop error:', error);
      throw error;
    }
  };

  // Update an existing laptop
  const updateAsset = async (id: string, laptop: Partial<CreateLaptopInput>): Promise<Asset> => {
    try {
      const response = await axios.request({
        baseURL,
        url: `/Assets/${id}`,
        method: 'PUT',
        data: laptop,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return response.data;
    } catch (error) {
      console.error('updateLaptop error:', error);
      throw error;
    }
  };

  // Delete a laptop by ID
  const deleteAsset = async (id: string): Promise<void> => {
    try {
      await axios.request({
        baseURL,
        url: `/Assets/${id}`,
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch (error) {
      console.error('deleteLaptop error:', error);
      throw error;
    }
  };

  // Upload an asset-related file
  const uploadAssetFile = async (id: string, file: File): Promise<void> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      await axios.request({
        baseURL,
        url: `/Assets/${id}/upload`,
        method: 'POST',
        data: formData,
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'Content-Type': 'multipart/form-data',
        },
      });
    } catch (error) {
      console.error('uploadAssetFile error:', error);
      throw error;
    }
  };

  // Fetch the history of an asset
  const getAssetHistory = async (id: string): Promise<AssetHistory[]> => {
    try {
      const response = await axios.request({
        baseURL,
        url: `/Assets/${id}/history`,
        method: 'GET',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return response.data;
    } catch (error) {
      console.error('getAssetHistory error:', error);
      throw error;
    }
  };

  return {
    getAssetsByCompany,
    getAssetById,
    createAsset,
    updateAsset,
    deleteAsset,
    uploadAssetFile,
    getAssetHistory,
  };
};

export default useAssetApi;