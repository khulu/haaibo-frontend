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
  enableOfficeReservations?: boolean | null;
  reservationMenuLabel?: string | null;
  reportingReservationsMenuLabel?: string | null;
  hotDeskLicences?: number | null;
  allowAssetTracking?: boolean | null;
  enableEmployeeDashboardMenu?: boolean | null;
  employeeDashboardName?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateOrganizationInput = {
  name: string;
  adminUserId?: string | null;
  enableOfficeReservations?: boolean;
  reservationMenuLabel?: string | null;
  reportingReservationsMenuLabel?: string | null;
  hotDeskLicences?: number | null;
  allowAssetTracking?: boolean;
  enableEmployeeDashboardMenu?: boolean;
  employeeDashboardName?: string | null;
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

  // Get the company linked to the current authenticated user
  const getMyCompany = async (): Promise<Organization | null> => {
    try {
      const response = await axios.request({
        baseURL,
        url: '/companies/me',
        method: 'GET',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return response.data as Organization;
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 404) {
        // No company linked to the current user
        return null;
      }
      console.error('getMyCompany error:', error);
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

  // Update settings: enableOfficeReservations, reservationMenuLabel, reportingReservationsMenuLabel, hotDeskLicences, allowAssetTracking, enableEmployeeDashboardMenu, employeeDashboardName
  const updateSettings = async (
    id: string,
    settings: {
      enableOfficeReservations?: boolean;
      reservationMenuLabel?: string | null;
      reportingReservationsMenuLabel?: string | null;
      hotDeskLicences?: number | null;
      allowAssetTracking?: boolean;
      enableEmployeeDashboardMenu?: boolean;
      employeeDashboardName?: string | null;
    }
  ): Promise<Organization> => {
    try {
      const response = await axios.request({
        baseURL,
        url: `/companies/${id}/settings`,
        method: 'PUT',
        data: settings,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return response.data;
    } catch (error) {
      console.error('updateSettings error:', error);
      throw error;
    }
  };

  // Export QR codes as PDF
  const exportQRCodesPDF = async (id: string): Promise<Blob> => {
    try {
      const response = await axios.request({
        baseURL,
        url: `/companies/${id}/export-qr-pdf`,
        method: 'GET',
        responseType: 'blob',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return response.data as Blob;
    } catch (error) {
      console.error('exportQRCodesPDF error:', error);
      throw error;
    }
  };

  return {
    getOrganizations,
    createOrganization,
    getOrganizationById,
    getMyCompany,
    updateOrganization,
    deleteOrganization,
    uploadLogo,
    updateBranding,
    updateSettings,
    exportQRCodesPDF,
  };
};

export default useOrganizationsApi;
