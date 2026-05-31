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
  imageUrls?: string[];
}

export interface BulkAsset {
  id: string;
  make: string | null;
  model: string | null;
  serialNumber: string | null;
  assetId: string | null;
  laptopTagNumber: string | null;
  assignedUserId: string | null;
  assignedUserName: string | null;
  condition: string | null;
  // status should always be a string for bulk upload
  status: string | null;
  statusName: string | null;
  purchaseDate: string | null;
  warrantyExpiryDate: string | null;
  companyId?: string;
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
  const { request } = useAxios();
  const tokenApi = getToken();
  const token = tokenApi.getToken();

  // Fetch all assets with optional filters
  const getAssetsByCompany = async (params?: {
    companyId?: string;
    search?: string;
    status?: number;
    assignedUserId?: string;
    collectionId?: string;
    limit?: number;
  }): Promise<Asset[]> => {
    try {
      const response = await request({
        baseURL,
        url: '/Assets',
        method: 'GET',
        params: params || undefined,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return response.data;
    } catch (error) {
      console.error('getAssetsByCompany error:', error);
      throw error;
    }
  };

  // Fetch a single laptop by ID
  const getAssetById = async (id: string): Promise<Asset> => {
    try {
      const response = await request({
        baseURL,
        url: `/Assets/single/${id}`,
        method: 'GET',
        params: undefined,
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
    // Ensure status is a number for single asset creation
    const payload = { ...laptop, status: Number(laptop.status) };
    try {
      const response = await request({
        baseURL,
        url: '/Assets',
        method: 'POST',
        data: payload,
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
      const response = await request({
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
      await request({
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
      await request({
        baseURL,
        url: `/Assets/${id}/upload`,
        method: 'POST',
        data: formData,
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
      const response = await request({
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


  // bulkUploadAssets expects status as string (not number)
  const bulkUploadAssets = async (assets: Omit<BulkAsset, 'id' | 'createdAt' | 'updatedAt' | 'statusName' | 'companyName' | 'assignedUserName'>[]): Promise<BulkAsset[]> => {
    // Ensure status is a string for bulk upload
    const mappedAssets = assets.map(asset => ({ ...asset, status: asset.status !== null && asset.status !== undefined ? String(asset.status) : null }));
    try {
      const response = await request({
        baseURL,
        url: '/Assets/bulk-upload',
        method: 'POST',
        data: mappedAssets, 
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return response.data;
    } catch (error) {
      console.error('bulkUploadAssets error:', error);
      throw error;
    }
  };

  // Upload an asset picture
  const uploadAssetPicture = async (id: string, file: File): Promise<void> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      await request({
        baseURL,
        url: `/Assets/${id}/pictures`,
        method: 'POST',
        data: formData,
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
    } catch (error) {
      console.error('uploadAssetPicture error:', error);
      throw error;
    }
  };

  // Get total assets (optionally by companyId)
  const getTotalAssets = async (companyId?: string): Promise<number> => {
    try {
      const response = await request({
        baseURL,
        url: '/Assets/total',
        method: 'GET',
        params: companyId ? { companyId } : undefined,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return response.data;
    } catch (error) {
      console.error('getTotalAssets error:', error);
      throw error;
    }
  };

  // Fetch a single asset by serial number
  const getAssetBySerial = async (serial: string): Promise<Asset> => {
    try {
      const response = await request({
        baseURL,
        url: `/Assets/serial/${encodeURIComponent(serial)}`,
        method: 'GET',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return response.data;
    } catch (error) {
      console.error('getAssetBySerial error:', error);
      throw error;
    }
  };

  // Scan an asset in via the Scanner endpoint
  const scanAsset = async (tagOrSerial: string, photo?: File): Promise<unknown> => {
    const formData = new FormData();
    formData.append('TagOrSerial', tagOrSerial);
    if (photo) {
      formData.append('Photo', photo);
    }
    try {
      const response = await request({
        baseURL,
        url: '/Scanner/scan',
        method: 'POST',
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      return response.data;
    } catch (error) {
      console.error('scanAsset error:', error);
      throw error;
    }
  };

  // Scan an asset out via the Scanner endpoint
  const scanOutAsset = async (tagOrSerial: string, photo?: File): Promise<unknown> => {
    const formData = new FormData();
    formData.append('TagOrSerial', tagOrSerial);
    if (photo) {
      formData.append('Photo', photo);
    }
    try {
      const response = await request({
        baseURL,
        url: '/Scanner/scan-out',
        method: 'POST',
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      return response.data;
    } catch (error) {
      console.error('scanOutAsset error:', error);
      throw error;
    }
  };

  return {
    getAssetsByCompany,
    getAssetById,
    getAssetBySerial,
    scanAsset,
    scanOutAsset,
    createAsset,
    updateAsset,
    deleteAsset,
    uploadAssetFile,
    getAssetHistory,
    bulkUploadAssets,
    uploadAssetPicture,
    getTotalAssets,
  };
};

export default useAssetApi;