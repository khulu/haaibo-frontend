import useAxios from './useAxios';

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

  // Helper to get token from localStorage
  const getToken = () => {
    let token = null;
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const userObj = JSON.parse(userData);
        token = userObj.token || localStorage.getItem('token');
      } catch {
        token = localStorage.getItem('token');
      }
    } else {
      token = localStorage.getItem('token');
    }
    return token;
  };

  // Fetch all organizations
  const getOrganizations = async (): Promise<Organization[]> => {
    try {
      const token = getToken();
      const response = await axios.request({
        baseURL,
        url: '/Companies',
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
      const token = getToken();
      const response = await axios.request({
        baseURL,
        url: '/Companies',
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
      const token = getToken();
      const response = await axios.request({
        baseURL,
        url: `/Companies/${id}`,
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
      const token = getToken();
      const response = await axios.request({
        baseURL,
        url: `/Companies/${id}`,
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
      const token = getToken();
      await axios.request({
        baseURL,
        url: `/Companies/${id}`,
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
      const token = getToken();
      const formData = new FormData();
      formData.append('file', file);
      const response = await axios.request({
        baseURL,
        url: `/Companies/${id}/logo`,
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
      const token = getToken();
      const response = await axios.request({
        baseURL,
        url: `/Companies/${id}/branding`,
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
