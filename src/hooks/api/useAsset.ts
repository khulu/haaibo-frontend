import useAxios from './useAxios';

const baseURL = import.meta.env.VITE_API_BASE_URL;

export interface Laptop {
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

export type CreateLaptopInput = Omit<Laptop, 'id' | 'createdAt' | 'updatedAt' | 'statusName' | 'companyName' | 'assignedUserName'>;

const useAssetApi = () => {
  const axios = useAxios();

  const getToken = () => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const userObj = JSON.parse(userData);
        return userObj.token || localStorage.getItem('token');
      } catch {
        return localStorage.getItem('token');
      }
    }
    return localStorage.getItem('token');
  };

  // Fetch all assets for a company
  const getAssetsByCompany = async (companyId: string): Promise<Laptop[]> => {
    try {
      const token = getToken();
      const response = await axios.request({
        baseURL,
        url: `/Laptops/${companyId}`,
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
  const getAssetById = async (id: string): Promise<Laptop> => {
    try {
      const token = getToken();
      const response = await axios.request({
        baseURL,
        url: `/Laptops/single/${id}`,
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
  const createAsset = async (laptop: CreateLaptopInput): Promise<Laptop> => {
    try {
      const token = getToken();
      const response = await axios.request({
        baseURL,
        url: '/Laptops',
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
  const updateAsset = async (id: string, laptop: Partial<CreateLaptopInput>): Promise<Laptop> => {
    try {
      const token = getToken();
      const response = await axios.request({
        baseURL,
        url: `/Laptops/${id}`,
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
      const token = getToken();
      await axios.request({
        baseURL,
        url: `/Laptops/${id}`,
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch (error) {
      console.error('deleteLaptop error:', error);
      throw error;
    }
  };

  return {
    getAssetsByCompany,
    getAssetById,
    createAsset,
    updateAsset,
    deleteAsset,
  };
};

export default useAssetApi;