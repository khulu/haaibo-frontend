import useAxios from './useAxios';
import getToken from './useAuthApi';

const baseURL = import.meta.env.VITE_API_BASE_URL;

export interface Organization {
  id: string;
  name: string;
  logo?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  adminUserId?: string | null;
  adminUserName?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateOrganizationInput = {
  name: string;
  adminUserId?: string | null;
};

const useOrganizationsApi = () => {
  const axios = useAxios();
  const tokenApi = getToken();
  const token = tokenApi.getToken();

  // Fetch all organizations
  const getOrganizations = async (): Promise<Organization[]> => {
    try {

      const response = await axios.request({
        baseURL,
        url: '/companies',
        method: 'GET',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return response.data;
    } catch (error) {
      console.error('getOrganizations error:', error);
      throw error;
    }
  };

  // Create a new organization
  const createOrganization = async (org: CreateOrganizationInput): Promise<Organization> => {
    try {
      const response = await axios.request({
        baseURL,
        url: '/companies',
        method: 'POST',
        data: org,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return response.data;
    } catch (error) {
      console.error('createOrganization error:', error);
      throw error;
    }
  };

  // Get a single organization by id
  const getOrganizationById = async (id: string): Promise<Organization> => {
    try {
      const response = await axios.request({
        baseURL,
        url: `/companies/${id}`,
        method: 'GET',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return response.data;
    } catch (error) {
      console.error('getOrganizationById error:', error);
      throw error;
    }
  };

  // Update an organization
  const updateOrganization = async (id: string, org: Partial<CreateOrganizationInput>): Promise<Organization> => {
    try {
      const response = await axios.request({
        baseURL,
        url: `/companies/${id}`,
        method: 'PUT',
        data: org,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return response.data;
    } catch (error) {
      console.error('updateOrganization error:', error);
      throw error;
    }
  };

  // Delete an organization
  const deleteOrganization = async (id: string): Promise<void> => {
    try {
      await axios.request({
        baseURL,
        url: `/companies/${id}`,
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch (error) {
      console.error('deleteOrganization error:', error);
      throw error;
    }
  };

  // Upload organization logo (multipart/form-data)
  const uploadLogo = async (id: string, file: File): Promise<Organization> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await axios.request({
        baseURL,
        url: `/companies/${id}/logo`,
        method: 'POST',
        data: formData,
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('uploadLogo error:', error);
      throw error;
    }
  };

  // Update branding
  const updateBranding = async (id: string, branding: { primaryColor?: string; secondaryColor?: string }): Promise<Organization> => {
    try {
      const response = await axios.request({
        baseURL,
        url: `/companies/${id}/branding`,
        method: 'PUT',
        data: branding,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return response.data;
    } catch (error) {
      console.error('updateBranding error:', error);
      throw error;
    }
  };

  return {
    getOrganizations,
    createOrganization,
    getOrganizationById,
    updateOrganization,
    deleteOrganization,
    uploadLogo,
    updateBranding,
  };
};

export default useOrganizationsApi;
